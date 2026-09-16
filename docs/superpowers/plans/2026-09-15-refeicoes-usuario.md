# Refeições do usuário — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o ENUM fixo de cinco refeições por um conjunto que cada pessoa monta, com faixa de horário própria e reacomodação automática das vizinhas.

**Architecture:** Tabela `refeicoes_usuario` por pessoa, com `registros_alimentares.refeicao_id` apontando para ela. A decisão de como as faixas se reacomodam mora numa função pura em `domain/refeicao.ts`, testada sem banco. As rotas novas ficam em `routes/refeicoes.ts`; o frontend lê a lista uma vez por sessão e distribui por contexto.

**Tech Stack:** TypeScript, Express 5, `pg` com SQL puro, Postgres 16, Vitest, React 19 + Vite.

**Spec:** `docs/superpowers/specs/2026-09-15-refeicoes-usuario-design.md`

## Global Constraints

- Domínio em português (`refeicao`, `alimentos_detectados`); termos técnicos em inglês. Colunas e campos de API em snake_case.
- SQL puro em `backend/src/db/`, sem ORM. Migration numerada e imutável depois de aplicada.
- Toda entrada de rota validada com Zod antes de tocar no banco.
- Erros de domínio via `AppError(codigo, mensagem)`. Mensagem de erro fala com a pessoa, não com o programador: sem JSON, token, header ou código de status no texto.
- Testes com Vitest, sem rede e sem banco. O frontend não tem runner de teste; a verificação dele é `npm run typecheck` e `npm run build`.
- Comandos: backend `npm run typecheck`, `npm test -- --run`; frontend `npm run typecheck`, `npm run build`. Rodar de dentro de `backend/` e `frontend/`.
- `docs/api-contract.md` é a fonte da verdade do contrato. Divergência entre ele e o código é bug — atualizar no mesmo commit da mudança.

---

### Task 1: Domínio — janelas de horário e detecção

**Files:**
- Modify: `backend/src/domain/tipos.ts` (troca do tipo `Refeicao`, remoção de `REFEICOES` e `FAIXAS_PADRAO`)
- Modify: `backend/src/domain/refeicao.ts`
- Test: `backend/src/domain/refeicao.test.ts` (reescrita)

**Interfaces:**
- Consumes: `minutosDoDia(instante: Date, timezone: string): number` de `domain/tempo.js`; `AppError` de `lib/erros.js`.
- Produces:
  - `interface Refeicao { id: string; nome: string; inicio: string; fim: string }`
  - `interface Janela { inicio: string; fim: string }`
  - `const REFEICOES_INICIAIS: Array<{ nome: string; inicio: string; fim: string }>`
  - `horaValida(hora: string): boolean` (já existe, continua exportada)
  - `paraMinutos(hora: string): number` (passa a ser exportada)
  - `acomodar(existentes: Refeicao[], janela: Janela, idIgnorado?: string): Refeicao[]` — devolve **apenas as refeições que mudaram**, já com os horários novos
  - `detectarRefeicao(instante: Date, timezone: string, refeicoes: Refeicao[]): Refeicao`

- [ ] **Step 1: Escrever os testes que falham**

Substituir `backend/src/domain/refeicao.test.ts` inteiro por:

```ts
import { describe, expect, it } from 'vitest';
import { acomodar, detectarRefeicao } from './refeicao.js';
import { AppError } from '../lib/erros.js';
import type { Refeicao } from './tipos.js';

const TZ = 'America/Sao_Paulo';

/** Constrói um instante UTC que corresponde a `hora:minuto` em São Paulo (UTC-3). */
function emSaoPaulo(hora: number, minuto = 0): Date {
  return new Date(Date.UTC(2026, 2, 10, hora + 3, minuto));
}

function refeicao(id: string, nome: string, inicio: string, fim: string): Refeicao {
  return { id, nome, inicio, fim };
}

const PADRAO: Refeicao[] = [
  refeicao('1', 'Café da manhã', '05:00', '10:00'),
  refeicao('2', 'Almoço', '10:01', '15:00'),
  refeicao('3', 'Lanche', '15:01', '18:00'),
  refeicao('4', 'Janta', '18:01', '22:00'),
  refeicao('5', 'Ceia', '22:01', '04:59'),
];

describe('detectarRefeicao', () => {
  it.each([
    [7, 0, 'Café da manhã'],
    [5, 0, 'Café da manhã'],
    [10, 0, 'Café da manhã'],
    [10, 1, 'Almoço'],
    [15, 0, 'Almoço'],
    [16, 0, 'Lanche'],
    [19, 30, 'Janta'],
    [22, 0, 'Janta'],
  ])('%i:%i cai em %s', (hora, minuto, esperado) => {
    expect(detectarRefeicao(emSaoPaulo(hora, minuto), TZ, PADRAO).nome).toBe(esperado);
  });

  it('classifica na faixa que cruza a meia-noite', () => {
    expect(detectarRefeicao(emSaoPaulo(23, 30), TZ, PADRAO).nome).toBe('Ceia');
    expect(detectarRefeicao(emSaoPaulo(2, 0), TZ, PADRAO).nome).toBe('Ceia');
    expect(detectarRefeicao(emSaoPaulo(4, 59), TZ, PADRAO).nome).toBe('Ceia');
  });

  it('encontra a refeição extra criada no meio do dia', () => {
    const comExtra = [
      ...PADRAO.filter((r) => r.id !== '3'),
      refeicao('6', 'Pré-treino', '15:01', '17:00'),
      refeicao('3', 'Lanche', '17:01', '18:00'),
    ];
    expect(detectarRefeicao(emSaoPaulo(16, 0), TZ, comExtra).nome).toBe('Pré-treino');
    expect(detectarRefeicao(emSaoPaulo(17, 30), TZ, comExtra).nome).toBe('Lanche');
  });

  it('cai na mais próxima para trás quando a lista tem buraco', () => {
    const comBuraco = [refeicao('1', 'Café', '05:00', '08:00'), refeicao('2', 'Janta', '18:00', '22:00')];
    expect(detectarRefeicao(emSaoPaulo(12, 0), TZ, comBuraco).nome).toBe('Café');
  });
});

describe('acomodar', () => {
  it('empurra o início da vizinha que começa dentro da janela nova', () => {
    const mudadas = acomodar(PADRAO, { inicio: '15:01', fim: '17:00' });
    expect(mudadas).toEqual([{ ...PADRAO[2], inicio: '17:01' }]);
  });

  it('recua o fim da vizinha que termina dentro da janela nova', () => {
    const mudadas = acomodar(PADRAO, { inicio: '14:00', fim: '15:30' });
    expect(mudadas).toEqual([
      { ...PADRAO[1], fim: '13:59' },
      { ...PADRAO[2], inicio: '15:31' },
    ]);
  });

  it('não mexe em quem não encosta na janela nova', () => {
    const mudadas = acomodar(PADRAO, { inicio: '15:30', fim: '16:00' });
    expect(mudadas.map((r) => r.id)).toEqual(['3']);
  });

  it('recusa janela que engole uma refeição inteira', () => {
    expect(() => acomodar(PADRAO, { inicio: '15:00', fim: '18:30' })).toThrow(AppError);
    expect(() => acomodar(PADRAO, { inicio: '15:00', fim: '18:30' })).toThrow(/Lanche/);
  });

  it('recusa janela que cruza a meia-noite', () => {
    expect(() => acomodar(PADRAO, { inicio: '23:00', fim: '01:00' })).toThrow(AppError);
  });

  it('recusa janela que cairia no meio da refeição que cruza a meia-noite', () => {
    expect(() => acomodar(PADRAO, { inicio: '02:00', fim: '03:00' })).toThrow(AppError);
  });

  it('ignora a própria refeição ao mover uma que já existe', () => {
    const mudadas = acomodar(PADRAO, { inicio: '15:01', fim: '17:30' }, '3');
    expect(mudadas).toEqual([]);
  });

  it('mantém a partição contígua depois de duas inserções', () => {
    const passo1 = [...PADRAO];
    const mudadas1 = acomodar(passo1, { inicio: '15:01', fim: '17:00' });
    const lista1 = aplicar(passo1, mudadas1).concat(refeicao('6', 'Pré-treino', '15:01', '17:00'));
    const mudadas2 = acomodar(lista1, { inicio: '09:00', fim: '09:30' });
    const lista2 = aplicar(lista1, mudadas2).concat(refeicao('7', 'Colação', '09:00', '09:30'));

    const ordenadas = [...lista2].sort((a, b) => a.inicio.localeCompare(b.inicio));
    for (let i = 1; i < ordenadas.length; i += 1) {
      expect(minutos(ordenadas[i]!.inicio)).toBe(minutos(ordenadas[i - 1]!.fim) + 1);
    }
  });
});

function aplicar(lista: Refeicao[], mudadas: Refeicao[]): Refeicao[] {
  return lista.map((r) => mudadas.find((m) => m.id === r.id) ?? r);
}

function minutos(hora: string): number {
  const [h, m] = hora.split(':');
  return Number(h) * 60 + Number(m);
}
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && npm test -- --run src/domain/refeicao.test.ts`
Expected: FAIL — `acomodar` não existe e `detectarRefeicao` devolve string, não objeto.

- [ ] **Step 3: Trocar o tipo em `domain/tipos.ts`**

Remover `REFEICOES`, `Refeicao` (union) e `FAIXAS_PADRAO`. `FaixaRefeicao` também sai. No lugar:

```ts
export interface Refeicao {
  id: string;
  nome: string;
  /** "HH:MM" */
  inicio: string;
  /** "HH:MM" — pode ser menor que `inicio`, indicando que a faixa cruza a meia-noite. */
  fim: string;
}

export interface Janela {
  inicio: string;
  fim: string;
}

/** Semente de conta nova. A migration 003 tem a mesma lista em SQL. */
export const REFEICOES_INICIAIS: Array<{ nome: string; inicio: string; fim: string }> = [
  { nome: 'Café da manhã', inicio: '05:00', fim: '10:00' },
  { nome: 'Almoço', inicio: '10:01', fim: '15:00' },
  { nome: 'Lanche', inicio: '15:01', fim: '18:00' },
  { nome: 'Janta', inicio: '18:01', fim: '22:00' },
  { nome: 'Ceia', inicio: '22:01', fim: '04:59' },
];
```

Em `interface Registro`, trocar `refeicao: Refeicao` por:

```ts
  refeicao_id: string;
  refeicao_nome: string;
```

Em `interface Perfil`, remover a linha `faixas_refeicao: FaixaRefeicao[];`.

- [ ] **Step 4: Implementar `acomodar` e adaptar `detectarRefeicao`**

Em `backend/src/domain/refeicao.ts`, manter `horaValida` e `dentroDaFaixa`, exportar `paraMinutos` e acrescentar:

```ts
import { AppError } from '../lib/erros.js';
import type { Janela, Refeicao } from './tipos.js';

const DIA_MINUTOS = 1440;

function paraHora(minutos: number): string {
  const m = ((minutos % DIA_MINUTOS) + DIA_MINUTOS) % DIA_MINUTOS;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function cruzaMeiaNoite(r: { inicio: string; fim: string }): boolean {
  return paraMinutos(r.fim) < paraMinutos(r.inicio);
}

/**
 * Como as refeições existentes ficam depois de abrir espaço para `janela`.
 * Devolve só as que mudaram — quem não encosta na janela nova sai de fora.
 * `idIgnorado` é a própria refeição, quando é ela que está sendo movida.
 *
 * O dia é uma partição contígua: toda hora pertence a exatamente uma refeição.
 * Por isso a janela nova nunca pode engolir uma vizinha inteira nem cair no meio
 * de uma — nos dois casos a partição se quebraria, e adivinhar o que o usuário
 * quis seria pior que recusar.
 */
export function acomodar(
  existentes: Refeicao[],
  janela: Janela,
  idIgnorado?: string,
): Refeicao[] {
  const inicio = paraMinutos(janela.inicio);
  const fim = paraMinutos(janela.fim);

  if (fim < inicio) {
    throw new AppError('VALIDACAO', 'o fim tem que vir depois do início, no mesmo dia');
  }

  const mudadas: Refeicao[] = [];

  for (const atual of existentes) {
    if (atual.id === idIgnorado) continue;

    const aInicio = paraMinutos(atual.inicio);
    const aFim = paraMinutos(atual.fim);
    const atravessa = cruzaMeiaNoite(atual);

    // Fora da janela nova: nada a fazer.
    const cobreInicio = atravessa ? inicio >= aInicio || inicio <= aFim : inicio >= aInicio && inicio <= aFim;
    const cobreFim = atravessa ? fim >= aInicio || fim <= aFim : fim >= aInicio && fim <= aFim;
    const engolida = !atravessa && aInicio >= inicio && aFim <= fim;

    if (engolida) {
      throw new AppError('VALIDACAO', `essa faixa cobre ${atual.nome} inteira, escolha outra`);
    }
    if (!cobreInicio && !cobreFim) continue;

    // A janela nova começa e termina dentro da mesma vizinha: partiria ela em duas.
    if (cobreInicio && cobreFim && inicio > aInicio && fim < aFim) {
      throw new AppError('VALIDACAO', `essa faixa fica no meio de ${atual.nome}, escolha outra`);
    }

    if (cobreInicio && aInicio < inicio) {
      mudadas.push({ ...atual, fim: paraHora(inicio - 1) });
    } else {
      mudadas.push({ ...atual, inicio: paraHora(fim + 1) });
    }
  }

  return mudadas;
}
```

E trocar a assinatura de `detectarRefeicao`:

```ts
export function detectarRefeicao(
  instante: Date,
  timezone: string,
  refeicoes: Refeicao[],
): Refeicao {
  if (refeicoes.length === 0) {
    throw new AppError('ERRO_INTERNO', 'usuário sem refeições cadastradas');
  }
  const minutos = minutosDoDia(instante, timezone);

  for (const r of refeicoes) {
    if (dentroDaFaixa(minutos, r)) return r;
  }

  // Rede de segurança: com a partição contígua isso não acontece, mas uma lista
  // editada fora do app não pode derrubar o registro.
  let melhor = refeicoes[0]!;
  let menorDistancia = Number.POSITIVE_INFINITY;
  for (const r of refeicoes) {
    const distancia = (minutos - paraMinutos(r.inicio) + DIA_MINUTOS) % DIA_MINUTOS;
    if (distancia < menorDistancia) {
      menorDistancia = distancia;
      melhor = r;
    }
  }
  return melhor;
}
```

`dentroDaFaixa` passa a receber `{ inicio, fim }` em vez de `FaixaRefeicao`.

- [ ] **Step 5: Rodar os testes**

Run: `cd backend && npm test -- --run src/domain/refeicao.test.ts`
Expected: PASS, 13 testes.

O resto do backend ainda não compila (`REFEICOES` sumiu) — isso é esperado e some na Task 4. Não rode `npm run typecheck` ainda.

- [ ] **Step 6: Commit**

```bash
git add backend/src/domain/refeicao.ts backend/src/domain/refeicao.test.ts backend/src/domain/tipos.ts
git commit -m "Refeicao vira objeto com janela propria, e acomodar abre espaco para a nova"
```

---

### Task 2: Migration 003 e repositório

**Files:**
- Create: `backend/src/db/migrations/003_refeicoes_usuario.sql`
- Create: `backend/src/repos/refeicoes.ts`
- Modify: `backend/src/lib/erros.ts` (novo código `REFEICAO_EM_USO`)

**Interfaces:**
- Consumes: `consultar`, `consultarUm` de `db/index.js`; `pool` para transação; `acomodar` da Task 1.
- Produces:
  - `listarRefeicoes(userId: string): Promise<Refeicao[]>` — ordenadas por `inicio`
  - `buscarRefeicao(userId: string, id: string): Promise<Refeicao | null>`
  - `criarRefeicao(userId: string, dados: { nome: string; inicio: string; fim: string }): Promise<Refeicao>`
  - `atualizarRefeicao(userId: string, id: string, campos: { nome?: string; inicio?: string; fim?: string }): Promise<Refeicao | null>`
  - `apagarRefeicao(userId: string, id: string): Promise<boolean>` — `false` quando o id não é da pessoa; lança `AppError('REFEICAO_EM_USO', ...)` se houver registro
  - `semearRefeicoes(cliente: pg.PoolClient, userId: string): Promise<void>`

- [ ] **Step 1: Escrever a migration**

`backend/src/db/migrations/003_refeicoes_usuario.sql`:

```sql
-- Refeições deixam de ser cinco valores fixos e passam a ser um conjunto por pessoa.
CREATE TABLE IF NOT EXISTS refeicoes_usuario (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome      TEXT NOT NULL,
  inicio    CHAR(5) NOT NULL,
  fim       CHAR(5) NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_refeicoes_usuario_nome
  ON refeicoes_usuario (user_id, lower(nome));
CREATE INDEX IF NOT EXISTS idx_refeicoes_usuario_user
  ON refeicoes_usuario (user_id, inicio);

-- Semeia a partir das faixas que cada pessoa já tinha: quem customizou mantém.
INSERT INTO refeicoes_usuario (user_id, nome, inicio, fim)
SELECT u.id,
       CASE f.refeicao
         WHEN 'cafe_da_manha' THEN 'Café da manhã'
         WHEN 'almoco'        THEN 'Almoço'
         WHEN 'lanche'        THEN 'Lanche'
         WHEN 'janta'         THEN 'Janta'
         ELSE                      'Ceia'
       END,
       f.inicio,
       f.fim
FROM users u
CROSS JOIN LATERAL jsonb_to_recordset(u.faixas_refeicao)
  AS f(refeicao text, inicio text, fim text);

ALTER TABLE registros_alimentares ADD COLUMN refeicao_id UUID;

UPDATE registros_alimentares r
SET refeicao_id = ru.id
FROM refeicoes_usuario ru
WHERE ru.user_id = r.user_id
  AND lower(ru.nome) = lower(CASE r.refeicao
        WHEN 'cafe_da_manha' THEN 'Café da manhã'
        WHEN 'almoco'        THEN 'Almoço'
        WHEN 'lanche'        THEN 'Lanche'
        WHEN 'janta'         THEN 'Janta'
        ELSE                      'Ceia'
      END);

-- Trava de segurança: se sobrou registro sem refeição, a transação inteira volta
-- e nada é perdido. É o que separa migration de acidente.
DO $$
DECLARE orfaos INT;
BEGIN
  SELECT count(*) INTO orfaos FROM registros_alimentares WHERE refeicao_id IS NULL;
  IF orfaos > 0 THEN
    RAISE EXCEPTION 'migration 003: % registro(s) sem refeicao_id', orfaos;
  END IF;
END $$;

ALTER TABLE registros_alimentares
  ALTER COLUMN refeicao_id SET NOT NULL,
  ADD CONSTRAINT registros_refeicao_fk
    FOREIGN KEY (refeicao_id) REFERENCES refeicoes_usuario(id) ON DELETE RESTRICT,
  DROP COLUMN refeicao;

CREATE INDEX IF NOT EXISTS idx_registros_refeicao ON registros_alimentares (refeicao_id);

ALTER TABLE users DROP COLUMN faixas_refeicao;
DROP TYPE IF EXISTS refeicao;
```

- [ ] **Step 2: Adicionar o código de erro**

Em `backend/src/lib/erros.ts`, acrescentar `'REFEICAO_EM_USO'` ao union `CodigoErro` e `REFEICAO_EM_USO: 409` ao `STATUS_PADRAO`.

- [ ] **Step 3: Escrever o repositório**

`backend/src/repos/refeicoes.ts`:

```ts
import type pg from 'pg';
import { consultar, consultarUm, pool } from '../db/index.js';
import { acomodar } from '../domain/refeicao.js';
import { AppError } from '../lib/erros.js';
import { REFEICOES_INICIAIS, type Refeicao } from '../domain/tipos.js';

const COLUNAS = 'id, nome, inicio, fim';

export async function listarRefeicoes(userId: string): Promise<Refeicao[]> {
  return consultar<Refeicao>(
    `SELECT ${COLUNAS} FROM refeicoes_usuario WHERE user_id = $1 ORDER BY inicio ASC`,
    [userId],
  );
}

export async function buscarRefeicao(userId: string, id: string): Promise<Refeicao | null> {
  return consultarUm<Refeicao>(
    `SELECT ${COLUNAS} FROM refeicoes_usuario WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
}

/** Conta nova: sem refeição nenhuma não dá para registrar comida. */
export async function semearRefeicoes(cliente: pg.PoolClient, userId: string): Promise<void> {
  for (const r of REFEICOES_INICIAIS) {
    await cliente.query(
      'INSERT INTO refeicoes_usuario (user_id, nome, inicio, fim) VALUES ($1, $2, $3, $4)',
      [userId, r.nome, r.inicio, r.fim],
    );
  }
}

/**
 * Criar e mover acontecem numa transação só: as vizinhas mudam junto, ou nada
 * muda. Meio caminho aqui significaria um dia com buraco ou sobreposição.
 */
export async function criarRefeicao(
  userId: string,
  dados: { nome: string; inicio: string; fim: string },
): Promise<Refeicao> {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const existentes = await listarNaTransacao(cliente, userId);
    const mudadas = acomodar(existentes, { inicio: dados.inicio, fim: dados.fim });
    await aplicarMudancas(cliente, userId, mudadas);

    const nova = await cliente.query<Refeicao>(
      `INSERT INTO refeicoes_usuario (user_id, nome, inicio, fim)
       VALUES ($1, $2, $3, $4) RETURNING ${COLUNAS}`,
      [userId, dados.nome, dados.inicio, dados.fim],
    );
    await cliente.query('COMMIT');
    return nova.rows[0]!;
  } catch (e) {
    await cliente.query('ROLLBACK');
    throw traduzirConflito(e);
  } finally {
    cliente.release();
  }
}

export async function atualizarRefeicao(
  userId: string,
  id: string,
  campos: { nome?: string; inicio?: string; fim?: string },
): Promise<Refeicao | null> {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const existentes = await listarNaTransacao(cliente, userId);
    const atual = existentes.find((r) => r.id === id);
    if (!atual) {
      await cliente.query('ROLLBACK');
      return null;
    }

    const inicio = campos.inicio ?? atual.inicio;
    const fim = campos.fim ?? atual.fim;
    if (inicio !== atual.inicio || fim !== atual.fim) {
      await aplicarMudancas(cliente, userId, acomodar(existentes, { inicio, fim }, id));
    }

    const linha = await cliente.query<Refeicao>(
      `UPDATE refeicoes_usuario SET nome = $3, inicio = $4, fim = $5
       WHERE id = $1 AND user_id = $2 RETURNING ${COLUNAS}`,
      [id, userId, campos.nome ?? atual.nome, inicio, fim],
    );
    await cliente.query('COMMIT');
    return linha.rows[0] ?? null;
  } catch (e) {
    await cliente.query('ROLLBACK');
    throw traduzirConflito(e);
  } finally {
    cliente.release();
  }
}

export async function apagarRefeicao(userId: string, id: string): Promise<boolean> {
  const emUso = await consultarUm<{ existe: boolean }>(
    'SELECT EXISTS (SELECT 1 FROM registros_alimentares WHERE refeicao_id = $1) AS existe',
    [id],
  );
  if (emUso?.existe) {
    throw new AppError(
      'REFEICAO_EM_USO',
      'essa refeição já tem comida registrada. renomeie em vez de apagar',
    );
  }
  const linhas = await consultar<{ id: string }>(
    'DELETE FROM refeicoes_usuario WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId],
  );
  return linhas.length > 0;
}

async function listarNaTransacao(cliente: pg.PoolClient, userId: string): Promise<Refeicao[]> {
  const r = await cliente.query<Refeicao>(
    `SELECT ${COLUNAS} FROM refeicoes_usuario WHERE user_id = $1 ORDER BY inicio ASC FOR UPDATE`,
    [userId],
  );
  return r.rows;
}

async function aplicarMudancas(
  cliente: pg.PoolClient,
  userId: string,
  mudadas: Refeicao[],
): Promise<void> {
  for (const m of mudadas) {
    await cliente.query(
      'UPDATE refeicoes_usuario SET inicio = $3, fim = $4 WHERE id = $1 AND user_id = $2',
      [m.id, userId, m.inicio, m.fim],
    );
  }
}

/** O índice único de nome vira mensagem de gente em vez de erro do Postgres. */
function traduzirConflito(e: unknown): unknown {
  if ((e as { code?: string }).code === '23505') {
    return new AppError('VALIDACAO', 'você já tem uma refeição com esse nome');
  }
  return e;
}
```

- [ ] **Step 4: Conferir que compila isolado**

Run: `cd backend && npx tsc --noEmit src/repos/refeicoes.ts --module nodenext --moduleResolution nodenext --target es2022 --strict 2>&1 | head -20`
Expected: erros apenas de imports não resolvidos de outros arquivos ainda não migrados, nenhum erro dentro do arquivo novo.

- [ ] **Step 5: Commit**

```bash
git add backend/src/db/migrations/003_refeicoes_usuario.sql backend/src/repos/refeicoes.ts backend/src/lib/erros.ts
git commit -m "Migration 003 e repositorio das refeicoes do usuario"
```

---

### Task 3: Rotas de refeições e semente no cadastro

**Files:**
- Create: `backend/src/routes/refeicoes.ts`
- Modify: `backend/src/app.ts` (montar a rota)
- Modify: `backend/src/routes/auth.ts` (semear no registro)
- Modify: `backend/src/repos/usuarios.ts` (criar usuário e refeições na mesma transação)
- Modify: `docs/api-contract.md`

**Interfaces:**
- Consumes: repositório da Task 2; `perfilDe(req)` de `middleware/autenticar.js`; `horaValida` de `domain/refeicao.js`.
- Produces: `rotasRefeicoes: Router` montado em `/api/refeicoes`; `criarUsuario` passa a semear as refeições.

- [ ] **Step 1: Escrever as rotas**

`backend/src/routes/refeicoes.ts`:

```ts
import { Router } from 'express';
import { z } from 'zod';
import { perfilDe } from '../middleware/autenticar.js';
import { horaValida } from '../domain/refeicao.js';
import { AppError } from '../lib/erros.js';
import {
  apagarRefeicao,
  atualizarRefeicao,
  criarRefeicao,
  listarRefeicoes,
} from '../repos/refeicoes.js';

export const rotasRefeicoes: Router = Router();

const hora = z.string().refine(horaValida, 'horário deve estar no formato HH:MM');
const nome = z.string().trim().min(1, 'dê um nome à refeição').max(40);

const novaSchema = z.object({ nome, inicio: hora, fim: hora });
const patchSchema = z
  .object({ nome: nome.optional(), inicio: hora.optional(), fim: hora.optional() })
  .refine((o) => Object.keys(o).length > 0, 'nada para atualizar');

rotasRefeicoes.get('/', async (req, res, next) => {
  try {
    res.json({ refeicoes: await listarRefeicoes(perfilDe(req).id) });
  } catch (e) {
    next(e);
  }
});

rotasRefeicoes.post('/', async (req, res, next) => {
  try {
    const dados = novaSchema.parse(req.body);
    res.status(201).json(await criarRefeicao(perfilDe(req).id, dados));
  } catch (e) {
    next(e);
  }
});

rotasRefeicoes.patch('/:id', async (req, res, next) => {
  try {
    const campos = patchSchema.parse(req.body);
    const atualizada = await atualizarRefeicao(perfilDe(req).id, req.params.id, campos);
    if (!atualizada) throw new AppError('NAO_ENCONTRADO', 'refeição não encontrada');
    res.json(atualizada);
  } catch (e) {
    next(e);
  }
});

rotasRefeicoes.delete('/:id', async (req, res, next) => {
  try {
    const apagou = await apagarRefeicao(perfilDe(req).id, req.params.id);
    if (!apagou) throw new AppError('NAO_ENCONTRADO', 'refeição não encontrada');
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
```

- [ ] **Step 2: Montar a rota**

Em `backend/src/app.ts`, importar `rotasRefeicoes` e acrescentar junto das outras:

```ts
  app.use('/api/refeicoes', autenticar, rotasRefeicoes);
```

- [ ] **Step 3: Semear no cadastro**

Em `backend/src/repos/usuarios.ts`, `criarUsuario` passa a usar uma transação e chamar `semearRefeicoes` com o mesmo cliente, logo após o `INSERT INTO users ... RETURNING`. Conta e refeições nascem juntas ou não nascem.

- [ ] **Step 4: Atualizar o contrato**

Em `docs/api-contract.md`: trocar `interface FaixaRefeicao` por `interface Refeicao { id: string; nome: string; inicio: string; fim: string; }`, remover `faixas_refeicao` de `Perfil`, e documentar as quatro rotas novas com os mesmos verbos e respostas do Step 1, incluindo `409 REFEICAO_EM_USO`.

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/refeicoes.ts backend/src/app.ts backend/src/repos/usuarios.ts backend/src/routes/auth.ts docs/api-contract.md
git commit -m "Rotas de refeicoes e semente das cinco padrao na conta nova"
```

---

### Task 4: Registros, resumo e perfil apontando para a refeição

**Files:**
- Modify: `backend/src/repos/registros.ts`
- Modify: `backend/src/routes/registros.ts`
- Modify: `backend/src/routes/resumo.ts`
- Modify: `backend/src/routes/me.ts`
- Modify: `docs/api-contract.md`

**Interfaces:**
- Consumes: `listarRefeicoes`, `buscarRefeicao` da Task 2; `detectarRefeicao` da Task 1.
- Produces: `Registro` com `refeicao_id`/`refeicao_nome`; `/dia` e `/resumo` agrupando pela lista do usuário.

- [ ] **Step 1: Repositório de registros**

Em `backend/src/repos/registros.ts`: `LinhaRegistro.refeicao` vira `refeicao_id: string` e `refeicao_nome: string`; `COLUNAS` passa a ser qualificada com JOIN:

```ts
const COLUNAS = `r.id, r.tipo_entrada, r.refeicao_id, ref.nome AS refeicao_nome,
  r.descricao_bruta, r.midia_url, r.alimentos_detectados, r.calorias_total,
  r.carboidrato_total_g, r.proteina_total_g, r.gordura_total_g, r.criado_em`;

const DE = `FROM registros_alimentares r JOIN refeicoes_usuario ref ON ref.id = r.refeicao_id`;
```

Todo `SELECT ... FROM registros_alimentares` vira `SELECT ${COLUNAS} ${DE}`, com os `WHERE` prefixados por `r.`. `NovoRegistro.refeicao` vira `refeicao_id: string`; `atualizarRegistro` troca `campos.refeicao` por `campos.refeicao_id`.

`RETURNING` não alcança a tabela do JOIN, então `INSERT` e `UPDATE` passam a devolver só o `id` e o registro completo vem de uma função nova, usada também por `buscarRegistro`:

```ts
async function porId(id: string): Promise<Registro> {
  const linha = await consultarUm<LinhaRegistro>(`SELECT ${COLUNAS} ${DE} WHERE r.id = $1`, [id]);
  if (!linha) throw new Error(`registro ${id} sumiu logo após ser gravado`);
  return paraRegistro(linha);
}
```

- [ ] **Step 2: Rotas de registro**

Em `backend/src/routes/registros.ts`:
- `detectarRefeicao(agora, perfil.timezone, await listarRefeicoes(perfil.id))` no lugar de `perfil.faixas_refeicao`.
- `refeicao_sugerida` passa a ser o objeto `Refeicao` inteiro.
- Os schemas Zod trocam `refeicao: z.enum(REFEICOES)` por `refeicao_id: z.uuid()`, e antes de gravar confirmam com `buscarRefeicao(perfil.id, refeicao_id)` — id de outra pessoa não entra no seu histórico. Se não achar: `AppError('NAO_ENCONTRADO', 'refeição não encontrada')`.
- Em `/dia`, `REFEICOES.map` vira `(await listarRefeicoes(perfil.id)).map`, agrupando por `r.refeicao_id`. O filtro que escondia a ceia vazia vira regra geral: refeição sem registro não aparece, exceto quando o dia inteiro está vazio.

- [ ] **Step 3: Resumo**

Em `backend/src/routes/resumo.ts`, mesmo padrão: `refeicoes: (await listarRefeicoes(perfil.id)).map(...)` devolvendo `{ refeicao_id, refeicao_nome, calorias, quantidade_registros }`.

- [ ] **Step 4: Perfil**

Em `backend/src/routes/me.ts`, remover `faixaSchema`, o campo `faixas_refeicao` do `perfilSchema` e o import de `REFEICOES`/`horaValida`. Em `repos/usuarios.ts`, remover `faixas_refeicao` de `LinhaUsuario`, de `COLUNAS` e de `paraPerfil`.

- [ ] **Step 5: Verificar**

Run: `cd backend && npm run typecheck && npm test -- --run`
Expected: typecheck limpo e todos os testes passando.

- [ ] **Step 6: Atualizar o contrato e commitar**

Em `docs/api-contract.md`, trocar `refeicao` por `refeicao_id`/`refeicao_nome` em `Registro`, `GET /dia`, `GET /resumo` e `refeicao_sugerida`.

```bash
git add backend/src docs/api-contract.md
git commit -m "Registros apontam para a refeicao do usuario no lugar do enum"
```

---

### Task 5: Frontend — lista de refeições no lugar das constantes

**Files:**
- Create: `frontend/src/lib/RefeicoesContext.tsx`
- Modify: `frontend/src/lib/types.ts`, `frontend/src/lib/format.ts`, `frontend/src/lib/api.ts`
- Modify: `frontend/src/App.tsx`, `frontend/src/pages/Home.tsx`
- Modify: `frontend/src/components/ItemRegistro.tsx`, `ListaRefeicoes.tsx`, `CardPost.tsx`, `ConfirmacaoRegistro.tsx`

**Interfaces:**
- Consumes: `GET /api/refeicoes` da Task 3.
- Produces: `useRefeicoes(): { refeicoes: Refeicao[]; recarregar: () => Promise<void> }`; `api.refeicoes()`, `api.criarRefeicao()`, `api.atualizarRefeicao()`, `api.excluirRefeicao()`.

- [ ] **Step 1: Tipos e API**

Em `frontend/src/lib/types.ts`: `Refeicao` vira `{ id: string; nome: string; inicio: string; fim: string }`; `Registro` ganha `refeicao_id` e `refeicao_nome` no lugar de `refeicao`; `Perfil` perde `faixas_refeicao`; `GrupoRefeicao` passa a ter `refeicao_id`/`refeicao_nome`.

Em `frontend/src/lib/api.ts`, acrescentar os quatro métodos, seguindo o estilo dos existentes:

```ts
  refeicoes: () => requisitar<{ refeicoes: Refeicao[] }>('/refeicoes'),
  criarRefeicao: (dados: { nome: string; inicio: string; fim: string }) =>
    requisitar<Refeicao>('/refeicoes', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarRefeicao: (id: string, campos: { nome?: string; inicio?: string; fim?: string }) =>
    requisitar<Refeicao>(`/refeicoes/${id}`, { method: 'PATCH', body: JSON.stringify(campos) }),
  excluirRefeicao: (id: string) => requisitar<void>(`/refeicoes/${id}`, { method: 'DELETE' }),
```

Remover `REFEICOES` e `NOME_REFEICAO` de `lib/format.ts`.

- [ ] **Step 2: Contexto**

`frontend/src/lib/RefeicoesContext.tsx` com o mesmo formato do `AuthContext` existente: provider que busca `api.refeicoes()` uma vez quando há perfil, guarda em estado, e expõe `refeicoes` e `recarregar`. Envolver a árvore no `App.tsx`, dentro do provider de autenticação.

- [ ] **Step 3: Componentes**

- `ItemRegistro`: o `<select>` de refeição passa a listar `refeicoes` do contexto, com `value={registro.refeicao_id}`; `aoTrocarRefeicao(id, refeicaoId)`.
- `ListaRefeicoes`: `abertas` vira `string[]` de ids; o título de cada grupo passa a ser `grupo.refeicao_nome`.
- `CardPost`: `{post.refeicao_nome}` no lugar de `NOME_REFEICAO[post.refeicao]`.
- `ConfirmacaoRegistro`: o estado inicial vira `interpretacao.refeicao_sugerida.id` e o select lê do contexto.
- `Home`: `trocarRefeicao` envia `{ refeicao_id: refeicaoId }`.

- [ ] **Step 4: Verificar**

Run: `cd frontend && npm run typecheck && npm run build`
Expected: os dois limpos.

- [ ] **Step 5: Commit**

```bash
git add frontend/src
git commit -m "Frontend le as refeicoes do usuario em vez das constantes fixas"
```

---

### Task 6: Frontend — seção de refeições no perfil

**Files:**
- Create: `frontend/src/components/SecaoRefeicoes.tsx`
- Delete: `frontend/src/components/FaixasHorario.tsx`
- Modify: `frontend/src/pages/Perfil.tsx`, `frontend/src/pages/formularioPerfil.ts`
- Modify: `frontend/src/styles/forms.css`

- [ ] **Step 1: Tirar as faixas e o timezone do formulário**

Em `formularioPerfil.ts`, remover `faixas_refeicao` e `timezone` de `Formulario`, `paraFormulario` e `paraEntrada`. Em `Perfil.tsx`, remover o import e o uso de `FaixasHorario` e o campo de timezone. Apagar `FaixasHorario.tsx`.

> O timezone passa a ser enviado automaticamente na Entrega 2. Nesta entrega ele apenas some da tela e continua com o valor que o servidor já tem.

- [ ] **Step 2: Criar a seção**

`SecaoRefeicoes.tsx`: lista as refeições do contexto, cada uma com nome,
`inicio–fim`, um botão de renomear (edição inline) e um de excluir usando o
`useConfirmacao` que já existe. Abaixo, um formulário "+ nova refeição" com nome,
início e fim. Esqueleto:

```tsx
export default function SecaoRefeicoes({ aoFalhar }: { aoFalhar: (e: unknown) => void }) {
  const { refeicoes, recarregar } = useRefeicoes();
  const { confirmar, elemento } = useConfirmacao();
  const [nova, setNova] = useState({ nome: '', inicio: '', fim: '' });
  const [salvando, setSalvando] = useState(false);

  async function criar(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    try {
      await api.criarRefeicao(nova);
      setNova({ nome: '', inicio: '', fim: '' });
      await recarregar();
    } catch (falha: unknown) {
      aoFalhar(falha);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(r: Refeicao) {
    const ok = await confirmar({
      titulo: `excluir ${r.nome}`,
      texto: 'a faixa de horário dela passa para a refeição vizinha.',
      rotulo: 'excluir',
    });
    if (!ok) return;
    try {
      await api.excluirRefeicao(r.id);
      await recarregar();
    } catch (falha: unknown) {
      aoFalhar(falha);
    }
  }

  return (
    <section className="cartao">
      <h2 className="titulo-secao">refeições</h2>
      {refeicoes.map((r) => (
        <div className="linha-refeicao" key={r.id}>
          <span>{r.nome}</span>
          <span className="mudo">{r.inicio}–{r.fim}</span>
          <button type="button" className="botao-mini botao-perigo" onClick={() => void excluir(r)}>
            excluir
          </button>
        </div>
      ))}

      <form onSubmit={(evento) => void criar(evento)}>
        {/* Campo nome + dois inputs type="time" + botão "criar", desabilitado com salvando */}
      </form>
      {elemento}
    </section>
  );
}
```

Os erros da API vão para o `Erro` que a página já usa — inclusive
`REFEICAO_EM_USO` e `VALIDACAO` do `acomodar`, cujas mensagens já dizem o que
fazer. Os campos de horário usam `<input type="time">`, que no celular abre o
seletor nativo e já entrega `HH:MM`.

- [ ] **Step 3: Verificar**

Run: `cd frontend && npm run typecheck && npm run build`
Expected: limpos. Conferir na mão, com o backend rodando: criar "Pré-treino" 15:00–17:00 e ver o Lanche encolher; tentar apagar uma refeição com registro e ver a recusa.

- [ ] **Step 4: Commit**

```bash
git add frontend/src
git commit -m "Secao de refeicoes no perfil, no lugar dos dez campos de horario"
```

---

### Task 7: Subir na VPS

**Files:** nenhum. É o roteiro de aplicação.

- [ ] **Step 1: Dump antes de tudo**

```bash
cd ~/dieta-preguicoso
docker compose exec -T postgres pg_dump -U dieta dieta | gzip > ~/backups/antes-003-$(date +%F).sql.gz
ls -lh ~/backups/antes-003-*.sql.gz
```

Expected: arquivo com tamanho maior que zero. **Sem isso, não siga.**

- [ ] **Step 2: Parar o backend e anotar as contagens de antes**

```bash
docker compose stop backend
docker compose exec postgres psql -U dieta -d dieta -c \
  "SELECT refeicao, count(*) FROM registros_alimentares GROUP BY 1 ORDER BY 2 DESC;" \
  | tee ~/backups/contagem-antes-003.txt
```

Escrita concorrente durante a migration é o único jeito de perder registro aqui.
A contagem impressa é o que o Step 4 compara depois — sem ela, "bateu" vira
opinião.

- [ ] **Step 3: Subir o código e migrar**

```bash
git pull
docker compose up -d --build backend frontend
docker compose logs --tail 30 backend
```

Expected: `[migrate] aplicada: 003_refeicoes_usuario.sql` e `[api] ouvindo na porta 3001`. Se aparecer `migration 003: N registro(s) sem refeicao_id`, nada foi alterado — mande o log antes de tentar de novo.

O frontend também mudou nesta entrega (perfil não manda mais `faixas_refeicao`) — reconstruir só o `backend` deixa o navegador com o bundle antigo, que quebra ao ler um campo que o backend não manda mais. Reconstrua os dois juntos quando o frontend também mudou.

- [ ] **Step 4: Conferir os dados**

```bash
docker compose exec postgres psql -U dieta -d dieta -c \
  "SELECT ru.nome, count(r.id) FROM refeicoes_usuario ru
     LEFT JOIN registros_alimentares r ON r.refeicao_id = ru.id
    GROUP BY ru.nome ORDER BY 2 DESC;"
```

Expected: as contagens batendo com o que havia por refeição antes da migration.

- [ ] **Step 5: Teste de ponta a ponta pelo celular**

Registrar uma refeição por foto e conferir `docker compose logs -f backend | grep '\[ia\]'` — uma linha `ok`. Depois criar "Pré-treino" no perfil e registrar algo dentro da janela dele.

---

## Ordem e paralelismo

As tasks 1 → 2 → 3 → 4 são sequenciais: cada uma depende do tipo que a anterior definiu. A 5 depende da 4 (o contrato novo), e a 6 depende da 5 (o contexto). A 7 é a última. Não há trabalho paralelizável com escopo de arquivo disjunto neste plano.
