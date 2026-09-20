# Contrato da API — dieta-preguicoso

Fonte da verdade para backend e frontend. Se algo aqui divergir do código, o código está errado.

Base URL: `/api`. Todas as respostas são JSON.
Autenticação: header `Authorization: Bearer <jwt>` em tudo, exceto `/auth/*` e `/health`.

## Convenções

- Datas de dia: string `YYYY-MM-DD` (fuso do usuário, ver `timezone` no perfil).
- Timestamps: ISO 8601 UTC.
- Números nutricionais: `number` (gramas ou kcal), sempre arredondados a 1 casa no backend.
- Erro: `{ "error": { "code": "STRING_CODE", "message": "texto humano" } }` com status HTTP adequado.
  Códigos: `VALIDACAO`, `NAO_AUTORIZADO`, `CREDENCIAIS_INVALIDAS`, `EMAIL_EM_USO`,
  `NAO_ENCONTRADO`, `IA_INDISPONIVEL`, `IA_RESPOSTA_INVALIDA`, `ARQUIVO_INVALIDO`, `ERRO_INTERNO`,
  `SEM_ACESSO`, `PEDIDO_DUPLICADO`, `REFEICAO_EM_USO`, `SENHA_INCORRETA`, `LIMITE_EXCEDIDO`,
  `CONTA_DESATIVADA`.
- Conta desativada: **qualquer** rota autenticada responde `403 CONTA_DESATIVADA`; o cliente trata
  como fim de sessão (igual a 401) e mostra a mensagem no login.

## Tipos compartilhados

```ts
type TipoEntrada = 'foto' | 'audio' | 'texto';
type Objetivo = 'perder_peso' | 'manter' | 'ganhar_massa';
type Sexo = 'M' | 'F';

interface Alimento {
  nome: string;
  quantidade_estimada: string;   // ex: "150g", "1 unidade"
  calorias: number;
  carboidrato_g: number;
  proteina_g: number;
  gordura_g: number;
}

interface Refeicao { id: string; nome: string; inicio: string; fim: string; } // "HH:MM"

interface Perfil {
  id: string;
  email: string;
  nome: string;
  tag: string;                   // 4 dígitos, ex: "0427" — a identidade pública é `nome#tag`
  sexo: Sexo | null;
  idade: number | null;
  peso_kg: number | null;
  altura_cm: number | null;
  objetivo: Objetivo;
  meta_calorias: number;
  meta_carboidrato_g: number;
  meta_proteina_g: number;
  meta_gordura_g: number;
  meta_agua_ml: number;
  metas_automaticas: boolean;    // true = recalcula metas a partir de peso/altura/idade/sexo/objetivo
  modo_preguicoso: boolean;      // true = grava sem tela de confirmação
  timezone: string;              // ex: "America/Sao_Paulo"
  criado_em: string;
}

interface Registro {
  id: string;
  tipo_entrada: TipoEntrada;
  refeicao_id: string;
  refeicao_nome: string;
  descricao_bruta: string;
  midia_url: string | null;
  alimentos_detectados: Alimento[];
  calorias_total: number;
  carboidrato_total_g: number;
  proteina_total_g: number;
  gordura_total_g: number;
  criado_em: string;
}

/** Resultado de uma interpretação da IA, ainda não gravada. */
interface Interpretacao {
  tipo_entrada: TipoEntrada;
  descricao_bruta: string;
  midia_url: string | null;
  refeicao_sugerida: Refeicao;
  alimentos: Alimento[];
  totais: { calorias: number; carboidrato_g: number; proteina_g: number; gordura_g: number };
  /** Presente só quando o perfil tem modo_preguicoso=true: o registro já foi gravado. */
  registro?: Registro;
}
```

## Endpoints

### `GET /api/health`
`200 { ok: true }`. Sem auth.

### `POST /api/auth/register`
Body: `{ email, senha, nome }` (senha mínimo 8 chars).
`201 { token, perfil }` · `409 EMAIL_EM_USO`

### `POST /api/auth/login`
Body: `{ email, senha }` → `200 { token, perfil }` · `401 CREDENCIAIS_INVALIDAS` ·
`403 CONTA_DESATIVADA` ("conta desativada — fale com o administrador"). O 403 só aparece para
quem acertou a senha: senha errada numa conta desativada continua `401`.

### `GET /api/me` → `200 Perfil`

### `PUT /api/me`
Body: qualquer subconjunto de
`{ nome, sexo, idade, peso_kg, altura_cm, objetivo, meta_calorias, meta_carboidrato_g,
   meta_proteina_g, meta_gordura_g, meta_agua_ml, metas_automaticas, modo_preguicoso,
   timezone }`
→ `200 Perfil` (já com metas recalculadas se `metas_automaticas`).

`meta_calorias` nunca é gravado com o valor que veio no body: com `metas_automaticas: true` o
servidor recalcula todas as metas pelo TMB (ver "Cálculo automático de metas"); com
`metas_automaticas: false` o servidor recalcula só `meta_calorias`, a partir de
`4×meta_carboidrato_g + 4×meta_proteina_g + 9×meta_gordura_g` (mesclando o que veio no body com
o que já estava salvo para os macros que não vierem).

### `PUT /api/me/senha`
Body: `{ senha_atual: string, senha_nova: string }` (`senha_nova` com 8–200 chars) → `204`
`400 SENHA_INCORRETA` (senha atual não confere) · `400 VALIDACAO` ·
`429 LIMITE_EXCEDIDO` (10 tentativas por 15 min por usuário, somando este endpoint e `POST /api/me/desativar`).
Não é 401 de propósito: 401 derruba a sessão no cliente. O token atual continua valendo.

### `POST /api/me/desativar`
Body: `{ senha: string }` → `204` · `400 SENHA_INCORRETA` · `400 VALIDACAO` · `429 LIMITE_EXCEDIDO`
Desativa a conta. **Nada é apagado**: registros, água, refeições, mídias, amizades e grupos ficam
no banco. A partir daí o login responde `403 CONTA_DESATIVADA`, o token atual também, e a pessoa
some do social (ver "Quem vê o quê"). Só o administrador do servidor reativa, pela linha de
comando (`docs/deploy.md`, "Contas desativadas").

### `GET /api/refeicoes` → `200 { refeicoes: Refeicao[] }`
Ordenadas por `inicio`.

### `POST /api/refeicoes`
Body: `{ nome, inicio, fim }` (`inicio`/`fim` no formato `HH:MM`) → `201 Refeicao`
Abre espaço para a janela nova: refeições vizinhas que encostam nela têm `inicio`/`fim`
ajustados junto, na mesma transação. `400 VALIDACAO` se a janela nova engolir uma vizinha
inteira, cair no meio de uma, se `fim` vier antes de `inicio`, ou nome duplicado.

### `PATCH /api/refeicoes/:id`
Body: qualquer subconjunto de `{ nome, inicio, fim }` → `200 Refeicao`
Mesmas regras de acomodação de vizinhas do `POST`. `404 NAO_ENCONTRADO` ·
`400 VALIDACAO` (mesmos casos do `POST`, e nome duplicado)

### `DELETE /api/refeicoes/:id` → `204`
A vizinha anterior (circular — o dia dá a volta à meia-noite) absorve a janela liberada,
para nenhum minuto do dia ficar sem dono. `404 NAO_ENCONTRADO` ·
`409 REFEICAO_EM_USO` (já tem registro nessa refeição — renomeie em vez de apagar) ·
`400 VALIDACAO` (é a única refeição da conta)

### `POST /api/registros/texto`
Body: `{ texto: string, criado_em?: string }` → `200 Interpretacao`

### `POST /api/registros/foto`
`multipart/form-data`, campo `arquivo` (jpeg/png/webp, ≤ 10 MB) e campo opcional `criado_em` → `200 Interpretacao`

### `POST /api/registros/audio`
`multipart/form-data`, campo `arquivo` (webm/mp3/m4a/wav/ogg, ≤ 25 MB) e campo opcional `criado_em` → `200 Interpretacao`

`criado_em` (ISO 8601) serve para registrar num dia passado: a `refeicao_sugerida` é detectada
por ele e, no modo preguiçoso, o registro já nasce com essa data. Omitido = agora. No futuro
(mais de 5 min à frente do servidor) → `400 VALIDACAO`, sem chamar a IA. No fluxo com
confirmação, o cliente repassa o mesmo `criado_em` ao `POST /api/registros/confirmar`.

### `POST /api/registros/confirmar`
Body: `{ tipo_entrada, descricao_bruta, midia_url?, refeicao_id?, alimentos: Alimento[], criado_em? }`
`refeicao_id` omitida → detectada pelo horário. `404 NAO_ENCONTRADO` se `refeicao_id` não for
sua. → `201 Registro`

### `PATCH /api/registros/:id`
Body: `{ refeicao_id?, alimentos? }` → `200 Registro` (totais recalculados)
`404 NAO_ENCONTRADO` se `refeicao_id` não for sua.

Ao enviar `alimentos`, o `calorias` de cada item é sempre recalculado no servidor a partir
de `4×carboidrato_g + 4×proteina_g + 9×gordura_g` — o valor de `calorias` vindo no body é
ignorado. Isso vale só para essa edição manual; a estimativa inicial da IA (`POST
/registros/foto|audio|texto`) continua livre para estimar `calorias` do seu jeito.

### `DELETE /api/registros/:id` → `204`

### `GET /api/registros/dia?data=YYYY-MM-DD`
```ts
200 {
  data: string;
  refeicoes: Array<{
    refeicao_id: string;
    refeicao_nome: string;
    calorias: number;
    registros: Registro[];
  }>;
}
```
Refeições do usuário, ordenadas por `inicio`. Uma refeição sem registro não aparece,
exceto quando o dia inteiro está vazio (nesse caso todas aparecem, cada uma zerada).

### `POST /api/agua`
Body: `{ quantidade_ml: number }` (ou `{ texto: string }` — extrai o número) → `201 { id, quantidade_ml, criado_em }`

### `DELETE /api/agua/:id` → `204`

### `GET /api/resumo/dia?data=YYYY-MM-DD`
```ts
interface Metrica {
  consumido: number;
  meta: number;
  percentual: number;   // consumido/meta*100, arredondado a 1 casa
  restante: number;     // max(meta - consumido, 0)
  excedido: number;     // max(consumido - meta, 0)
}
200 {
  data: string;
  calorias: Metrica;
  carboidrato_g: Metrica;
  proteina_g: Metrica;
  gordura_g: Metrica;
  agua_ml: Metrica;
  refeicoes: Array<{ refeicao_id: string; refeicao_nome: string; calorias: number; quantidade_registros: number }>;
}
```

### `GET /api/resumo/semana?fim=YYYY-MM-DD`
7 dias terminando em `fim` (default: hoje).
```ts
200 {
  dias: Array<{
    data: string;            // YYYY-MM-DD
    calorias: number;
    meta_calorias: number;
    percentual: number;
    tem_registro: boolean;
  }>;
}
```

### `GET /api/resumo/mes?mes=YYYY-MM`
Default: mês atual no fuso do perfil. `400 VALIDACAO` se o formato for inválido.
```ts
200 {
  mes: string;                    // "2026-09"
  media_calorias: number;         // soma kcal do mês ÷ dias com ≥1 registro; 0 se nenhum; inteiro
  por_refeicao: Array<{
    refeicao_id: string;
    refeicao_nome: string;
    media_calorias: number;       // kcal da refeição no mês ÷ dias com ≥1 registro (qualquer refeição); inteiro
    variacao_percentual: number | null; // vs mês anterior, mesma refeicao_id; null se lá era 0; 1 casa
  }>;                             // só refeições com kcal > 0 no mês; ordem: media_calorias desc
  dias: Array<{
    data: string;                 // YYYY-MM-DD (fuso do perfil), ordem desc
    calorias: number;
    refeicoes: Array<{ refeicao_id: string; refeicao_nome: string; calorias: number; descricao: string }>;
    // descricao = nomes dos alimentos dos registros daquela refeição, juntados com ", "; ordem: inicio da refeição
  }>;                             // só dias com registro
}
```
A variação compara médias: `(média do mês − média do mês anterior) ÷ média do mês anterior × 100`,
cada média dividida pelos dias com registro **do próprio mês**. Empate em `media_calorias` segue a
ordem de `inicio` da refeição.

## Detecção automática de refeição

O horário do registro (`criado_em`, convertido para o `timezone` do perfil) cai na refeição do
usuário (`GET /api/refeicoes`) cuja janela `inicio`–`fim` o contém. Janelas podem cruzar a
meia-noite (ex.: ceia 22:01→04:59). Conta nova nasce com estas refeições:

| Nome | Início | Fim |
|---|---|---|
| Café da manhã | 05:00 | 10:00 |
| Almoço | 10:01 | 15:00 |
| Lanche | 15:01 | 18:00 |
| Janta | 18:01 | 22:00 |
| Ceia | 22:01 | 04:59 |

O usuário pode renomear, criar, mover e apagar suas refeições livremente — ver
`GET/POST/PATCH/DELETE /api/refeicoes` acima.

## Cálculo automático de metas (`metas_automaticas: true`)

Mifflin-St Jeor:
- Homem: `TMB = 10*peso + 6.25*altura - 5*idade + 5`
- Mulher: `TMB = 10*peso + 6.25*altura - 5*idade - 161`

`GET = TMB * 1.375` (atividade leve). Ajuste por objetivo:
`perder_peso` −20%, `manter` 0, `ganhar_massa` +15%.

Macros: proteína `2 g/kg`, gordura `25%` das kcal ÷ 9, carboidrato = kcal restantes ÷ 4.
Água: `35 ml/kg`.

Se faltar peso/altura/idade/sexo, mantém as metas atuais (não zera).

## Metas manuais (`metas_automaticas: false`)

`meta_calorias` deixa de ser um campo independente: é sempre derivado dos macros de meta,
`4×meta_carboidrato_g + 4×meta_proteina_g + 9×meta_gordura_g`, calculado no servidor a cada
`PUT /api/me`. O que o cliente mandar em `meta_calorias` é ignorado.

## Rede social

Identidade pública: `nome#tag` (ex: `joao#0427`). A tag é sorteada no cadastro e é única
dentro do mesmo nome — dois "joao" nunca têm a mesma tag. Trocar o nome no perfil mantém a
tag quando ela ainda estiver livre para o nome novo; se não estiver, o servidor sorteia outra.

**Quem vê o quê:** você enxerga o progresso e as refeições de alguém se for você mesmo,
se forem amigos (pedido aceito) ou se dividirem pelo menos um grupo. Fora isso, `403 SEM_ACESSO`.
Não existe passo extra para publicar: toda refeição registrada já aparece para quem pode ver.

**Conta desativada some da rede:** não aparece em `GET /api/amigos`, nos pedidos, nos membros e na
`quantidade_membros` de grupos, no ranking, em nenhum feed nem nos comentários; `POST
/api/amigos/pedidos` para o `nome#tag` dela dá `404 NAO_ENCONTRADO`; `GET /api/social/usuarios/:id`
(e `/calendario`, `/refeicoes`) dá `404 NAO_ENCONTRADO`; curtir/comentar um post dela dá `404`.
Os grupos criados por ela continuam existindo. Curtidas antigas dela continuam contando no total.

### Tipos

```ts
interface PerfilPublico {
  id: string;
  nome: string;
  tag: string;
  nome_tag: string;              // "joao#0427"
  objetivo: Objetivo;
}

/** Como o dia fechou em relação à meta de calorias. `na_meta` = entre 90% e 110%. */
type StatusDia = 'sem_registro' | 'abaixo' | 'na_meta' | 'acima';

interface ProgressoDia {
  data: string;                  // YYYY-MM-DD (fuso de quem está sendo visto)
  calorias: number;
  meta_calorias: number;
  percentual: number;
  status: StatusDia;
  quantidade_registros: number;
}

/** Uma refeição de alguém, do jeito que aparece no feed. */
interface Post {
  id: string;
  autor: PerfilPublico;
  refeicao_id: string;
  refeicao_nome: string;
  descricao_bruta: string;
  midia_url: string | null;
  alimentos_detectados: Alimento[];
  calorias_total: number;
  carboidrato_total_g: number;
  proteina_total_g: number;
  gordura_total_g: number;
  criado_em: string;
  curtidas: number;              // total de curtidas
  curti: boolean;                // quem pede já curtiu
  comentarios: number;           // total de comentários
}

interface Feed {
  posts: Post[];
  /** `criado_em` do último post; passe em `?antes=` para pedir a próxima página. `null` = acabou. */
  proximo_antes: string | null;
}

interface MembroComProgresso {
  perfil: PerfilPublico;
  progresso_hoje: ProgressoDia;
}

interface Grupo {
  id: string;
  nome: string;
  codigo_convite: string;        // 6 caracteres, ex: "K3F9QZ"
  quantidade_membros: number;
  sou_criador: boolean;
  criado_em: string;
  /** Posição de quem pede no ranking dos últimos 7 dias. `null` se o grupo tem 1 membro. */
  minha_posicao_semana: number | null;
}

interface Comentario {
  id: string;
  autor: PerfilPublico;
  texto: string;
  criado_em: string;
  /** Quem pede é o autor do comentário ou o dono do post. */
  posso_apagar: boolean;
}
```

### Amigos

#### `GET /api/amigos`
`200 { amigos: MembroComProgresso[] }` — ordenado por nome.

#### `GET /api/amigos/pedidos`
```ts
200 {
  recebidos: Array<{ id: string; perfil: PerfilPublico; criado_em: string }>;
  enviados:  Array<{ id: string; perfil: PerfilPublico; criado_em: string }>;
}
```

#### `POST /api/amigos/pedidos`
Body: `{ nome_tag: string }` (`"joao#0427"`, sem diferenciar maiúsculas).
`201 { id, perfil, criado_em }` · `404 NAO_ENCONTRADO` (tag não existe) ·
`409 PEDIDO_DUPLICADO` (já são amigos ou já existe pedido nos dois sentidos) ·
`400 VALIDACAO` (formato errado, ou você mesmo).
Limite: 20 pedidos por hora por usuário (`429 LIMITE_EXCEDIDO`) — evita ficar chutando tags.

#### `POST /api/amigos/pedidos/:id/aceitar`
Só o destinatário aceita. `200 { perfil }` · `404 NAO_ENCONTRADO`

#### `DELETE /api/amigos/pedidos/:id`
Recusa (destinatário) ou cancela (solicitante) um pedido pendente. `204` · `404 NAO_ENCONTRADO`

#### `DELETE /api/amigos/:id`
Desfaz a amizade com o usuário `:id`. `204` · `404 NAO_ENCONTRADO`

### Grupos

#### `GET /api/grupos` → `200 { grupos: Grupo[] }` (só os que você é membro)

#### `POST /api/grupos`
Body: `{ nome: string }` (1–60 chars) → `201 Grupo` (você já entra como membro).

#### `POST /api/grupos/entrar`
Body: `{ codigo: string }` → `200 Grupo` · `404 NAO_ENCONTRADO`.
Entrar de novo num grupo que você já é membro devolve `200` com o mesmo grupo.

#### `DELETE /api/grupos/:id/sair` → `204`
Quando o último membro sai, o grupo é apagado.

#### `GET /api/grupos/:id`
`200 { grupo: Grupo, membros: MembroComProgresso[] }` · `403 SEM_ACESSO` se você não é membro.

#### `GET /api/grupos/:id/feed?antes=<ISO>&limite=<1..50>`
Refeições de todos os membros, mais recentes primeiro. `limite` padrão 20.
`200 Feed` · `403 SEM_ACESSO`

#### Ranking semanal (`minha_posicao_semana`)
Presente em `GET /api/grupos`, `POST /api/grupos`, `POST /api/grupos/entrar` e `GET /api/grupos/:id`.
Janela: os 7 dias terminando hoje, no fuso **de quem pede**. Para cada membro:
`dias_na_meta` (dias com status `na_meta`, meta do próprio membro) e `desvio_medio`
(média de `|percentual − 100|` nos dias com registro). Ordem: `dias_na_meta` desc, depois
`desvio_medio` asc; membro sem nenhum registro na janela fica depois de todos. Empate nos dois
critérios → mesma posição, e a próxima pula (1, 2, 2, 4). Grupo com 1 membro → `null`.

### Perfil de outra pessoa

#### `GET /api/social/usuarios/:id`
`200 { perfil: PerfilPublico, progresso_hoje: ProgressoDia }` · `403 SEM_ACESSO`

#### `GET /api/social/usuarios/:id/calendario?mes=YYYY-MM`
Um item por dia do mês (default: mês atual no fuso da pessoa).
`200 { mes: string, dias: ProgressoDia[] }` · `403 SEM_ACESSO`

#### `GET /api/social/usuarios/:id/refeicoes?antes=<ISO>&limite=<1..50>`
As refeições da pessoa, mais recentes primeiro. `200 Feed` · `403 SEM_ACESSO`

### Feed geral e interações

#### `GET /api/social/feed?antes=<ISO>&limite=<1..50>`
Refeições de amigos aceitos e de quem divide grupo com você, **sem as suas**, mais recentes
primeiro. `limite` padrão 20. `200 Feed`

Acesso a um post: vale a regra "Quem vê o quê" aplicada ao dono do registro (o dono sempre vê
o próprio). Registro inexistente `404 NAO_ENCONTRADO`; sem acesso `403 SEM_ACESSO`.

#### `PUT /api/social/posts/:id/curtida` → `204`
Idempotente: curtir de novo não duplica.

#### `DELETE /api/social/posts/:id/curtida` → `204`
Idempotente: descurtir o que não estava curtido também devolve `204`.

#### `GET /api/social/posts/:id/comentarios`
`200 { comentarios: Comentario[] }` em ordem `criado_em` crescente.

#### `POST /api/social/posts/:id/comentarios`
Body: `{ texto: string }` (trim, 1–500) → `201 Comentario` · `400 VALIDACAO`.
Limite: 30 comentários por hora por usuário (`429 LIMITE_EXCEDIDO`).

#### `DELETE /api/social/comentarios/:id` → `204`
Só o autor do comentário ou o dono do post. Qualquer outro caso (inclusive comentário
inexistente) → `404 NAO_ENCONTRADO`.

### Status do dia

Com `meta > 0` e pelo menos um registro no dia:

| Percentual (consumido / meta) | Status |
|---|---|
| < 90% | `abaixo` |
| 90% – 110% | `na_meta` |
| > 110% | `acima` |

Sem nenhum registro no dia: `sem_registro`. Meta zerada ou ausente: `sem_registro`.
