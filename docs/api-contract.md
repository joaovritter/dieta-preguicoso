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
  `SEM_ACESSO`, `PEDIDO_DUPLICADO`.

## Tipos compartilhados

```ts
type Refeicao = 'cafe_da_manha' | 'almoco' | 'lanche' | 'janta' | 'ceia';
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

interface FaixaRefeicao { refeicao: Refeicao; inicio: string; fim: string; } // "HH:MM"

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
  faixas_refeicao: FaixaRefeicao[];
  timezone: string;              // ex: "America/Sao_Paulo"
  criado_em: string;
}

interface Registro {
  id: string;
  tipo_entrada: TipoEntrada;
  refeicao: Refeicao;
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
Body: `{ email, senha }` → `200 { token, perfil }` · `401 CREDENCIAIS_INVALIDAS`

### `GET /api/me` → `200 Perfil`

### `PUT /api/me`
Body: qualquer subconjunto de
`{ nome, sexo, idade, peso_kg, altura_cm, objetivo, meta_calorias, meta_carboidrato_g,
   meta_proteina_g, meta_gordura_g, meta_agua_ml, metas_automaticas, modo_preguicoso,
   faixas_refeicao, timezone }`
→ `200 Perfil` (já com metas recalculadas se `metas_automaticas`).

### `POST /api/registros/texto`
Body: `{ texto: string }` → `200 Interpretacao`

### `POST /api/registros/foto`
`multipart/form-data`, campo `arquivo` (jpeg/png/webp, ≤ 10 MB) → `200 Interpretacao`

### `POST /api/registros/audio`
`multipart/form-data`, campo `arquivo` (webm/mp3/m4a/wav/ogg, ≤ 25 MB) → `200 Interpretacao`

### `POST /api/registros/confirmar`
Body: `{ tipo_entrada, descricao_bruta, midia_url?, refeicao?, alimentos: Alimento[], criado_em? }`
`refeicao` omitida → detectada pelo horário. → `201 Registro`

### `PATCH /api/registros/:id`
Body: `{ refeicao?, alimentos? }` → `200 Registro` (totais recalculados)

### `DELETE /api/registros/:id` → `204`

### `GET /api/registros/dia?data=YYYY-MM-DD`
```ts
200 {
  data: string;
  refeicoes: Array<{ refeicao: Refeicao; calorias: number; registros: Registro[] }>;
}
```
Sempre devolve as 5 refeições na ordem canônica; `ceia` só aparece se tiver registro.

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
  refeicoes: Array<{ refeicao: Refeicao; calorias: number; quantidade_registros: number }>;
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

## Detecção automática de refeição

O horário do registro (`criado_em`, convertido para o `timezone` do perfil) cai numa das
`faixas_refeicao`. Faixas podem cruzar a meia-noite (ceia 22:01→04:59). Defaults:

| Refeição | Início | Fim |
|---|---|---|
| cafe_da_manha | 05:00 | 10:00 |
| almoco | 10:01 | 15:00 |
| lanche | 15:01 | 18:00 |
| janta | 18:01 | 22:00 |
| ceia | 22:01 | 04:59 |

## Cálculo automático de metas (`metas_automaticas: true`)

Mifflin-St Jeor:
- Homem: `TMB = 10*peso + 6.25*altura - 5*idade + 5`
- Mulher: `TMB = 10*peso + 6.25*altura - 5*idade - 161`

`GET = TMB * 1.375` (atividade leve). Ajuste por objetivo:
`perder_peso` −20%, `manter` 0, `ganhar_massa` +15%.

Macros: proteína `2 g/kg`, gordura `25%` das kcal ÷ 9, carboidrato = kcal restantes ÷ 4.
Água: `35 ml/kg`.

Se faltar peso/altura/idade/sexo, mantém as metas atuais (não zera).

## Rede social

Identidade pública: `nome#tag` (ex: `joao#0427`). A tag é sorteada no cadastro e é única
dentro do mesmo nome — dois "joao" nunca têm a mesma tag. Trocar o nome no perfil mantém a
tag quando ela ainda estiver livre para o nome novo; se não estiver, o servidor sorteia outra.

**Quem vê o quê:** você enxerga o progresso e as refeições de alguém se for você mesmo,
se forem amigos (pedido aceito) ou se dividirem pelo menos um grupo. Fora isso, `403 SEM_ACESSO`.
Não existe passo extra para publicar: toda refeição registrada já aparece para quem pode ver.

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
  refeicao: Refeicao;
  descricao_bruta: string;
  midia_url: string | null;
  alimentos_detectados: Alimento[];
  calorias_total: number;
  carboidrato_total_g: number;
  proteina_total_g: number;
  gordura_total_g: number;
  criado_em: string;
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

### Perfil de outra pessoa

#### `GET /api/social/usuarios/:id`
`200 { perfil: PerfilPublico, progresso_hoje: ProgressoDia }` · `403 SEM_ACESSO`

#### `GET /api/social/usuarios/:id/calendario?mes=YYYY-MM`
Um item por dia do mês (default: mês atual no fuso da pessoa).
`200 { mes: string, dias: ProgressoDia[] }` · `403 SEM_ACESSO`

#### `GET /api/social/usuarios/:id/refeicoes?antes=<ISO>&limite=<1..50>`
As refeições da pessoa, mais recentes primeiro. `200 Feed` · `403 SEM_ACESSO`

### Status do dia

Com `meta > 0` e pelo menos um registro no dia:

| Percentual (consumido / meta) | Status |
|---|---|
| < 90% | `abaixo` |
| 90% – 110% | `na_meta` |
| > 110% | `acima` |

Sem nenhum registro no dia: `sem_registro`. Meta zerada ou ausente: `sem_registro`.
