# Relatório mensal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Modelo:** cada tarefa é implementada por subagente **Sonnet** (`model: "sonnet"`); a sessão Opus só coordena e revisa. Não executar antes de o usuário liberar.

**Goal:** Entregar a tela Relatório (03 do design "Sistema") ponta a ponta: contrato, cálculo testado no backend, `GET /api/resumo/mes` e a página `/relatorio` em MUI + Motion com duas visões navegáveis por setas (D15): mês (`?mes=`, `‹ setembro ›`) e dia (`?data=`, `‹ 13 set ›`).

**Architecture:** O cálculo inteiro (médias, variação vs. mês anterior, agrupamento por dia local) é uma função pura em `backend/src/domain/relatorio.ts`, alimentada pela consulta que já existe (`listarNoIntervalo`) sobre os intervalos de `intervaloDoMes`. A rota em `routes/resumo.ts` só valida, busca e serializa. No frontend, a lógica de apresentação e navegação (linhas de variação, filtro, formatação, escolha da visão pela URL, deslocar dia, status do dia) fica em `frontend/src/lib/relatorio.ts` com testes; `pages/Relatorio.tsx` só escolhe entre `VisaoMes` e `VisaoDia`, que compartilham cabeçalho com setas, barras e linha de refeição em `components/relatorio/`. A visão do dia não tem endpoint novo: usa `resumo/dia` + `registros/dia`.

**Tech Stack:** Express 5 + `pg` + Zod 4 + Vitest (backend); React 19 + MUI 9 (CSS variables) + `motion/react` + Vitest (frontend).

**Spec:** `docs/superpowers/specs/2026-09-16-redesign-liquid-glass-design.md` (decisão D15 e seções "Relatório mensal", "Relatório do dia (D15)", "Telas › Relatório", "Tokens", "Funções puras compartilhadas"). Referência visual: seção `scr-relatorio` de `C:\dz\design_handoff_calendario_agua\Dieta Preguicoso - Sistema.dc.html` (linhas 362–451) e `screenshots/03-telas.png`.

## Global Constraints

- `docs/api-contract.md` é a fonte da verdade: o contrato muda **antes** do código (Task 1).
- Toda entrada de rota validada com Zod antes de tocar no banco; formato de mês `^\d{4}-(0[1-9]|1[0-2])$`, mensagem `mês deve estar no formato YYYY-MM` → `400 VALIDACAO` (o middleware já converte `ZodError`).
- SQL puro em `backend/src/repos/`, sem ORM. Nenhuma migration neste plano.
- Fuso: só via `backend/src/domain/tempo.ts` (`dataLocal`, `intervaloDoMes`, `mesLocal`) — nenhum outro módulo mexe com fuso na mão.
- Default de `mes`: mês atual no fuso do perfil.
- `media_calorias` e `por_refeicao[].media_calorias` são inteiros; `variacao_percentual` com 1 casa (`arredondar`); `dias[].calorias` e `dias[].refeicoes[].calorias` com 1 casa.
- `por_refeicao`: só refeições com kcal > 0 no mês, ordem `media_calorias` desc.
- `dias`: só dias com registro, ordem desc; refeições do dia na ordem de `inicio`; `descricao` = nomes dos alimentos juntados com `", "`.
- Frontend sem CSS puro: estilos via `sx`/tema MUI. Cores só por token do tema (`theme.vars.palette.*`), incluindo `theme.vars.palette.refeicao[corDaRefeicao(id, refeicoes)]` para as barras.
- Pré-requisito: plano A concluído (tema com `cssVariables`, `lib/visual.ts` com `corDaRefeicao`/`mesLongo`/`deslocarMes`, Vitest no frontend com `npm test`, rota `/relatorio` apontando para `frontend/src/pages/Relatorio.tsx`).
- Navegação (D15): `?data=` válida e ≤ hoje → visão do dia; senão `?mes=` válido e ≤ mês atual → visão do mês; senão mês atual. Seta `›` desabilitada no mês atual / em hoje. Rótulos acessíveis: "mês anterior", "próximo mês", "dia anterior", "próximo dia".
- Status do dia no frontend segue a mesma regra do backend (`domain/social.ts`): percentual arredondado a 1 casa, `<90` abaixo, `>110` acima.
- Testes sem rede. Commits em português.

---

## File Structure

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `docs/api-contract.md` | Modificar | Documentar `GET /api/resumo/mes` |
| `backend/src/domain/tempo.ts` | Modificar | `mesAnterior(mes)` |
| `backend/src/domain/tempo.test.ts` | Modificar | Testes de `mesAnterior` |
| `backend/src/domain/relatorio.ts` | Criar | `montarRelatorioMes` (puro) + tipos do relatório |
| `backend/src/domain/relatorio.test.ts` | Criar | Testes do cálculo |
| `backend/src/routes/resumo.ts` | Modificar | Rota `GET /mes` |
| `frontend/src/lib/types.ts` | Modificar | Tipos `RelatorioMes` & cia. |
| `frontend/src/lib/api.ts` | Modificar | `api.resumoMes(mes?)` |
| `frontend/src/lib/relatorio.ts` | Criar | Funções puras de apresentação e navegação (mês e dia) |
| `frontend/src/lib/relatorio.test.ts` | Criar | Testes dessas funções |
| `frontend/src/components/relatorio/estilos.ts` | Criar | Estilos `sx` compartilhados |
| `frontend/src/components/relatorio/CabecalhoNavegavel.tsx` | Criar | Título com setas `‹ ›` |
| `frontend/src/components/relatorio/BarrasPorRefeicao.tsx` | Criar | Barras animadas (mês e dia) |
| `frontend/src/components/relatorio/LinhaRefeicao.tsx` | Criar | Linha `refeição · descrição  kcal` |
| `frontend/src/pages/relatorio/VisaoMes.tsx` | Criar | Visão do mês |
| `frontend/src/pages/relatorio/VisaoDia.tsx` | Criar | Visão do dia |
| `frontend/src/pages/Relatorio.tsx` | Substituir (stub do plano A) | Escolhe a visão pela URL |

A consulta ao banco reaproveita `listarNoIntervalo` de `backend/src/repos/registros.ts` (já filtra por usuário e intervalo `[inicio, fim)` e traz `refeicao_nome`) e `listarRefeicoes` de `backend/src/repos/refeicoes.ts` (já ordena por `inicio`). Nenhuma consulta nova é necessária.

---

### Task 1: Contrato + cálculo do relatório no backend (TDD)

**Files:**
- Modify: `docs/api-contract.md` (inserir depois da seção `### GET /api/resumo/semana?fim=YYYY-MM-DD`, antes de `## Detecção automática de refeição`)
- Modify: `backend/src/domain/tempo.ts` (acrescentar ao fim)
- Modify: `backend/src/domain/tempo.test.ts` (acrescentar ao fim)
- Create: `backend/src/domain/relatorio.ts`
- Test: `backend/src/domain/relatorio.test.ts`

**Interfaces:**
- Consumes: `arredondar(n)` de `domain/nutricao.ts`; `dataLocal(instante, timezone)` de `domain/tempo.ts`; tipos `Registro`, `Refeicao` de `domain/tipos.ts`.
- Produces:
  - `mesAnterior(mes: string): string` em `domain/tempo.ts`.
  - Em `domain/relatorio.ts`:
    ```ts
    export interface RelatorioRefeicao { refeicao_id: string; refeicao_nome: string; media_calorias: number; variacao_percentual: number | null }
    export interface RelatorioDiaRefeicao { refeicao_id: string; refeicao_nome: string; calorias: number; descricao: string }
    export interface RelatorioDia { data: string; calorias: number; refeicoes: RelatorioDiaRefeicao[] }
    export interface RelatorioMes { media_calorias: number; por_refeicao: RelatorioRefeicao[]; dias: RelatorioDia[] }
    export function montarRelatorioMes(registrosMes: Registro[], registrosMesAnterior: Registro[], refeicoes: Refeicao[], timezone: string): RelatorioMes;
    ```
    (sem o campo `mes` — a rota acrescenta.)

- [ ] **Step 1: Documentar o endpoint no contrato**

Inserir em `docs/api-contract.md`, logo antes de `## Detecção automática de refeição`:

````markdown
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
````

- [ ] **Step 2: Escrever o teste falho de `mesAnterior`**

Acrescentar ao fim de `backend/src/domain/tempo.test.ts` (e adicionar `mesAnterior` ao `import` do topo do arquivo):

```ts
describe('mesAnterior', () => {
  it('volta um mês dentro do ano', () => {
    expect(mesAnterior('2026-09')).toBe('2026-08');
  });

  it('atravessa a virada de ano', () => {
    expect(mesAnterior('2026-01')).toBe('2025-12');
  });

  it('recusa formato inválido', () => {
    expect(() => mesAnterior('2026-13')).toThrow('mês inválido');
  });
});
```

O import do topo fica:

```ts
import {
  dataLocal,
  diasDoMes,
  intervaloDoDia,
  intervaloDoMes,
  mesAnterior,
  mesLocal,
  somarDias,
  timezoneValida,
} from './tempo.js';
```

- [ ] **Step 3: Escrever os testes falhos de `montarRelatorioMes`**

Criar `backend/src/domain/relatorio.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { montarRelatorioMes } from './relatorio.js';
import type { Alimento, Refeicao, Registro } from './tipos.js';

const TZ = 'America/Sao_Paulo';

const CAFE: Refeicao = { id: 'cafe', nome: 'Café da manhã', inicio: '05:00', fim: '10:00' };
const ALMOCO: Refeicao = { id: 'almoco', nome: 'Almoço', inicio: '10:01', fim: '15:00' };
const LANCHE: Refeicao = { id: 'lanche', nome: 'Lanche', inicio: '15:01', fim: '18:00' };
const JANTA: Refeicao = { id: 'janta', nome: 'Janta', inicio: '18:01', fim: '22:00' };
const CEIA: Refeicao = { id: 'ceia', nome: 'Ceia', inicio: '22:01', fim: '04:59' };
const REFEICOES = [CAFE, ALMOCO, LANCHE, JANTA, CEIA];

function alimento(nome: string, calorias: number): Alimento {
  return { nome, quantidade_estimada: '1 porção', calorias, carboidrato_g: 0, proteina_g: 0, gordura_g: 0 };
}

let contador = 0;
function registro(refeicao: Refeicao, criadoEm: string, alimentos: Alimento[]): Registro {
  contador += 1;
  return {
    id: `r${contador}`,
    tipo_entrada: 'texto',
    refeicao_id: refeicao.id,
    refeicao_nome: refeicao.nome,
    descricao_bruta: '',
    midia_url: null,
    alimentos_detectados: alimentos,
    calorias_total: alimentos.reduce((s, a) => s + a.calorias, 0),
    carboidrato_total_g: 0,
    proteina_total_g: 0,
    gordura_total_g: 0,
    criado_em: criadoEm,
  };
}

describe('montarRelatorioMes', () => {
  it('mês sem registro devolve tudo zerado e vazio', () => {
    expect(montarRelatorioMes([], [], REFEICOES, TZ)).toEqual({
      media_calorias: 0,
      por_refeicao: [],
      dias: [],
    });
  });

  it('média do mês divide só pelos dias com registro', () => {
    const mes = [
      registro(ALMOCO, '2026-09-10T15:00:00Z', [alimento('arroz', 800)]),
      registro(JANTA, '2026-09-10T22:00:00Z', [alimento('sopa', 400)]),
      registro(ALMOCO, '2026-09-12T15:00:00Z', [alimento('lasanha', 600)]),
    ];
    expect(montarRelatorioMes(mes, [], REFEICOES, TZ).media_calorias).toBe(900);
  });

  it('média por refeição divide pelos dias com registro de qualquer refeição, em ordem desc', () => {
    const mes = [
      registro(ALMOCO, '2026-09-10T15:00:00Z', [alimento('arroz', 800)]),
      registro(JANTA, '2026-09-10T22:00:00Z', [alimento('sopa', 400)]),
      registro(ALMOCO, '2026-09-12T15:00:00Z', [alimento('lasanha', 600)]),
    ];
    const { por_refeicao } = montarRelatorioMes(mes, [], REFEICOES, TZ);
    expect(por_refeicao).toEqual([
      { refeicao_id: 'almoco', refeicao_nome: 'Almoço', media_calorias: 700, variacao_percentual: null },
      { refeicao_id: 'janta', refeicao_nome: 'Janta', media_calorias: 200, variacao_percentual: null },
    ]);
  });

  it('variação compara com a média do mês anterior e é null quando lá era 0', () => {
    const mes = [
      registro(ALMOCO, '2026-09-10T15:00:00Z', [alimento('arroz', 700)]),
      registro(JANTA, '2026-09-10T22:00:00Z', [alimento('sopa', 400)]),
    ];
    const anterior = [
      registro(ALMOCO, '2026-08-03T15:00:00Z', [alimento('arroz', 600)]),
      registro(ALMOCO, '2026-08-04T15:00:00Z', [alimento('arroz', 400)]),
    ];
    const { por_refeicao } = montarRelatorioMes(mes, anterior, REFEICOES, TZ);
    // agosto: 1000 kcal de almoço ÷ 2 dias = 500; setembro: 700 ÷ 1 dia = 700 → +40%
    expect(por_refeicao.find((r) => r.refeicao_id === 'almoco')?.variacao_percentual).toBe(40);
    expect(por_refeicao.find((r) => r.refeicao_id === 'janta')?.variacao_percentual).toBeNull();
  });

  it('arredonda a variação a 1 casa e a média a inteiro', () => {
    const mes = [registro(ALMOCO, '2026-09-10T15:00:00Z', [alimento('arroz', 310.4)])];
    const anterior = [registro(ALMOCO, '2026-08-10T15:00:00Z', [alimento('arroz', 300)])];
    const [almoco] = montarRelatorioMes(mes, anterior, REFEICOES, TZ).por_refeicao;
    expect(almoco?.media_calorias).toBe(310);
    expect(almoco?.variacao_percentual).toBe(3.5);
  });

  it('refeição com 0 kcal no mês fica fora de por_refeicao, mas aparece no dia', () => {
    const mes = [
      registro(ALMOCO, '2026-09-10T15:00:00Z', [alimento('arroz', 500)]),
      registro(LANCHE, '2026-09-10T19:00:00Z', [alimento('chá', 0)]),
    ];
    const rel = montarRelatorioMes(mes, [], REFEICOES, TZ);
    expect(rel.por_refeicao.map((r) => r.refeicao_id)).toEqual(['almoco']);
    expect(rel.dias[0]?.refeicoes.map((r) => r.refeicao_id)).toEqual(['almoco', 'lanche']);
  });

  it('empate na média segue a ordem de início da refeição, mesmo com a lista fora de ordem', () => {
    const mes = [
      registro(LANCHE, '2026-09-10T19:00:00Z', [alimento('iogurte', 300)]),
      registro(CAFE, '2026-09-10T10:00:00Z', [alimento('pão', 300)]),
    ];
    const rel = montarRelatorioMes(mes, [], [JANTA, LANCHE, CEIA, CAFE, ALMOCO], TZ);
    expect(rel.por_refeicao.map((r) => r.refeicao_id)).toEqual(['cafe', 'lanche']);
  });

  it('dias em ordem desc, refeições por início e descrição com os nomes dos alimentos', () => {
    const mes = [
      registro(JANTA, '2026-09-13T22:00:00Z', [alimento('pizza', 900)]),
      registro(ALMOCO, '2026-09-13T15:00:00Z', [alimento('arroz', 200), alimento('feijão', 128)]),
      registro(ALMOCO, '2026-09-13T16:00:00Z', [alimento('frango', 284)]),
      registro(CAFE, '2026-09-14T11:00:00Z', [alimento('pão na chapa', 418)]),
    ];
    const { dias } = montarRelatorioMes(mes, [], REFEICOES, TZ);
    expect(dias).toEqual([
      {
        data: '2026-09-14',
        calorias: 418,
        refeicoes: [{ refeicao_id: 'cafe', refeicao_nome: 'Café da manhã', calorias: 418, descricao: 'pão na chapa' }],
      },
      {
        data: '2026-09-13',
        calorias: 1512,
        refeicoes: [
          { refeicao_id: 'almoco', refeicao_nome: 'Almoço', calorias: 612, descricao: 'arroz, feijão, frango' },
          { refeicao_id: 'janta', refeicao_nome: 'Janta', calorias: 900, descricao: 'pizza' },
        ],
      },
    ]);
  });

  it('agrupa pelo dia local: 23:30 em SP no dia 30 é 02:30Z do dia 1º', () => {
    const mes = [registro(CEIA, '2026-10-01T02:30:00Z', [alimento('torrada', 150)])];
    const { dias } = montarRelatorioMes(mes, [], REFEICOES, TZ);
    expect(dias.map((d) => d.data)).toEqual(['2026-09-30']);
  });

  it('ceia depois da meia-noite conta no dia local em que foi comida', () => {
    const mes = [
      registro(JANTA, '2026-09-10T22:00:00Z', [alimento('sopa', 400)]),
      registro(CEIA, '2026-09-11T04:00:00Z', [alimento('leite', 120)]), // 01:00 do dia 11 em SP
    ];
    const { dias, media_calorias } = montarRelatorioMes(mes, [], REFEICOES, TZ);
    expect(dias.map((d) => d.data)).toEqual(['2026-09-11', '2026-09-10']);
    expect(media_calorias).toBe(260);
  });
});
```

- [ ] **Step 4: Rodar os testes e ver falhar**

Run (em `backend/`): `npm test -- src/domain/relatorio.test.ts src/domain/tempo.test.ts`
Expected: FAIL — `Failed to resolve import "./relatorio.js"` e `mesAnterior is not a function` (ou erro de export inexistente).

- [ ] **Step 5: Implementar `mesAnterior`**

Acrescentar ao fim de `backend/src/domain/tempo.ts`:

```ts
/** "YYYY-MM" do mês anterior. */
export function mesAnterior(mes: string): string {
  const m = RE_MES.exec(mes);
  const numeroMes = m ? Number(m[2]) : 0;
  if (!m || numeroMes < 1 || numeroMes > 12) throw new Error(`mês inválido: ${mes}`);
  const d = new Date(Date.UTC(Number(m[1]), numeroMes - 2, 1));
  return `${String(d.getUTCFullYear()).padStart(4, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
```

- [ ] **Step 6: Implementar `montarRelatorioMes`**

Criar `backend/src/domain/relatorio.ts`:

```ts
import { arredondar } from './nutricao.js';
import { dataLocal } from './tempo.js';
import type { Refeicao, Registro } from './tipos.js';

export interface RelatorioRefeicao {
  refeicao_id: string;
  refeicao_nome: string;
  media_calorias: number;
  variacao_percentual: number | null;
}

export interface RelatorioDiaRefeicao {
  refeicao_id: string;
  refeicao_nome: string;
  calorias: number;
  descricao: string;
}

export interface RelatorioDia {
  data: string;
  calorias: number;
  refeicoes: RelatorioDiaRefeicao[];
}

/** Corpo de `GET /api/resumo/mes` sem o campo `mes`, que a rota acrescenta. */
export interface RelatorioMes {
  media_calorias: number;
  por_refeicao: RelatorioRefeicao[];
  dias: RelatorioDia[];
}

function porDiaLocal(registros: Registro[], timezone: string): Map<string, Registro[]> {
  const dias = new Map<string, Registro[]>();
  for (const r of registros) {
    const data = dataLocal(new Date(r.criado_em), timezone);
    const doDia = dias.get(data);
    if (doDia) doDia.push(r);
    else dias.set(data, [r]);
  }
  return dias;
}

function kcalPorRefeicao(registros: Registro[]): Map<string, number> {
  const totais = new Map<string, number>();
  for (const r of registros) {
    totais.set(r.refeicao_id, (totais.get(r.refeicao_id) ?? 0) + r.calorias_total);
  }
  return totais;
}

function somaKcal(registros: Registro[]): number {
  return registros.reduce((s, r) => s + r.calorias_total, 0);
}

/**
 * Relatório de um mês. As médias dividem pelos dias com pelo menos um registro — um dia
 * em branco é dia não anotado, não dia de jejum, e puxaria a média para baixo à toa.
 */
export function montarRelatorioMes(
  registrosMes: Registro[],
  registrosMesAnterior: Registro[],
  refeicoes: Refeicao[],
  timezone: string,
): RelatorioMes {
  const ordenadas = [...refeicoes].sort((a, b) => a.inicio.localeCompare(b.inicio));
  const posicao = new Map(ordenadas.map((r, i) => [r.id, i]));

  const dias = porDiaLocal(registrosMes, timezone);
  const quantidadeDias = dias.size;
  const quantidadeDiasAnterior = porDiaLocal(registrosMesAnterior, timezone).size;
  const atual = kcalPorRefeicao(registrosMes);
  const anterior = kcalPorRefeicao(registrosMesAnterior);

  const media_calorias =
    quantidadeDias > 0 ? Math.round(somaKcal(registrosMes) / quantidadeDias) : 0;

  const por_refeicao = ordenadas
    .filter((r) => (atual.get(r.id) ?? 0) > 0)
    .map((r) => {
      const media = (atual.get(r.id) ?? 0) / quantidadeDias;
      const mediaAnterior =
        quantidadeDiasAnterior > 0 ? (anterior.get(r.id) ?? 0) / quantidadeDiasAnterior : 0;
      return {
        refeicao_id: r.id,
        refeicao_nome: r.nome,
        media_calorias: Math.round(media),
        variacao_percentual:
          mediaAnterior > 0 ? arredondar(((media - mediaAnterior) / mediaAnterior) * 100) : null,
      };
    })
    .sort(
      (a, b) =>
        b.media_calorias - a.media_calorias ||
        (posicao.get(a.refeicao_id) ?? 0) - (posicao.get(b.refeicao_id) ?? 0),
    );

  const listaDias = [...dias.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([data, doDia]) => ({
      data,
      calorias: arredondar(somaKcal(doDia)),
      refeicoes: ordenadas
        .map((refeicao) => ({ refeicao, registros: doDia.filter((r) => r.refeicao_id === refeicao.id) }))
        .filter(({ registros }) => registros.length > 0)
        .map(({ refeicao, registros }) => ({
          refeicao_id: refeicao.id,
          refeicao_nome: refeicao.nome,
          calorias: arredondar(somaKcal(registros)),
          descricao: registros
            .flatMap((r) => r.alimentos_detectados.map((a) => a.nome.trim()))
            .filter((nome) => nome.length > 0)
            .join(', '),
        })),
    }));

  return { media_calorias, por_refeicao, dias: listaDias };
}
```

- [ ] **Step 7: Rodar os testes e ver passar**

Run (em `backend/`): `npm test -- src/domain/relatorio.test.ts src/domain/tempo.test.ts`
Expected: PASS (todos os casos de `montarRelatorioMes` e `mesAnterior`).

- [ ] **Step 8: Typecheck do backend**

Run (em `backend/`): `npm run typecheck`
Expected: sai com código 0, sem erros.

- [ ] **Step 9: Commit**

```bash
git add docs/api-contract.md backend/src/domain/tempo.ts backend/src/domain/tempo.test.ts backend/src/domain/relatorio.ts backend/src/domain/relatorio.test.ts
git commit -m "Relatório mensal: contrato de GET /api/resumo/mes e cálculo das médias por refeição"
```

---

### Task 2: Rota `GET /api/resumo/mes`

**Files:**
- Modify: `backend/src/routes/resumo.ts` (imports no topo; nova rota ao fim do arquivo)

**Interfaces:**
- Consumes: `montarRelatorioMes` (Task 1); `mesAnterior`, `mesLocal`, `intervaloDoMes` de `domain/tempo.ts`; `listarNoIntervalo(userId, inicio, fim)` de `repos/registros.ts`; `listarRefeicoes(userId)` de `repos/refeicoes.ts`; `perfilDe(req)` de `middleware/autenticar.ts`.
- Produces: `GET /api/resumo/mes?mes=YYYY-MM` → `200 { mes: string } & RelatorioMes`, `400 VALIDACAO`.

- [ ] **Step 1: Trocar os imports do topo de `backend/src/routes/resumo.ts`**

Substituir as linhas 1–8 por:

```ts
import { Router } from 'express';
import { z } from 'zod';
import { arredondar, metrica } from '../domain/nutricao.js';
import { montarRelatorioMes } from '../domain/relatorio.js';
import {
  dataLocal,
  intervaloDoDia,
  intervaloDoMes,
  mesAnterior,
  mesLocal,
  somarDias,
} from '../domain/tempo.js';
import { perfilDe } from '../middleware/autenticar.js';
import { totalAguaNoIntervalo } from '../repos/agua.js';
import { listarNoIntervalo } from '../repos/registros.js';
import { listarRefeicoes } from '../repos/refeicoes.js';
```

- [ ] **Step 2: Acrescentar o schema e a rota ao fim do arquivo**

```ts
const mesOpcional = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'mês deve estar no formato YYYY-MM')
  .optional();

rotasResumo.get('/mes', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const { mes } = z.object({ mes: mesOpcional }).parse(req.query);
    const alvo = mes ?? mesLocal(new Date(), perfil.timezone);
    const atual = intervaloDoMes(alvo, perfil.timezone);
    const anterior = intervaloDoMes(mesAnterior(alvo), perfil.timezone);

    const [registrosMes, registrosAnterior, refeicoes] = await Promise.all([
      listarNoIntervalo(perfil.id, atual.inicio, atual.fim),
      listarNoIntervalo(perfil.id, anterior.inicio, anterior.fim),
      listarRefeicoes(perfil.id),
    ]);

    res.json({
      mes: alvo,
      ...montarRelatorioMes(registrosMes, registrosAnterior, refeicoes, perfil.timezone),
    });
  } catch (e) {
    next(e);
  }
});
```

- [ ] **Step 3: Rodar testes, typecheck e build do backend**

Run (em `backend/`): `npm test && npm run typecheck && npm run build`
Expected: todos os testes PASS; typecheck e build saem com código 0.

- [ ] **Step 4: Conferir a rota contra o banco local (manual)**

Com o Postgres de dev de pé (`docker compose up -d db` na raiz, `npm run migrate` e `npm run dev` em `backend/`), faça login e chame:

```bash
TOKEN=$(curl -s -X POST localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"<seu e-mail>","senha":"<sua senha>"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')
curl -s "localhost:3000/api/resumo/mes?mes=2026-09" -H "Authorization: Bearer $TOKEN"
curl -s -o /dev/null -w '%{http_code}\n' "localhost:3000/api/resumo/mes?mes=2026-9" -H "Authorization: Bearer $TOKEN"
```

Expected: o primeiro devolve JSON com `mes: "2026-09"`, `media_calorias`, `por_refeicao`, `dias`; o segundo imprime `400`. (Se a porta do backend no `.env` for outra, troque `3000`.)

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/resumo.ts
git commit -m "Adiciona GET /api/resumo/mes"
```

---

### Task 3: Tipos, cliente da API e funções puras do relatório (TDD)

**Files:**
- Modify: `frontend/src/lib/types.ts` (acrescentar ao fim)
- Modify: `frontend/src/lib/api.ts` (import de tipos + método novo no objeto `api`)
- Create: `frontend/src/lib/relatorio.ts`
- Test: `frontend/src/lib/relatorio.test.ts`

**Interfaces:**
- Consumes: contrato da Task 1; tipos existentes `ResumoDia`, `GrupoRefeicao`, `StatusDia` (`lib/types.ts`).
- Produces:
  ```ts
  // types.ts
  export interface RelatorioRefeicao { refeicao_id: string; refeicao_nome: string; media_calorias: number; variacao_percentual: number | null }
  export interface RelatorioDiaRefeicao { refeicao_id: string; refeicao_nome: string; calorias: number; descricao: string }
  export interface RelatorioDia { data: string; calorias: number; refeicoes: RelatorioDiaRefeicao[] }
  export interface RelatorioMes { mes: string; media_calorias: number; por_refeicao: RelatorioRefeicao[]; dias: RelatorioDia[] }
  // api.ts
  api.resumoMes(mes?: string): Promise<RelatorioMes>
  // relatorio.ts — visão mensal
  export interface LinhaVariacao { sentido: 'menos' | 'mais'; texto: string }
  export interface OpcaoFiltro { id: string | null; rotulo: string }
  export function preposicao(nome: string): 'no' | 'na';
  export function linhasDeVariacao(porRefeicao: RelatorioRefeicao[], nomeMesAnterior: string): LinhaVariacao[];
  export function opcoesDeFiltro(relatorio: RelatorioMes): OpcaoFiltro[];
  export function proximoFiltro(opcoes: OpcaoFiltro[], atual: string | null): string | null;
  export function diasFiltrados(dias: RelatorioDia[], filtro: string | null): RelatorioDia[];
  export function kcal(valor: number): string;        // 1890 → "1 890" (espaço não separável)
  export function diaCurto(data: string): string;     // "2026-09-13" → "13 SET"
  // relatorio.ts — navegação e visão do dia (D15)
  export type VisaoRelatorio = { tipo: 'mes'; mes: string } | { tipo: 'dia'; data: string };
  export function visaoDosParametros(params: URLSearchParams, hoje: string): VisaoRelatorio;
  export function deslocarDia(data: string, delta: number): string;   // "2026-09-01", -1 → "2026-08-31"
  export function podeAvancarMes(mes: string, hoje: string): boolean;
  export function podeAvancarDia(data: string, hoje: string): boolean;
  export function statusDoDia(calorias: number, meta: number, quantidadeRegistros: number): StatusDia;
  export interface ItemBarra { refeicao_id: string; refeicao_nome: string; calorias: number }
  export function barrasDoMes(porRefeicao: RelatorioRefeicao[]): ItemBarra[];
  export function barrasDoDia(refeicoes: ResumoDia['refeicoes']): ItemBarra[];
  export function descricaoDoGrupo(grupo: GrupoRefeicao): string;
  ```

`statusDoDia` espelha `backend/src/domain/social.ts` (regra "Status do dia" do contrato): sem registro ou meta ≤ 0 → `sem_registro`; percentual **arredondado a 1 casa** antes de comparar; `< 90` → `abaixo`, `> 110` → `acima`, senão `na_meta`. Mesma regra dos dois lados para o relatório do dia bater com a cor do calendário.

- [ ] **Step 1: Acrescentar os tipos ao fim de `frontend/src/lib/types.ts`**

```ts
/* ---- relatório mensal ---- */

export interface RelatorioRefeicao {
  refeicao_id: string;
  refeicao_nome: string;
  media_calorias: number;
  /** vs mês anterior, 1 casa; `null` quando o mês anterior não tinha essa refeição. */
  variacao_percentual: number | null;
}

export interface RelatorioDiaRefeicao {
  refeicao_id: string;
  refeicao_nome: string;
  calorias: number;
  descricao: string;
}

export interface RelatorioDia {
  data: string;
  calorias: number;
  refeicoes: RelatorioDiaRefeicao[];
}

export interface RelatorioMes {
  mes: string;
  media_calorias: number;
  por_refeicao: RelatorioRefeicao[];
  dias: RelatorioDia[];
}
```

- [ ] **Step 2: Acrescentar o método em `frontend/src/lib/api.ts`**

Adicionar `RelatorioMes,` à lista do `import type { ... } from './types';` (em ordem alfabética, logo antes de `ResumoDia,`) e, dentro do objeto `api`, logo depois de `resumoSemana`:

```ts
  resumoMes: (mes?: string) =>
    requisitar<RelatorioMes>(`/resumo/mes${mes === undefined ? '' : `?mes=${encodeURIComponent(mes)}`}`),
```

- [ ] **Step 3: Escrever os testes falhos**

Criar `frontend/src/lib/relatorio.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  barrasDoDia,
  barrasDoMes,
  deslocarDia,
  descricaoDoGrupo,
  diaCurto,
  diasFiltrados,
  kcal,
  linhasDeVariacao,
  opcoesDeFiltro,
  podeAvancarDia,
  podeAvancarMes,
  preposicao,
  proximoFiltro,
  statusDoDia,
  visaoDosParametros,
} from './relatorio';
import type { GrupoRefeicao, Registro, RelatorioMes, RelatorioRefeicao } from './types';

function refeicao(id: string, nome: string, media: number, variacao: number | null): RelatorioRefeicao {
  return { refeicao_id: id, refeicao_nome: nome, media_calorias: media, variacao_percentual: variacao };
}

const RELATORIO: RelatorioMes = {
  mes: '2026-09',
  media_calorias: 1890,
  por_refeicao: [refeicao('almoco', 'Almoço', 712, 3), refeicao('janta', 'Janta', 534, 21.4)],
  dias: [
    {
      data: '2026-09-14',
      calorias: 1030,
      refeicoes: [
        { refeicao_id: 'almoco', refeicao_nome: 'Almoço', calorias: 612, descricao: 'arroz, feijão' },
        { refeicao_id: 'lanche', refeicao_nome: 'Lanche', calorias: 0, descricao: 'chá' },
        { refeicao_id: 'janta', refeicao_nome: 'Janta', calorias: 418, descricao: 'sopa' },
      ],
    },
    {
      data: '2026-09-13',
      calorias: 900,
      refeicoes: [{ refeicao_id: 'janta', refeicao_nome: 'Janta', calorias: 900, descricao: 'pizza' }],
    },
  ],
};

describe('preposicao', () => {
  it('usa "na" para nomes terminados em a e "no" nos demais', () => {
    expect(preposicao('janta')).toBe('na');
    expect(preposicao('Ceia')).toBe('na');
    expect(preposicao('lanche')).toBe('no');
    expect(preposicao('almoço')).toBe('no');
    expect(preposicao('café da manhã')).toBe('no');
  });
});

describe('linhasDeVariacao', () => {
  it('pega as 2 maiores variações absolutas, ignorando null e 0%', () => {
    const linhas = linhasDeVariacao(
      [
        refeicao('almoco', 'Almoço', 712, 3),
        refeicao('janta', 'Janta', 534, 21.4),
        refeicao('cafe', 'Café da manhã', 398, null),
        refeicao('lanche', 'Lanche', 246, -8.2),
        refeicao('ceia', 'Ceia', 100, 0.3),
      ],
      'agosto',
    );
    expect(linhas).toEqual([
      { sentido: 'mais', texto: '↑ 21% mais na janta que em agosto' },
      { sentido: 'menos', texto: '↓ 8% menos no lanche que em agosto' },
    ]);
  });

  it('devolve lista vazia sem comparação possível', () => {
    expect(linhasDeVariacao([refeicao('almoco', 'Almoço', 712, null)], 'agosto')).toEqual([]);
  });
});

describe('filtro', () => {
  it('opções: todas + refeições dos dias, na ordem de por_refeicao e depois as demais', () => {
    expect(opcoesDeFiltro(RELATORIO)).toEqual([
      { id: null, rotulo: 'todas as refeições' },
      { id: 'almoco', rotulo: 'só almoço' },
      { id: 'janta', rotulo: 'só janta' },
      { id: 'lanche', rotulo: 'só lanche' },
    ]);
  });

  it('proximoFiltro cicla e volta para todas', () => {
    const opcoes = opcoesDeFiltro(RELATORIO);
    expect(proximoFiltro(opcoes, null)).toBe('almoco');
    expect(proximoFiltro(opcoes, 'janta')).toBe('lanche');
    expect(proximoFiltro(opcoes, 'lanche')).toBeNull();
    expect(proximoFiltro(opcoes, 'sumiu')).toBeNull();
  });

  it('diasFiltrados mantém só a refeição escolhida, recalcula o total e tira dias vazios', () => {
    expect(diasFiltrados(RELATORIO.dias, null)).toBe(RELATORIO.dias);
    expect(diasFiltrados(RELATORIO.dias, 'almoco')).toEqual([
      {
        data: '2026-09-14',
        calorias: 612,
        refeicoes: [{ refeicao_id: 'almoco', refeicao_nome: 'Almoço', calorias: 612, descricao: 'arroz, feijão' }],
      },
    ]);
  });
});

describe('formatação', () => {
  it('kcal arredonda e separa milhar com espaço não separável', () => {
    expect(kcal(1890.4)).toBe('1 890');
    expect(kcal(712)).toBe('712');
    expect(kcal(12041)).toBe('12 041');
  });

  it('diaCurto usa dia e mês abreviado em maiúsculas', () => {
    expect(diaCurto('2026-09-13')).toBe('13 SET');
    expect(diaCurto('2026-01-02')).toBe('2 JAN');
  });
});

describe('visaoDosParametros', () => {
  const HOJE = '2026-09-16';
  const p = (query: string) => new URLSearchParams(query);

  it('sem parâmetro abre o mês atual', () => {
    expect(visaoDosParametros(p(''), HOJE)).toEqual({ tipo: 'mes', mes: '2026-09' });
  });

  it('data válida abre a visão do dia e ganha de mes', () => {
    expect(visaoDosParametros(p('data=2026-09-13'), HOJE)).toEqual({ tipo: 'dia', data: '2026-09-13' });
    expect(visaoDosParametros(p('data=2026-08-02&mes=2026-01'), HOJE)).toEqual({ tipo: 'dia', data: '2026-08-02' });
    expect(visaoDosParametros(p('data=2026-09-16'), HOJE)).toEqual({ tipo: 'dia', data: '2026-09-16' });
  });

  it('data inválida, inexistente ou futura cai no mês atual', () => {
    expect(visaoDosParametros(p('data=ontem'), HOJE)).toEqual({ tipo: 'mes', mes: '2026-09' });
    expect(visaoDosParametros(p('data=2026-02-30'), HOJE)).toEqual({ tipo: 'mes', mes: '2026-09' });
    expect(visaoDosParametros(p('data=2026-09-17'), HOJE)).toEqual({ tipo: 'mes', mes: '2026-09' });
  });

  it('mes válido é respeitado; futuro ou inválido vira o atual', () => {
    expect(visaoDosParametros(p('mes=2026-03'), HOJE)).toEqual({ tipo: 'mes', mes: '2026-03' });
    expect(visaoDosParametros(p('mes=2025-12'), HOJE)).toEqual({ tipo: 'mes', mes: '2025-12' });
    expect(visaoDosParametros(p('mes=2026-10'), HOJE)).toEqual({ tipo: 'mes', mes: '2026-09' });
    expect(visaoDosParametros(p('mes=2026-13'), HOJE)).toEqual({ tipo: 'mes', mes: '2026-09' });
  });
});

describe('navegação', () => {
  it('deslocarDia atravessa mês, ano e fevereiro bissexto', () => {
    expect(deslocarDia('2026-09-01', -1)).toBe('2026-08-31');
    expect(deslocarDia('2025-12-31', 1)).toBe('2026-01-01');
    expect(deslocarDia('2024-02-28', 1)).toBe('2024-02-29');
    expect(deslocarDia('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('só avança até o mês/dia de hoje', () => {
    const HOJE = '2026-09-16';
    expect(podeAvancarMes('2026-08', HOJE)).toBe(true);
    expect(podeAvancarMes('2026-09', HOJE)).toBe(false);
    expect(podeAvancarDia('2026-09-15', HOJE)).toBe(true);
    expect(podeAvancarDia('2026-09-16', HOJE)).toBe(false);
  });
});

describe('statusDoDia (mesma regra do backend)', () => {
  it('sem registro ou sem meta é sem_registro', () => {
    expect(statusDoDia(1000, 2000, 0)).toBe('sem_registro');
    expect(statusDoDia(1000, 0, 3)).toBe('sem_registro');
  });

  it('90% a 110% (arredondado a 1 casa) é na_meta', () => {
    expect(statusDoDia(1790, 2000, 2)).toBe('abaixo'); // 89,5%
    expect(statusDoDia(1800, 2000, 2)).toBe('na_meta'); // 90%
    expect(statusDoDia(2200, 2000, 2)).toBe('na_meta'); // 110%
    expect(statusDoDia(2210, 2000, 2)).toBe('acima'); // 110,5%
  });
});

describe('barras e descrição', () => {
  it('barrasDoMes usa a média de cada refeição', () => {
    expect(barrasDoMes(RELATORIO.por_refeicao)).toEqual([
      { refeicao_id: 'almoco', refeicao_nome: 'Almoço', calorias: 712 },
      { refeicao_id: 'janta', refeicao_nome: 'Janta', calorias: 534 },
    ]);
  });

  it('barrasDoDia tira refeições zeradas e mantém a ordem', () => {
    expect(
      barrasDoDia([
        { refeicao_id: 'cafe', refeicao_nome: 'Café da manhã', calorias: 418, quantidade_registros: 1 },
        { refeicao_id: 'almoco', refeicao_nome: 'Almoço', calorias: 0, quantidade_registros: 0 },
        { refeicao_id: 'janta', refeicao_nome: 'Janta', calorias: 612, quantidade_registros: 2 },
      ]),
    ).toEqual([
      { refeicao_id: 'cafe', refeicao_nome: 'Café da manhã', calorias: 418 },
      { refeicao_id: 'janta', refeicao_nome: 'Janta', calorias: 612 },
    ]);
  });

  it('descricaoDoGrupo junta os alimentos de todos os registros', () => {
    const alimento = (nome: string) => ({
      nome,
      quantidade_estimada: '1',
      calorias: 1,
      carboidrato_g: 0,
      proteina_g: 0,
      gordura_g: 0,
    });
    const registro = (nomes: string[]) => ({ alimentos_detectados: nomes.map(alimento) }) as unknown as Registro;
    const grupo: GrupoRefeicao = {
      refeicao_id: 'almoco',
      refeicao_nome: 'Almoço',
      calorias: 612,
      registros: [registro(['arroz', 'feijão']), registro(['frango'])],
    };
    expect(descricaoDoGrupo(grupo)).toBe('arroz, feijão, frango');
    expect(descricaoDoGrupo({ ...grupo, registros: [] })).toBe('');
  });
});
```

- [ ] **Step 4: Rodar e ver falhar**

Run (em `frontend/`): `npm test -- src/lib/relatorio.test.ts`
Expected: FAIL — `Failed to resolve import "./relatorio"`.

- [ ] **Step 5: Implementar `frontend/src/lib/relatorio.ts`**

```ts
import type {
  GrupoRefeicao,
  RelatorioDia,
  RelatorioMes,
  RelatorioRefeicao,
  ResumoDia,
  StatusDia,
} from './types';

export interface LinhaVariacao {
  sentido: 'menos' | 'mais';
  texto: string;
}

export interface OpcaoFiltro {
  /** `null` = todas as refeições. */
  id: string | null;
  rotulo: string;
}

export type VisaoRelatorio = { tipo: 'mes'; mes: string } | { tipo: 'dia'; data: string };

export interface ItemBarra {
  refeicao_id: string;
  refeicao_nome: string;
  calorias: number;
}

const MESES_CURTOS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const RE_MES = /^\d{4}-(0[1-9]|1[0-2])$/;
const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;
const TOLERANCIA_PERCENTUAL = 10;

/** Refeições são nomes livres: "na janta", "no lanche". Heurística pela última letra. */
export function preposicao(nome: string): 'no' | 'na' {
  return nome.trim().toLowerCase().endsWith('a') ? 'na' : 'no';
}

export function linhasDeVariacao(
  porRefeicao: RelatorioRefeicao[],
  nomeMesAnterior: string,
): LinhaVariacao[] {
  return porRefeicao
    .filter((r): r is RelatorioRefeicao & { variacao_percentual: number } =>
      r.variacao_percentual !== null && Math.round(Math.abs(r.variacao_percentual)) > 0,
    )
    .sort((a, b) => Math.abs(b.variacao_percentual) - Math.abs(a.variacao_percentual))
    .slice(0, 2)
    .map((r) => {
      const nome = r.refeicao_nome.toLowerCase();
      const pct = Math.round(Math.abs(r.variacao_percentual));
      return r.variacao_percentual < 0
        ? { sentido: 'menos', texto: `↓ ${pct}% menos ${preposicao(nome)} ${nome} que em ${nomeMesAnterior}` }
        : { sentido: 'mais', texto: `↑ ${pct}% mais ${preposicao(nome)} ${nome} que em ${nomeMesAnterior}` };
    });
}

export function opcoesDeFiltro(relatorio: RelatorioMes): OpcaoFiltro[] {
  const nomes = new Map<string, string>();
  for (const dia of relatorio.dias) {
    for (const r of dia.refeicoes) nomes.set(r.refeicao_id, r.refeicao_nome);
  }
  const ordem = relatorio.por_refeicao.map((r) => r.refeicao_id);
  const posicao = (id: string) => {
    const i = ordem.indexOf(id);
    return i === -1 ? ordem.length : i;
  };
  const ids = [...nomes.keys()].sort((a, b) => posicao(a) - posicao(b));
  return [
    { id: null, rotulo: 'todas as refeições' },
    ...ids.map((id) => ({ id, rotulo: `só ${(nomes.get(id) ?? '').toLowerCase()}` })),
  ];
}

export function proximoFiltro(opcoes: OpcaoFiltro[], atual: string | null): string | null {
  const indice = opcoes.findIndex((o) => o.id === atual);
  if (indice === -1) return null;
  return opcoes[(indice + 1) % opcoes.length]?.id ?? null;
}

export function diasFiltrados(dias: RelatorioDia[], filtro: string | null): RelatorioDia[] {
  if (filtro === null) return dias;
  return dias
    .map((dia) => {
      const refeicoes = dia.refeicoes.filter((r) => r.refeicao_id === filtro);
      const calorias = Math.round(refeicoes.reduce((s, r) => s + r.calorias, 0) * 10) / 10;
      return { ...dia, calorias, refeicoes };
    })
    .filter((dia) => dia.refeicoes.length > 0);
}

export function kcal(valor: number): string {
  return String(Math.round(valor)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function diaCurto(data: string): string {
  const [, mes, dia] = data.split('-').map(Number);
  return `${dia ?? ''} ${MESES_CURTOS[(mes ?? 1) - 1] ?? ''}`;
}

/** Datas como dia do calendário, sem fuso: tudo em UTC para não escorregar um dia. */
function dataUtc(data: string): Date | null {
  if (!RE_DATA.test(data)) return null;
  const [ano, mes, dia] = data.split('-').map(Number);
  const d = new Date(Date.UTC(ano ?? 0, (mes ?? 1) - 1, dia ?? 1));
  return d.toISOString().slice(0, 10) === data ? d : null;
}

export function visaoDosParametros(params: URLSearchParams, hoje: string): VisaoRelatorio {
  const mesAtual = hoje.slice(0, 7);
  const data = params.get('data');
  if (data !== null && dataUtc(data) !== null && data <= hoje) return { tipo: 'dia', data };
  const mes = params.get('mes');
  if (mes !== null && RE_MES.test(mes) && mes <= mesAtual) return { tipo: 'mes', mes };
  return { tipo: 'mes', mes: mesAtual };
}

export function deslocarDia(data: string, delta: number): string {
  const d = dataUtc(data);
  if (d === null) return data;
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function podeAvancarMes(mes: string, hoje: string): boolean {
  return mes < hoje.slice(0, 7);
}

export function podeAvancarDia(data: string, hoje: string): boolean {
  return data < hoje;
}

/** Espelho de `statusDoDia` do backend (`domain/social.ts`) — manter as duas iguais. */
export function statusDoDia(calorias: number, meta: number, quantidadeRegistros: number): StatusDia {
  if (quantidadeRegistros <= 0 || meta <= 0) return 'sem_registro';
  const percentual = Math.round((calorias / meta) * 100 * 10) / 10;
  if (percentual < 100 - TOLERANCIA_PERCENTUAL) return 'abaixo';
  if (percentual > 100 + TOLERANCIA_PERCENTUAL) return 'acima';
  return 'na_meta';
}

export function barrasDoMes(porRefeicao: RelatorioRefeicao[]): ItemBarra[] {
  return porRefeicao.map((r) => ({
    refeicao_id: r.refeicao_id,
    refeicao_nome: r.refeicao_nome,
    calorias: r.media_calorias,
  }));
}

export function barrasDoDia(refeicoes: ResumoDia['refeicoes']): ItemBarra[] {
  return refeicoes
    .filter((r) => r.calorias > 0)
    .map((r) => ({ refeicao_id: r.refeicao_id, refeicao_nome: r.refeicao_nome, calorias: r.calorias }));
}

export function descricaoDoGrupo(grupo: GrupoRefeicao): string {
  return grupo.registros.flatMap((r) => r.alimentos_detectados.map((a) => a.nome)).join(', ');
}
```

- [ ] **Step 6: Rodar e ver passar**

Run (em `frontend/`): `npm test -- src/lib/relatorio.test.ts`
Expected: PASS.

- [ ] **Step 7: Typecheck**

Run (em `frontend/`): `npm run typecheck`
Expected: código 0.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/lib/types.ts frontend/src/lib/api.ts frontend/src/lib/relatorio.ts frontend/src/lib/relatorio.test.ts
git commit -m "Frontend: tipos, cliente e funções puras do relatório (mês e dia)"
```

---

### Task 4: Peças do relatório e visão do mês com setas

**Files:**
- Create: `frontend/src/components/relatorio/estilos.ts`
- Create: `frontend/src/components/relatorio/CabecalhoNavegavel.tsx`
- Create: `frontend/src/components/relatorio/BarrasPorRefeicao.tsx`
- Create: `frontend/src/components/relatorio/LinhaRefeicao.tsx`
- Create: `frontend/src/pages/relatorio/VisaoMes.tsx`
- Modify (substituir o conteúdo inteiro do stub do plano A): `frontend/src/pages/Relatorio.tsx`

**Interfaces:**
- Consumes: `api.resumoMes`, `mensagemDoErro` (`lib/api.ts`); funções da Task 3; `corDaRefeicao(refeicaoId, refeicoes)`, `mesLongo(mes)`, `deslocarMes(mes, delta)` (`lib/visual.ts`, plano A); `useRefeicoes()` → `{ refeicoes: Refeicao[] }` (`lib/RefeicoesContext.tsx`); `hojeISO()` (`lib/format.ts`); `theme.vars.palette.{text,neutro,pilula,primary,background,refeicao}` (plano A); `lucide-react` (`ChevronLeft`, `ChevronRight`, plano A instalou).
- Produces:
  ```ts
  // components/relatorio/estilos.ts
  export const FONTE: string;                          // "'Plus Jakarta Sans Variable', sans-serif"
  export const rotuloSecao: SxProps<Theme>;
  export const botaoFiltro: SxProps<Theme>;
  export const botaoSecundario: SxProps<Theme>;
  // components/relatorio/CabecalhoNavegavel.tsx
  export default function CabecalhoNavegavel(props: {
    titulo: string; rotuloAnterior: string; rotuloProximo: string;
    aoAnterior: () => void; aoProximo: () => void; podeAvancar: boolean; lateral?: ReactNode;
  }): JSX.Element;
  // components/relatorio/BarrasPorRefeicao.tsx
  export default function BarrasPorRefeicao(props: { itens: ItemBarra[]; rotuloAria: (item: ItemBarra) => string }): JSX.Element;
  // components/relatorio/LinhaRefeicao.tsx
  export default function LinhaRefeicao(props: { refeicaoId: string; nome: string; descricao: string; calorias: number }): JSX.Element;
  // pages/relatorio/VisaoMes.tsx
  export default function VisaoMes(props: { mes: string; hoje: string; aoTrocarMes: (mes: string) => void }): JSX.Element;
  // pages/Relatorio.tsx
  export default function Relatorio(): JSX.Element;   // a rota /relatorio do plano A importa este default
  ```
  A Task 5 cria `pages/relatorio/VisaoDia.tsx`; até lá `Relatorio.tsx` desta task trata `?data=` como mês (a Step 6 marca o ponto que a Task 5 troca).

- [ ] **Step 1: Confirmar que a rota aponta para o arquivo**

Run (na raiz): `git grep -n "Relatorio" frontend/src`
Expected: `frontend/src/App.tsx` (ou o arquivo de rotas do plano A) importa `./pages/Relatorio` e o registra em `path="relatorio"`/`"/relatorio"` dentro da `Casca`. Se não importar, adicione a rota filha `<Route path="/relatorio" element={<Relatorio />} />` junto das outras rotas com tab bar, conforme a tabela de rotas da spec.

- [ ] **Step 2: Estilos compartilhados**

Criar `frontend/src/components/relatorio/estilos.ts`:

```ts
import type { SxProps, Theme } from '@mui/material';

export const FONTE = "'Plus Jakarta Sans Variable', sans-serif";

export const rotuloSecao: SxProps<Theme> = {
  font: `600 9.5px/1 ${FONTE}`,
  letterSpacing: '.16em',
  textTransform: 'uppercase',
  color: 'text.secondary',
};

export const botaoFiltro: SxProps<Theme> = (theme) => ({
  minHeight: 34,
  px: '13px',
  borderRadius: '9px',
  font: `600 11.5px ${FONTE}`,
  bgcolor: theme.vars.palette.text.primary,
  color: theme.vars.palette.background.default,
});

export const botaoSecundario: SxProps<Theme> = (theme) => ({
  minHeight: 34,
  px: '13px',
  borderRadius: '9px',
  font: `500 11.5px ${FONTE}`,
  color: theme.vars.palette.text.secondary,
  bgcolor: theme.vars.palette.background.default,
  border: `1.4px solid ${theme.vars.palette.neutro.borda}`,
  ...theme.applyStyles('dark', {
    bgcolor: theme.vars.palette.neutro.cartao,
    borderWidth: '1px',
  }),
});
```

- [ ] **Step 3: Cabeçalho com setas**

Criar `frontend/src/components/relatorio/CabecalhoNavegavel.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FONTE } from './estilos';

interface Props {
  titulo: string;
  rotuloAnterior: string;
  rotuloProximo: string;
  aoAnterior: () => void;
  aoProximo: () => void;
  podeAvancar: boolean;
  lateral?: ReactNode;
}

const seta = {
  width: 32,
  height: 32,
  color: 'text.secondary',
  '&.Mui-disabled': { color: 'neutro.fraco' },
} as const;

export default function CabecalhoNavegavel({
  titulo,
  rotuloAnterior,
  rotuloProximo,
  aoAnterior,
  aoProximo,
  podeAvancar,
  lateral,
}: Props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px', minWidth: 0 }}>
        <IconButton aria-label={rotuloAnterior} onClick={aoAnterior} sx={{ ...seta, ml: '-8px' }}>
          <ChevronLeft size={20} strokeWidth={2} />
        </IconButton>
        <Typography
          component="h1"
          aria-live="polite"
          noWrap
          sx={{ m: 0, font: `700 22px/1 ${FONTE}`, letterSpacing: '-.02em' }}
        >
          {titulo}
        </Typography>
        <IconButton aria-label={rotuloProximo} onClick={aoProximo} disabled={!podeAvancar} sx={seta}>
          <ChevronRight size={20} strokeWidth={2} />
        </IconButton>
      </Box>
      {lateral}
    </Box>
  );
}
```

- [ ] **Step 4: Barras por refeição**

Criar `frontend/src/components/relatorio/BarrasPorRefeicao.tsx`:

```tsx
import { Box, Typography, useTheme } from '@mui/material';
import { motion, useReducedMotion } from 'motion/react';
import { useRefeicoes } from '../../lib/RefeicoesContext';
import { kcal, type ItemBarra } from '../../lib/relatorio';
import { corDaRefeicao } from '../../lib/visual';
import { FONTE } from './estilos';

const ALTURA_MAX_BARRA = 96;

interface Props {
  itens: ItemBarra[];
  rotuloAria: (item: ItemBarra) => string;
}

export default function BarrasPorRefeicao({ itens, rotuloAria }: Props) {
  const theme = useTheme();
  const reduzirMovimento = useReducedMotion();
  const { refeicoes } = useRefeicoes();
  const maior = Math.max(1, ...itens.map((i) => i.calorias));

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: 130 }}>
      {itens.map((item, indice) => {
        const altura = Math.max(4, Math.round((item.calorias / maior) * ALTURA_MAX_BARRA));
        const cor = theme.vars.palette.refeicao[corDaRefeicao(item.refeicao_id, refeicoes)];
        return (
          <Box
            key={item.refeicao_id}
            sx={{
              flex: 1,
              minWidth: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '7px',
            }}
          >
            <Typography sx={{ font: `700 13px/1 ${FONTE}`, fontVariantNumeric: 'tabular-nums' }}>
              {kcal(item.calorias)}
            </Typography>
            <motion.div
              role="img"
              aria-label={rotuloAria(item)}
              initial={{ height: reduzirMovimento ? altura : 0 }}
              animate={{ height: altura }}
              transition={
                reduzirMovimento
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 170, damping: 22, delay: indice * 0.06 }
              }
              style={{ width: '100%', background: cor, borderRadius: '7px 7px 0 0' }}
            />
            <Typography
              noWrap
              sx={{
                maxWidth: '100%',
                font: `500 10px/1 ${FONTE}`,
                color: 'text.secondary',
                textTransform: 'lowercase',
              }}
            >
              {item.refeicao_nome}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
```

As barras recebem `key` pelo id da refeição dentro de um componente que a visão remonta a cada mês/dia (a `key` fica na Step 6), então a animação de crescer toca de novo a cada seta.

- [ ] **Step 5: Linha de refeição**

Criar `frontend/src/components/relatorio/LinhaRefeicao.tsx`:

```tsx
import { Box, Typography } from '@mui/material';
import { useRefeicoes } from '../../lib/RefeicoesContext';
import { kcal } from '../../lib/relatorio';
import { corDaRefeicao } from '../../lib/visual';
import { FONTE } from './estilos';

interface Props {
  refeicaoId: string;
  nome: string;
  descricao: string;
  calorias: number;
}

export default function LinhaRefeicao({ refeicaoId, nome, descricao, calorias }: Props) {
  const { refeicoes } = useRefeicoes();
  return (
    <Box
      sx={(t) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '11px',
        py: '10px',
        borderTop: `1px solid ${t.vars.palette.neutro.linha}`,
      })}
    >
      <Box
        aria-hidden="true"
        sx={(t) => ({
          width: 6,
          height: 28,
          borderRadius: '3px',
          flex: 'none',
          bgcolor: t.vars.palette.refeicao[corDaRefeicao(refeicaoId, refeicoes)],
        })}
      />
      <Typography sx={{ flex: 1, minWidth: 0, font: `600 13.5px ${FONTE}` }}>
        {nome.toLowerCase()}
        {descricao.length > 0 && (
          <Box component="span" sx={{ fontWeight: 400, color: 'text.secondary' }}>
            {' · '}
            {descricao}
          </Box>
        )}
      </Typography>
      <Typography sx={{ font: `700 14px/1 ${FONTE}`, fontVariantNumeric: 'tabular-nums' }}>
        {kcal(calorias)}
      </Typography>
    </Box>
  );
}
```

- [ ] **Step 6: Visão do mês**

Criar `frontend/src/pages/relatorio/VisaoMes.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, ButtonBase, Typography } from '@mui/material';
import { api, mensagemDoErro } from '../../lib/api';
import {
  barrasDoMes,
  diaCurto,
  diasFiltrados,
  kcal,
  linhasDeVariacao,
  opcoesDeFiltro,
  podeAvancarMes,
  proximoFiltro,
} from '../../lib/relatorio';
import type { RelatorioMes } from '../../lib/types';
import { deslocarMes, mesLongo } from '../../lib/visual';
import BarrasPorRefeicao from '../../components/relatorio/BarrasPorRefeicao';
import CabecalhoNavegavel from '../../components/relatorio/CabecalhoNavegavel';
import LinhaRefeicao from '../../components/relatorio/LinhaRefeicao';
import { FONTE, botaoFiltro, botaoSecundario, rotuloSecao } from '../../components/relatorio/estilos';

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'erro'; mensagem: string }
  | { tipo: 'pronto'; dados: RelatorioMes };

interface Props {
  mes: string;
  hoje: string;
  aoTrocarMes: (mes: string) => void;
}

export default function VisaoMes({ mes, hoje, aoTrocarMes }: Props) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setEstado({ tipo: 'carregando' });
    api
      .resumoMes(mes)
      .then((dados) => {
        if (!cancelado) setEstado({ tipo: 'pronto', dados });
      })
      .catch((falha: unknown) => {
        if (!cancelado) setEstado({ tipo: 'erro', mensagem: mensagemDoErro(falha) });
      });
    return () => {
      cancelado = true;
    };
  }, [mes, tentativa]);

  const temDados = estado.tipo === 'pronto' && estado.dados.dias.length > 0;

  return (
    <>
      <CabecalhoNavegavel
        titulo={mesLongo(mes)}
        rotuloAnterior="mês anterior"
        rotuloProximo="próximo mês"
        aoAnterior={() => aoTrocarMes(deslocarMes(mes, -1))}
        aoProximo={() => aoTrocarMes(deslocarMes(mes, 1))}
        podeAvancar={podeAvancarMes(mes, hoje)}
        lateral={
          temDados && estado.tipo === 'pronto' ? (
            <Typography sx={{ font: `500 12.5px ${FONTE}`, color: 'text.secondary', flex: 'none' }}>
              média {kcal(estado.dados.media_calorias)} kcal
            </Typography>
          ) : undefined
        }
      />

      {estado.tipo === 'carregando' && (
        <Typography sx={{ color: 'text.secondary', fontSize: 13 }} role="status">
          carregando o mês...
        </Typography>
      )}

      {estado.tipo === 'erro' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
          <Typography sx={{ color: 'error.main', fontSize: 13 }} role="alert">
            {estado.mensagem}
          </Typography>
          <ButtonBase sx={botaoSecundario} onClick={() => setTentativa((n) => n + 1)}>
            tentar de novo
          </ButtonBase>
        </Box>
      )}

      {estado.tipo === 'pronto' && estado.dados.dias.length === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
          <Typography sx={{ font: `400 12.5px ${FONTE}`, color: 'text.secondary' }}>
            nada registrado em {mesLongo(mes)}.
          </Typography>
          <ButtonBase component={RouterLink} to={`/calendario?mes=${mes}`} sx={botaoSecundario}>
            ver calendário
          </ButtonBase>
        </Box>
      )}

      {estado.tipo === 'pronto' && estado.dados.dias.length > 0 && (
        <ConteudoMes key={estado.dados.mes} dados={estado.dados} />
      )}
    </>
  );
}

function ConteudoMes({ dados }: { dados: RelatorioMes }) {
  const [filtro, setFiltro] = useState<string | null>(null);

  const opcoes = useMemo(() => opcoesDeFiltro(dados), [dados]);
  const rotuloFiltro = opcoes.find((o) => o.id === filtro)?.rotulo ?? 'todas as refeições';
  const dias = useMemo(() => diasFiltrados(dados.dias, filtro), [dados, filtro]);
  const variacoes = linhasDeVariacao(dados.por_refeicao, mesLongo(deslocarMes(dados.mes, -1)));

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Typography component="h2" sx={rotuloSecao}>
          por refeição
        </Typography>

        <BarrasPorRefeicao
          itens={barrasDoMes(dados.por_refeicao)}
          rotuloAria={(item) => `${item.refeicao_nome}: média de ${kcal(item.calorias)} kcal`}
        />

        {variacoes.length > 0 && (
          <Box
            sx={(t) => ({
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              pt: '4px',
              borderTop: `1px solid ${t.vars.palette.neutro.linha}`,
            })}
          >
            {variacoes.map((linha) => (
              <Typography
                key={linha.texto}
                sx={(t) => ({
                  font: `500 12.5px/1.4 ${FONTE}`,
                  color: linha.sentido === 'menos' ? t.vars.palette.primary.main : t.vars.palette.pilula.passou.fg,
                })}
              >
                {linha.texto}
              </Typography>
            ))}
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px', pb: 2 }}>
        <Box sx={{ display: 'flex', gap: '7px', mb: '12px' }}>
          <ButtonBase
            sx={botaoFiltro}
            aria-label={`filtro: ${rotuloFiltro}. tocar para trocar`}
            onClick={() => setFiltro((atual) => proximoFiltro(opcoes, atual))}
          >
            {rotuloFiltro}
          </ButtonBase>
          <ButtonBase component={RouterLink} to={`/calendario?mes=${dados.mes}`} sx={botaoSecundario}>
            ver calendário
          </ButtonBase>
        </Box>

        {dias.map((dia) => (
          <Box key={dia.data} component="section" sx={{ display: 'flex', flexDirection: 'column', mb: '14px' }}>
            <ButtonBase
              component={RouterLink}
              to={`/relatorio?data=${dia.data}`}
              aria-label={`ver relatório de ${diaCurto(dia.data).toLowerCase()}`}
              sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', pb: '9px' }}
            >
              <Typography component="h3" sx={rotuloSecao}>
                {diaCurto(dia.data)}
              </Typography>
              <Typography sx={{ font: `600 12px/1 ${FONTE}`, fontVariantNumeric: 'tabular-nums' }}>
                {kcal(dia.calorias)}
              </Typography>
            </ButtonBase>

            {dia.refeicoes.map((r) => (
              <LinhaRefeicao
                key={r.refeicao_id}
                refeicaoId={r.refeicao_id}
                nome={r.refeicao_nome}
                descricao={r.descricao}
                calorias={r.calorias}
              />
            ))}
          </Box>
        ))}
      </Box>
    </>
  );
}
```

O cabeçalho de cada dia da lista vira link para a visão daquele dia (`/relatorio?data=`) — é o caminho natural mês → dia; a volta é o `ver mês` da visão do dia.

- [ ] **Step 7: Página que escolhe a visão**

Substituir `frontend/src/pages/Relatorio.tsx` por (versão desta task; a Task 5 troca o ramo marcado):

```tsx
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box } from '@mui/material';
import { hojeISO } from '../lib/format';
import { visaoDosParametros } from '../lib/relatorio';
import VisaoMes from './relatorio/VisaoMes';

export default function Relatorio() {
  const [params, setParams] = useSearchParams();
  const [hoje] = useState(hojeISO);
  const visao = visaoDosParametros(params, hoje);

  // Task 5 troca este ramo por <VisaoDia />; até lá, ?data= abre o mês daquela data.
  const mes = visao.tipo === 'mes' ? visao.mes : visao.data.slice(0, 7);

  return (
    <Box component="main" sx={{ display: 'flex', flexDirection: 'column', gap: '22px', px: '22px', pt: '14px' }}>
      <VisaoMes mes={mes} hoje={hoje} aoTrocarMes={(novo) => setParams({ mes: novo })} />
    </Box>
  );
}
```

- [ ] **Step 8: Testes, typecheck e build do frontend**

Run (em `frontend/`): `npm test && npm run typecheck && npm run build`
Expected: testes PASS; typecheck e build com código 0. Se o typecheck acusar `palette.refeicao`/`neutro`/`pilula` inexistente em `theme.vars.palette`, a augmentação do plano A (`frontend/src/theme/tipos.d.ts`) não está completa — corrija lá conforme a spec (seção Tokens), não com `as any` aqui.

- [ ] **Step 9: Conferir no navegador (claro e escuro)**

Com backend e frontend em dev (`npm run dev` nos dois), logado numa conta com registros neste mês e no anterior:
1. Início → `relatório`: abre `/relatorio`, título `‹ setembro ›` com o mês atual e `média N kcal` à direita.
2. `›` desabilitada (cinza, sem clique) no mês atual; `‹` vai para `?mes=2026-08`, título `agosto`, barras crescem de novo; agora `›` volta para setembro. `‹` repetido atravessa o ano (`dezembro` de 2025).
3. `/relatorio?mes=2027-01` (futuro) abre o mês atual; `/relatorio?mes=lixo` também.
4. As barras crescem ao abrir (com "reduzir movimento" do sistema ligado, aparecem já no tamanho final), com as mesmas cores das barrinhas da lista do Início.
5. Até 2 linhas `↓ … menos …` (verde) / `↑ … mais …` (vermelho) aparecem quando existe mês anterior.
6. O botão preto (claro) / claro (escuro) cicla `todas as refeições → só … → todas`, e a lista por dia filtra e recalcula o total do dia. Trocar de mês zera o filtro.
7. `ver calendário` leva a `/calendario?mes=YYYY-MM`.
8. `/relatorio?mes=2020-01` (mês sem nada) mostra "nada registrado em janeiro." e `ver calendário`; as setas continuam funcionando.
9. Parar o backend e recarregar: aparece a mensagem de erro e `tentar de novo` recarrega quando o backend volta.
10. Leitor de tela/teclado: `Tab` passa por "mês anterior", "próximo mês" (anunciado como desabilitado no mês atual).
11. Trocar o tema em Perfil (ou no sistema) e conferir contra `screenshots/03-telas.png` (claro à esquerda, escuro à direita).

- [ ] **Step 10: Commit**

```bash
git add frontend/src/components/relatorio frontend/src/pages/relatorio/VisaoMes.tsx frontend/src/pages/Relatorio.tsx
git commit -m "Relatório mensal no design Sistema com setas entre meses"
```

---

### Task 5: Visão do dia com setas entre dias

**Files:**
- Create: `frontend/src/pages/relatorio/VisaoDia.tsx`
- Modify: `frontend/src/pages/Relatorio.tsx` (trocar o ramo marcado na Task 4)

**Interfaces:**
- Consumes: `api.resumoDia(data): Promise<ResumoDia>`, `api.registrosDoDia(data): Promise<RegistrosDoDia>`, `mensagemDoErro` (`lib/api.ts`, existentes); `deslocarDia`, `podeAvancarDia`, `statusDoDia`, `barrasDoDia`, `descricaoDoGrupo`, `diaCurto`, `kcal` (Task 3); `CabecalhoNavegavel`, `BarrasPorRefeicao`, `LinhaRefeicao`, estilos (Task 4); `statusVisual(status, data, hoje)` e `ROTULO_STATUS` (`lib/visual.ts`, plano A); `theme.vars.palette.pilula.{meta,sobrou,passou}.{bg,fg}`, `neutro.cartao` (plano A).
- Produces:
  ```ts
  export default function VisaoDia(props: {
    data: string; hoje: string; aoTrocarDia: (data: string) => void;
  }): JSX.Element;
  ```
  Entrada por URL: `/relatorio?data=YYYY-MM-DD` — é o que o `ver relatório` do calendário (plano B, D15) abre.

- [ ] **Step 1: Escrever a visão do dia**

Criar `frontend/src/pages/relatorio/VisaoDia.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, ButtonBase, Typography } from '@mui/material';
import { api, mensagemDoErro } from '../../lib/api';
import {
  barrasDoDia,
  deslocarDia,
  descricaoDoGrupo,
  diaCurto,
  kcal,
  podeAvancarDia,
  statusDoDia,
} from '../../lib/relatorio';
import type { RegistrosDoDia, ResumoDia } from '../../lib/types';
import { ROTULO_STATUS, statusVisual } from '../../lib/visual';
import BarrasPorRefeicao from '../../components/relatorio/BarrasPorRefeicao';
import CabecalhoNavegavel from '../../components/relatorio/CabecalhoNavegavel';
import LinhaRefeicao from '../../components/relatorio/LinhaRefeicao';
import { FONTE, botaoSecundario, rotuloSecao } from '../../components/relatorio/estilos';

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'erro'; mensagem: string }
  | { tipo: 'pronto'; resumo: ResumoDia; registros: RegistrosDoDia };

interface Props {
  data: string;
  hoje: string;
  aoTrocarDia: (data: string) => void;
}

export default function VisaoDia({ data, hoje, aoTrocarDia }: Props) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setEstado({ tipo: 'carregando' });
    Promise.all([api.resumoDia(data), api.registrosDoDia(data)])
      .then(([resumo, registros]) => {
        if (!cancelado) setEstado({ tipo: 'pronto', resumo, registros });
      })
      .catch((falha: unknown) => {
        if (!cancelado) setEstado({ tipo: 'erro', mensagem: mensagemDoErro(falha) });
      });
    return () => {
      cancelado = true;
    };
  }, [data, tentativa]);

  return (
    <>
      <CabecalhoNavegavel
        titulo={diaCurto(data).toLowerCase()}
        rotuloAnterior="dia anterior"
        rotuloProximo="próximo dia"
        aoAnterior={() => aoTrocarDia(deslocarDia(data, -1))}
        aoProximo={() => aoTrocarDia(deslocarDia(data, 1))}
        podeAvancar={podeAvancarDia(data, hoje)}
        lateral={
          <ButtonBase
            component={RouterLink}
            to={`/relatorio?mes=${data.slice(0, 7)}`}
            sx={{ font: `500 12.5px ${FONTE}`, color: 'text.secondary', flex: 'none' }}
          >
            ver mês
          </ButtonBase>
        }
      />

      {estado.tipo === 'carregando' && (
        <Typography sx={{ color: 'text.secondary', fontSize: 13 }} role="status">
          carregando o dia...
        </Typography>
      )}

      {estado.tipo === 'erro' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
          <Typography sx={{ color: 'error.main', fontSize: 13 }} role="alert">
            {estado.mensagem}
          </Typography>
          <ButtonBase sx={botaoSecundario} onClick={() => setTentativa((n) => n + 1)}>
            tentar de novo
          </ButtonBase>
        </Box>
      )}

      {estado.tipo === 'pronto' && (
        <ConteudoDia key={data} data={data} hoje={hoje} resumo={estado.resumo} registros={estado.registros} />
      )}
    </>
  );
}

function ConteudoDia({
  data,
  hoje,
  resumo,
  registros,
}: {
  data: string;
  hoje: string;
  resumo: ResumoDia;
  registros: RegistrosDoDia;
}) {
  const quantidade = resumo.refeicoes.reduce((s, r) => s + r.quantidade_registros, 0);
  const visual = statusVisual(statusDoDia(resumo.calorias.consumido, resumo.calorias.meta, quantidade), data, hoje);
  const grupos = registros.refeicoes.filter((g) => g.registros.length > 0);

  if (quantidade === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
        <Typography sx={{ font: `400 12.5px ${FONTE}`, color: 'text.secondary' }}>
          nada registrado em {diaCurto(data).toLowerCase()}.
        </Typography>
        <ButtonBase component={RouterLink} to={`/calendario?mes=${data.slice(0, 7)}`} sx={botaoSecundario}>
          ver calendário
        </ButtonBase>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <Typography
              sx={{ font: `800 34px/.9 ${FONTE}`, letterSpacing: '-.03em', fontVariantNumeric: 'tabular-nums' }}
            >
              {kcal(resumo.calorias.consumido)}
            </Typography>
            <Typography sx={{ font: `600 13px ${FONTE}`, color: 'text.secondary' }}>
              / {kcal(resumo.calorias.meta)} kcal
            </Typography>
          </Box>
          {visual !== 'vazio' && (
            <Box
              component="span"
              sx={(t) => ({
                minHeight: 26,
                display: 'flex',
                alignItems: 'center',
                px: '10px',
                borderRadius: '8px',
                font: `600 11px ${FONTE}`,
                bgcolor: t.vars.palette.pilula[visual].bg,
                color: t.vars.palette.pilula[visual].fg,
              })}
            >
              {ROTULO_STATUS[visual]}
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Typography component="h2" sx={rotuloSecao}>
          por refeição
        </Typography>
        <BarrasPorRefeicao
          itens={barrasDoDia(resumo.refeicoes)}
          rotuloAria={(item) => `${item.refeicao_nome}: ${kcal(item.calorias)} kcal`}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px', pb: 2 }}>
        <Typography component="h2" sx={{ ...rotuloSecao, pb: '9px' }}>
          registros
        </Typography>
        {grupos.map((g) => (
          <LinhaRefeicao
            key={g.refeicao_id}
            refeicaoId={g.refeicao_id}
            nome={g.refeicao_nome}
            descricao={descricaoDoGrupo(g)}
            calorias={g.calorias}
          />
        ))}
      </Box>
    </>
  );
}
```

Nota: `sx={{ ...rotuloSecao, pb: '9px' }}` funciona porque `rotuloSecao` é objeto (não função); não transformar `rotuloSecao` em função na Task 4.

- [ ] **Step 2: Ligar a visão do dia na página**

Em `frontend/src/pages/Relatorio.tsx`, substituir o arquivo inteiro por:

```tsx
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box } from '@mui/material';
import { hojeISO } from '../lib/format';
import { visaoDosParametros } from '../lib/relatorio';
import VisaoDia from './relatorio/VisaoDia';
import VisaoMes from './relatorio/VisaoMes';

export default function Relatorio() {
  const [params, setParams] = useSearchParams();
  const [hoje] = useState(hojeISO);
  const visao = visaoDosParametros(params, hoje);

  return (
    <Box component="main" sx={{ display: 'flex', flexDirection: 'column', gap: '22px', px: '22px', pt: '14px' }}>
      {visao.tipo === 'dia' ? (
        <VisaoDia data={visao.data} hoje={hoje} aoTrocarDia={(data) => setParams({ data })} />
      ) : (
        <VisaoMes mes={visao.mes} hoje={hoje} aoTrocarMes={(mes) => setParams({ mes })} />
      )}
    </Box>
  );
}
```

- [ ] **Step 3: Testes, typecheck e build do frontend**

Run (em `frontend/`): `npm test && npm run typecheck && npm run build`
Expected: testes PASS; typecheck e build com código 0. Se `palette.pilula[visual]` reclamar do índice, conferir que `StatusVisual` sem `'vazio'` indexa `pilula` (o `if visual !== 'vazio'` estreita o tipo); se a augmentação do plano A tipar `pilula` só com as três chaves, está certo.

- [ ] **Step 4: Conferir no navegador (claro e escuro)**

1. Calendário → dia com registro → `ver relatório`: abre `/relatorio?data=YYYY-MM-DD` com título `‹ 13 set ›`, total `1 476 / 2 200 kcal`, pílula com a mesma cor e rótulo do círculo daquele dia no calendário.
2. Em hoje, `›` desabilitada; `‹` vai para ontem e atualiza a URL; `‹` no dia 1 vai para o último dia do mês anterior.
3. Barras mostram só refeições com kcal no dia, na ordem das refeições, com as cores do Início; crescem de novo a cada troca de dia.
4. Lista `registros` mostra uma linha por refeição com `nome · alimentos` e kcal.
5. Dia sem registro (navegando com `‹`): "nada registrado em 3 set." + `ver calendário`; setas continuam.
6. `ver mês` leva a `/relatorio?mes=` do mês do dia; lá, tocar no cabeçalho `13 SET` da lista volta para a visão do dia.
7. `/relatorio?data=2099-01-01` (futuro) e `/relatorio?data=2026-02-30` abrem o mês atual.
8. Botão voltar do navegador percorre os dias visitados (cada seta é uma entrada no histórico).
9. Conferir claro e escuro (Perfil → aparência).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/relatorio/VisaoDia.tsx frontend/src/pages/Relatorio.tsx
git commit -m "Relatório do dia com setas entre dias"
```

---

## Self-Review (feito na escrita)

- **Cobertura da spec:** endpoint e formato exatos (Tasks 1–2); média só sobre dias com registro, média por refeição sobre dias com qualquer registro, variação com 1 casa e `null`, filtro de kcal > 0, ordem desc, dias desc, descrição com `", "`, fuso via `tempo.ts` (Task 1); visão do mês com `‹ mês ›` (próximo desabilitado no mês atual), média, barras animadas até 96 px com cor D8, 2 linhas de maior |variação| ignorando `null`, filtro cíclico, `ver calendário`, lista por dia, estado vazio (Tasks 3–4); D15 — visão do dia em `?data=` com `‹ 13 set ›` (próximo desabilitado em hoje), total vs meta com pílula de status pela regra 90–110% do contrato, barras por refeição reaproveitadas, lista de registros e `ver mês`, sem endpoint novo (Tasks 3 e 5).
- **Decisões além da spec, registradas:** `mesAnterior` novo em `tempo.ts`; variação que arredonda a 0% não vira linha; preposição `no/na` por heurística; `kcal()` com espaço não separável; erro com `tentar de novo` local; empate em `media_calorias` ordenado por `inicio`; `?data=` inválida/futura e `?mes=` inválido/futuro caem no mês atual; `?data=` ganha de `?mes=`; cabeçalho de cada dia na lista mensal leva à visão daquele dia; setas empilham histórico (`setParams` sem `replace`); `statusDoDia` do frontend espelha o do backend (mesmo arredondamento).
- **Tipos:** `RelatorioMes` do backend não tem `mes` (a rota acrescenta); o do frontend tem. Nomes `resumoMes`, `montarRelatorioMes`, `linhasDeVariacao`, `opcoesDeFiltro`, `proximoFiltro`, `diasFiltrados`, `kcal`, `diaCurto`, `visaoDosParametros`, `deslocarDia`, `podeAvancarMes`, `podeAvancarDia`, `statusDoDia`, `barrasDoMes`, `barrasDoDia`, `descricaoDoGrupo`, `ItemBarra`, `CabecalhoNavegavel`, `BarrasPorRefeicao`, `LinhaRefeicao`, `VisaoMes`, `VisaoDia` são os mesmos em todas as tasks.
