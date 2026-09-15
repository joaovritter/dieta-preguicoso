# Refeições do usuário

Entrega 1 de 3. Troca o conjunto fixo de cinco refeições por um conjunto que
cada pessoa monta, sem nunca pedir configuração de horário para quem não quer.

- **Entrega 2** — perfil e metas (timezone automático, calorias → macros em %).
- **Entrega 3** — onboarding em passos e água personalizável.

## Problema

`refeicao` é um ENUM de cinco valores no Postgres, repetido como constante em
`backend/src/domain/tipos.ts` e usado em oito lugares do backend e seis do
frontend. Quem treina às 16h e come antes não tem onde registrar isso: cai em
"lanche" junto com o café da tarde, e o resumo do dia mistura os dois.

As faixas de horário moram em `users.faixas_refeicao` (JSONB) e aparecem na tela
de perfil como dez campos de hora. É configuração que quase ninguém quer mexer,
ocupando o espaço de coisas que importam.

## O que muda para quem usa

As cinco refeições continuam existindo, com os mesmos horários de hoje, e
ninguém precisa configurar nada. Quem quiser cria uma refeição nova dando o nome
e a janela dela ("Pré-treino", das 15:00 às 17:00); as vizinhas se reacomodam
sozinhas. Os dez campos de hora somem do perfil.

A classificação continua sendo pelo relógio, não pela IA. Isso é deliberado: a
promessa do app é nunca perguntar qual refeição é, e o horário responde isso sem
custo nem erro. A IA identifica **o que** você comeu; o relógio identifica
**quando**. Uma refeição extra só muda o resultado porque traz a própria janela.

## Modelo de dados

```sql
CREATE TABLE refeicoes_usuario (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome      TEXT NOT NULL,
  inicio    CHAR(5) NOT NULL,   -- "HH:MM"
  fim       CHAR(5) NOT NULL,   -- pode ser menor que inicio (cruza a meia-noite)
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_refeicoes_usuario_nome ON refeicoes_usuario (user_id, lower(nome));
CREATE INDEX idx_refeicoes_usuario_user ON refeicoes_usuario (user_id, inicio);
```

Sem coluna `ordem`, ao contrário do esboço aprovado: a ordem de exibição é
`inicio`, que já é a ordem em que as refeições acontecem no dia. Uma coluna a
mais seria um segundo lugar para a mesma verdade, e reordenar viraria duas
escritas onde uma basta.

`registros_alimentares.refeicao` (ENUM) vira `refeicao_id UUID NOT NULL
REFERENCES refeicoes_usuario(id) ON DELETE RESTRICT`. O `RESTRICT` é regra de
negócio: refeição com registro não se apaga, porque apagar reescreveria o
histórico do dia. A API devolve `REFEICAO_EM_USO` e o app oferece renomear.

`users.faixas_refeicao` é removida na mesma migration. O tipo `Refeicao`, o
array `REFEICOES` e `FAIXAS_PADRAO` saem de `domain/tipos.ts`; as cinco padrão
viram semente da migration e uma constante `REFEICOES_INICIAIS` usada em um
lugar só: `POST /auth/register` passa a criar a conta e as cinco refeições na
mesma transação, porque conta sem refeição nenhuma não conseguiria registrar
comida.

`CodigoErro` ganha `REFEICAO_EM_USO` (409) em `lib/erros.ts`, ao lado dos
existentes.

## Migration 003

Roda numa transação. Ordem:

1. `CREATE TABLE refeicoes_usuario` e índices.
2. Semear as refeições de cada usuário **a partir do `faixas_refeicao` dele**,
   não do padrão — quem já customizou os horários mantém o que tinha. Os nomes
   vêm de um `CASE`: `cafe_da_manha` → "Café da manhã", e assim por diante.
3. `ALTER TABLE registros_alimentares ADD COLUMN refeicao_id UUID`.
4. `UPDATE` casando `registros.user_id` + `registros.refeicao` com a linha
   semeada correspondente.
5. `ALTER COLUMN refeicao_id SET NOT NULL`, adicionar a FK, `DROP COLUMN
   refeicao`, `DROP TYPE refeicao`, `ALTER TABLE users DROP COLUMN
   faixas_refeicao`.

O passo 5 não é reversível por migration. A volta é o dump. **Antes de rodar na
VPS:**

```bash
docker compose exec -T postgres pg_dump -U dieta dieta | gzip > ~/backups/antes-003-$(date +%F).sql.gz
```

A verificação de que a migração dos dados fechou, antes do `DROP`, é um `ASSERT`
dentro de um bloco `DO`: nenhum registro pode ficar com `refeicao_id` nulo. Se
sobrar um, a transação inteira volta e ninguém perde nada.

## API

Tipo novo no contrato:

```ts
interface Refeicao { id: string; nome: string; inicio: string; fim: string; }
```

`Registro.refeicao` (ENUM) vira dois campos planos, no estilo das outras
colunas: `refeicao_id: string` e `refeicao_nome: string`. O nome viaja junto
porque o feed e o histórico precisam exibi-lo sem uma segunda consulta.

| Rota | Efeito |
|---|---|
| `GET /api/refeicoes` | lista as refeições do usuário, ordenadas por `inicio` |
| `POST /api/refeicoes` | `{ nome, inicio, fim }` → cria e reacomoda as vizinhas |
| `PATCH /api/refeicoes/:id` | `{ nome?, inicio?, fim? }` → renomeia; mexer na janela reacomoda as vizinhas pela mesma regra do `POST` |
| `DELETE /api/refeicoes/:id` | `204`, ou `409 REFEICAO_EM_USO` se houver registro |

`Perfil` perde `faixas_refeicao`. `POST /api/registros` e `PATCH
/api/registros/:id` trocam `refeicao` por `refeicao_id`, validado como
pertencente a quem chamou — sem isso, o id de outra pessoa entraria no seu
histórico. `/dia` e `/resumo` agrupam pela lista do usuário, na ordem dela, no
lugar do `REFEICOES.map` de hoje.

`refeicao_sugerida` em `POST /api/registros/interpretar` passa a devolver o
objeto `Refeicao` inteiro, não só o id: a tela de confirmação mostra o nome.

## Reacomodar as vizinhas

O dia é uma partição contígua de 1440 minutos: toda hora pertence a exatamente
uma refeição, sem buraco nem sobreposição. `acomodar(existentes, nova)` em
`domain/refeicao.ts`, pura e testável:

- Quem sobrepõe a nova janela pela direita tem o `inicio` empurrado para
  `nova.fim + 1min`; pela esquerda, o `fim` recua para `nova.inicio - 1min`.
- Se a nova janela **engole** uma refeição inteira, a operação é recusada com
  `VALIDACAO` ("essa faixa cobre a Janta inteira; escolha outra"). Apagar a
  vizinha por conta própria seria decidir pelo usuário algo que ele não pediu.
- A nova janela não pode cruzar a meia-noite. Só a última refeição do dia faz
  isso, e ela já existe; permitir na criação abriria um caso de partição
  circular que não paga o que custa.

`detectarRefeicao` passa a receber `Refeicao[]` do banco e a devolver a refeição
inteira em vez do enum. O fallback de hoje (nenhuma faixa casa → a mais próxima
para trás) deixa de ser alcançável, porque a partição não tem buraco, mas fica
no código como rede de segurança e continua testado.

## Frontend

`NOME_REFEICAO` e `REFEICOES` saem de `lib/format`. A lista vem da API uma vez
por sessão, junto do perfil, e fica num contexto — os seis componentes que hoje
leem a constante passam a ler dele.

`FaixasHorario.tsx` é apagado. No lugar, no perfil, uma seção "Refeições" que
lista as refeições com o horário ao lado e tem um "+ nova refeição" abrindo nome
e janela. Editar o horário das cinco padrão fica de fora desta entrega: você
pediu horário automático, e a seção existe para as extras.

## Testes

Vitest, sem rede, em cima do que é cálculo:

- `acomodar`: empurra a vizinha à direita, recua a da esquerda, recusa engolir,
  recusa cruzar a meia-noite, e mantém a partição contígua depois de N inserções.
- `detectarRefeicao`: com lista customizada, no limite exato de cada faixa, na
  refeição que cruza a meia-noite, e com uma refeição extra no meio do dia.
- Migration: rodada contra um banco semeado, conferindo que a contagem de
  registros por refeição bate antes e depois.

## Riscos

**A migration é a parte perigosa do pacote.** Ela reescreve a coluna `refeicao`
de todos os registros e derruba a coluna antiga. Mitigação: transação única,
`ASSERT` antes do `DROP`, dump antes de rodar, e rodar com o app parado
(`docker compose stop backend`) para não haver escrita concorrente.

**A janela de incompatibilidade entre frontend e backend.** Como `refeicao` vira
`refeicao_id` no payload, um frontend velho com backend novo quebra na tela de
registro. Os dois sobem juntos no mesmo `docker compose up -d --build`, então a
janela é o tempo do build — aceitável para um app de uso pessoal, e não vale o
custo de versionar a API por causa disso.

## Fora de escopo

Reordenar refeições manualmente, apagar refeição com histórico, refeição que
vale só em alguns dias da semana, e a IA sugerir a refeição pelo conteúdo do
prato. Nenhuma dessas apareceu no pedido, e cada uma custa mais que o valor que
entrega agora.
