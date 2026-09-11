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
  `NAO_ENCONTRADO`, `IA_INDISPONIVEL`, `IA_RESPOSTA_INVALIDA`, `ARQUIVO_INVALIDO`, `ERRO_INTERNO`.

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
