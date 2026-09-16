# Plano A — Fundação MUI + Liquid Glass Tab Bar + casca do app

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Modelo:** cada tarefa é implementada por subagente **Sonnet** (`model: "sonnet"`); a sessão Opus só coordena e revisa. Não executar antes de o usuário liberar.

**Goal:** Instalar MUI + Motion no frontend, criar o tema claro/escuro com os tokens do design "Sistema", construir a tab bar Liquid Glass com o botão central de captura e reorganizar as rotas numa casca comum — sem ainda redesenhar as telas.

**Architecture:** O tema MUI (`cssVariables` + `colorSchemes`) vira a única fonte de cores; um script inline no `index.html` aplica o esquema antes do React subir. O fluxo de captura (foto/áudio/texto + confirmação da IA) sai da Home para um `CapturaProvider` global. Uma rota-layout `Casca` desenha `<Outlet/>` + `LiquidGlassTabBar` para as telas com barra; as telas que os planos B/C/D ainda vão construir apontam para as páginas atuais ou para uma tela provisória só com o título.

**Tech Stack:** React 19 · Vite 7 · TypeScript 5.9 · `@mui/material` 9 · `@emotion/*` 11 · `motion` 13 (`motion/react`) · `lucide-react` 1 · `@fontsource-variable/plus-jakarta-sans` 5 · Vitest 5 (ambiente `node`).

**Spec:** `docs/superpowers/specs/2026-09-16-redesign-liquid-glass-design.md`

## Global Constraints

- Versões exatas do spec: `@mui/material ^9.4.0`, `@emotion/react ^11.14.0`, `@emotion/styled ^11.14.1`, `motion ^13.4.0`, `lucide-react ^1.46.0`, `@fontsource-variable/plus-jakarta-sans ^5.3.0`, `vitest ^5.0.1` (dev). Three.js **não** entra neste plano.
- Motion sempre importado de `'motion/react'` (nunca `framer-motion`).
- Cores só via tema (`(theme.vars ?? theme).palette.*` ou `theme.applyStyles('dark', …)`); os únicos literais permitidos são os do vidro/brilho/badge/botão central que o spec define como `rgba(...)`/hex fixos.
- Domínio em português, termos técnicos em inglês; comentários só quando o porquê não é óbvio.
- O CSS antigo (`frontend/src/styles/*.css`) **continua** importado até o plano B. Até lá, telas antigas podem ficar visualmente misturadas no modo claro — é esperado.
- Testes Vitest só de funções puras, sem rede, sem DOM.
- Todo passo de verificação roda dentro de `frontend/`.
- Rotas e tabela de tab bar exatamente como na seção "Casca do app e rotas" do spec. Subtelas de perfil (`/perfil/*`) e detalhe de item (`/registros/:id/alimentos/:indice`) são do plano B e **não** entram aqui.
- Commits em português, frase imperativa curta, como o histórico (`Adiciona …`, `Corrige …`), terminando com as linhas de atribuição da sessão.

---

### Task 1: Dependências, Vitest, fonte e tema claro/escuro

**Files:**
- Modify: `frontend/package.json`, `frontend/package-lock.json` (via npm)
- Modify: `frontend/index.html`
- Modify: `frontend/src/main.tsx`
- Create: `frontend/src/theme/tipos.d.ts`
- Create: `frontend/src/theme/tema.ts`
- Test: `frontend/src/theme/tema.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `export const tema: Theme` (de `frontend/src/theme/tema.ts`) — `cssVariables.colorSchemeSelector = '[data-esquema="%s"]'`, `colorSchemes.light|dark` com todos os tokens do spec.
  - `export function paleta(theme: Theme): Theme['palette']` — atalho para `(theme.vars ?? theme).palette`; use em `styled`/`sx` para obter valores `var(--mui-…)` que trocam com o esquema.
  - Augmentação de tipos: `palette.neutro.{fraco,linha,borda,cartao}`, `palette.status.{meta,sobrou,passou,vazio}`, `palette.pilula.{meta,sobrou,passou}.{bg,fg}`, `palette.macro.{carbo,proteina,gordura}`, `palette.agua.{gradiente,trilha}`, `palette.refeicao.{cafe,almoco,lanche,janta,ceia}`, `palette.primary.vivo`.
  - Chave de armazenamento do modo: `localStorage['dieta.tema']` com `'system' | 'light' | 'dark'` (gravada pelo `useColorScheme().setMode` do MUI; o plano B usa no seletor de aparência).

- [ ] **Step 1: Instalar dependências**

Run (em `frontend/`):
```bash
npm install @mui/material@^9.4.0 @emotion/react@^11.14.0 @emotion/styled@^11.14.1 motion@^13.4.0 lucide-react@^1.46.0 @fontsource-variable/plus-jakarta-sans@^5.3.0
npm install -D vitest@^5.0.1
```
Expected: sem `ERESOLVE`. Conferir com `npm ls @mui/material motion vitest` — as três versões aparecem.

- [ ] **Step 2: Adicionar o script de teste**

Em `frontend/package.json`, dentro de `"scripts"`, depois de `"typecheck"`:
```json
    "test": "vitest run",
```

- [ ] **Step 3: Escrever o teste do tema (falha)**

Create `frontend/src/theme/tema.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { tema } from './tema';

describe('tema', () => {
  it('tem os tokens do modo claro', () => {
    const p = tema.colorSchemes.light?.palette;
    expect(p?.primary.main).toBe('#0B7A46');
    expect(p?.primary.vivo).toBe('#0CA85D');
    expect(p?.status.passou).toBe('#FF2146');
    expect(p?.pilula.sobrou).toEqual({ bg: '#E4EEFB', fg: '#1B69B8' });
    expect(p?.refeicao.ceia).toBe('#D6457A');
    expect(p?.agua.gradiente).toBe('linear-gradient(90deg,#2B87E3,#5AA9F0)');
  });

  it('tem os tokens do modo escuro', () => {
    const p = tema.colorSchemes.dark?.palette;
    expect(p?.background.default).toBe('#0d0f12');
    expect(p?.primary.contrastText).toBe('#07130e');
    expect(p?.status.vazio).toBe('#33383f');
    expect(p?.neutro.fraco).toBe('#525a66');
    expect(p?.refeicao.cafe).toBe('#D99B2E');
  });

  it('usa Plus Jakarta Sans', () => {
    expect(tema.typography.fontFamily).toContain('Plus Jakarta Sans Variable');
  });
});
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./tema"`.

- [ ] **Step 5: Augmentação de tipos**

Create `frontend/src/theme/tipos.d.ts`:
```ts
import '@mui/material/styles';

interface CoresPilula {
  bg: string;
  fg: string;
}

interface TokensDieta {
  neutro: { fraco: string; linha: string; borda: string; cartao: string };
  status: { meta: string; sobrou: string; passou: string; vazio: string };
  pilula: { meta: CoresPilula; sobrou: CoresPilula; passou: CoresPilula };
  macro: { carbo: string; proteina: string; gordura: string };
  agua: { gradiente: string; trilha: string };
  refeicao: { cafe: string; almoco: string; lanche: string; janta: string; ceia: string };
}

declare module '@mui/material/styles' {
  interface Palette extends TokensDieta {}
  interface PaletteOptions extends Partial<TokensDieta> {}
  interface PaletteColor {
    vivo?: string;
  }
  interface SimplePaletteColorOptions {
    vivo?: string;
  }
}
```

- [ ] **Step 6: Tema**

Create `frontend/src/theme/tema.ts`:
```ts
import { createTheme } from '@mui/material/styles';
import type { PaletteOptions, Theme } from '@mui/material/styles';

const claro = {
  fundo: '#FFFFFF',
  texto: '#14120F',
  mudo: '#63635D',
  fraco: '#B8B4AA',
  linha: '#F0EEE9',
  borda: '#E6E4DF',
  cartao: '#F7F6F3',
  meta: '#0CA85D',
  sobrou: '#2B87E3',
  passou: '#FF2146',
  vazio: '#E6E4DF',
  carbo: '#2B87E3',
  proteina: '#9F43CC',
  gordura: '#EBA10F',
  rosa: '#D6457A',
};

const escuro = {
  fundo: '#0d0f12',
  texto: '#e7eaee',
  mudo: '#8a919d',
  fraco: '#525a66',
  linha: '#262b34',
  borda: '#262b34',
  cartao: '#15181d',
  meta: '#3fa87c',
  sobrou: '#4B93D6',
  passou: '#e5837a',
  vazio: '#33383f',
  carbo: '#4B93D6',
  proteina: '#A06BC4',
  gordura: '#D99B2E',
  rosa: '#D98AA8',
};

const paletaClara: PaletteOptions = {
  background: { default: claro.fundo, paper: claro.fundo },
  text: { primary: claro.texto, secondary: claro.mudo },
  divider: claro.linha,
  primary: { main: '#0B7A46', dark: '#096338', contrastText: '#FFFFFF', vivo: '#0CA85D' },
  error: { main: '#FF2146' },
  neutro: { fraco: claro.fraco, linha: claro.linha, borda: claro.borda, cartao: claro.cartao },
  status: { meta: claro.meta, sobrou: claro.sobrou, passou: claro.passou, vazio: claro.vazio },
  pilula: {
    meta: { bg: '#DFF3E8', fg: '#0B7A46' },
    sobrou: { bg: '#E4EEFB', fg: '#1B69B8' },
    passou: { bg: '#FCE4E7', fg: '#C4002A' },
  },
  macro: { carbo: claro.carbo, proteina: claro.proteina, gordura: claro.gordura },
  agua: { gradiente: 'linear-gradient(90deg,#2B87E3,#5AA9F0)', trilha: '#F0EEE9' },
  refeicao: {
    cafe: claro.gordura,
    almoco: claro.sobrou,
    lanche: claro.proteina,
    janta: claro.meta,
    ceia: claro.rosa,
  },
};

const paletaEscura: PaletteOptions = {
  background: { default: escuro.fundo, paper: escuro.cartao },
  text: { primary: escuro.texto, secondary: escuro.mudo },
  divider: escuro.linha,
  primary: { main: '#3fa87c', dark: '#47b989', contrastText: '#07130e', vivo: '#3fa87c' },
  error: { main: '#e5837a' },
  neutro: { fraco: escuro.fraco, linha: escuro.linha, borda: escuro.borda, cartao: escuro.cartao },
  status: { meta: escuro.meta, sobrou: escuro.sobrou, passou: escuro.passou, vazio: escuro.vazio },
  pilula: {
    meta: { bg: '#0e2b1e', fg: '#3fa87c' },
    sobrou: { bg: '#0f1f30', fg: '#4B93D6' },
    passou: { bg: '#2c1416', fg: '#e5837a' },
  },
  macro: { carbo: escuro.carbo, proteina: escuro.proteina, gordura: escuro.gordura },
  agua: { gradiente: 'linear-gradient(90deg,#4B93D6,#79B7EF)', trilha: '#262b34' },
  refeicao: {
    cafe: escuro.gordura,
    almoco: escuro.sobrou,
    lanche: escuro.proteina,
    janta: escuro.meta,
    ceia: escuro.rosa,
  },
};

export const tema = createTheme({
  // O mesmo atributo é gravado pelo script inline do index.html antes do React montar.
  cssVariables: { colorSchemeSelector: '[data-esquema="%s"]' },
  colorSchemes: {
    light: { palette: paletaClara },
    dark: { palette: paletaEscura },
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans Variable', system-ui, sans-serif",
  },
  shape: { borderRadius: 12 },
});

export function paleta(theme: Theme): Theme['palette'] {
  return (theme.vars ?? theme).palette as Theme['palette'];
}
```

- [ ] **Step 7: Rodar o teste**

Run: `npm test`
Expected: PASS (3 testes).

- [ ] **Step 8: Aplicar tema, fonte e baseline no `main.tsx`**

Replace `frontend/src/main.tsx` inteiro:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import '@fontsource-variable/plus-jakarta-sans/index.css';
import App from './App';
import { tema } from './theme/tema';
import './styles/tokens.css';
import './styles/base.css';
import './styles/home.css';
import './styles/forms.css';
import './styles/overlay.css';
import './styles/social.css';

const raiz = document.getElementById('root');
if (raiz === null) throw new Error('elemento #root não encontrado');

createRoot(raiz).render(
  <StrictMode>
    <ThemeProvider
      theme={tema}
      defaultMode="system"
      modeStorageKey="dieta.tema"
      disableTransitionOnChange
    >
      <CssBaseline enableColorScheme />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
```

- [ ] **Step 9: Script anti-piscada no `index.html`**

Replace `frontend/index.html` inteiro (arquivo em UTF-8):
```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#0d0f12" media="(prefers-color-scheme: dark)" />
    <title>dieta preguiçoso</title>
    <script>
      // Aplica o esquema salvo pelo MUI (useColorScheme) antes da primeira pintura.
      (function () {
        try {
          var modo = localStorage.getItem('dieta.tema') || 'system';
          if (modo === 'system') {
            modo = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          }
          document.documentElement.setAttribute('data-esquema', modo);
        } catch (e) {
          document.documentElement.setAttribute('data-esquema', 'dark');
        }
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 10: Verificar APIs do MUI 9 / Motion 13**

Run: `npm run typecheck`
Expected: sem erros. Se reclamar de `defaultMode`/`modeStorageKey`/`disableTransitionOnChange` no `ThemeProvider` ou de `cssVariables.colorSchemeSelector`, abrir `node_modules/@mui/material/styles/ThemeProvider.d.ts` e `createThemeWithVars.d.ts`, usar o nome atual da prop com o mesmo comportamento e registrar a diferença na mensagem do commit.

- [ ] **Step 11: Build e conferência visual**

Run: `npm run build` → sucesso.
Run: `npm run dev`, abrir `http://localhost:5173`, no DevTools conferir `<html data-esquema="light|dark">` seguindo o sistema e `--mui-palette-status-meta` definido em `:root`/`[data-esquema="dark"]`.

- [ ] **Step 12: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/index.html frontend/src/main.tsx frontend/src/theme/tipos.d.ts frontend/src/theme/tema.ts frontend/src/theme/tema.test.ts
git commit -m "Adiciona MUI, Motion e tema claro/escuro com os tokens do redesign"
```

---

### Task 2: Funções visuais compartilhadas (`lib/visual.ts`)

**Files:**
- Create: `frontend/src/lib/visual.ts`
- Test: `frontend/src/lib/visual.test.ts`

**Interfaces:**
- Consumes: `StatusDia`, `Refeicao` de `frontend/src/lib/types.ts`.
- Produces (assinaturas exatas do spec):
  - `export type StatusVisual = 'meta' | 'sobrou' | 'passou' | 'vazio'`
  - `export function statusVisual(status: StatusDia, data: string, hoje: string): StatusVisual`
  - `export const ROTULO_STATUS: Record<StatusVisual, string>`
  - `export type CorRefeicao = 'cafe' | 'almoco' | 'lanche' | 'janta' | 'ceia'`
  - `export function corDaRefeicao(refeicaoId: string, refeicoes: Refeicao[]): CorRefeicao` — id desconhecido cai em `'cafe'`.
  - `export function litros(ml: number): string`
  - `export function mesLongo(mes: string): string`
  - `export function deslocarMes(mes: string, delta: number): string`

- [ ] **Step 1: Escrever os testes (falham)**

Create `frontend/src/lib/visual.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { corDaRefeicao, deslocarMes, litros, mesLongo, ROTULO_STATUS, statusVisual } from './visual';
import type { Refeicao } from './types';

const refeicoes: Refeicao[] = [
  { id: 'j', nome: 'Janta', inicio: '18:01', fim: '22:00' },
  { id: 'c', nome: 'Café da manhã', inicio: '05:00', fim: '10:00' },
  { id: 'x', nome: 'Ceia', inicio: '22:01', fim: '04:59' },
  { id: 'a', nome: 'Almoço', inicio: '10:01', fim: '15:00' },
  { id: 'l', nome: 'Lanche', inicio: '15:01', fim: '18:00' },
];

describe('statusVisual', () => {
  it('mapeia os status da API', () => {
    expect(statusVisual('na_meta', '2026-09-10', '2026-09-14')).toBe('meta');
    expect(statusVisual('abaixo', '2026-09-10', '2026-09-14')).toBe('sobrou');
    expect(statusVisual('acima', '2026-09-10', '2026-09-14')).toBe('passou');
    expect(statusVisual('sem_registro', '2026-09-10', '2026-09-14')).toBe('vazio');
  });

  it('dia futuro é vazio mesmo com status', () => {
    expect(statusVisual('na_meta', '2026-09-15', '2026-09-14')).toBe('vazio');
  });

  it('hoje conta como passado', () => {
    expect(statusVisual('abaixo', '2026-09-14', '2026-09-14')).toBe('sobrou');
  });

  it('tem rótulos', () => {
    expect(ROTULO_STATUS).toEqual({
      meta: 'na meta',
      sobrou: 'sobrou',
      passou: 'passou da meta',
      vazio: 'sem registro',
    });
  });
});

describe('corDaRefeicao', () => {
  it('usa a posição por horário de início', () => {
    expect(corDaRefeicao('c', refeicoes)).toBe('cafe');
    expect(corDaRefeicao('a', refeicoes)).toBe('almoco');
    expect(corDaRefeicao('l', refeicoes)).toBe('lanche');
    expect(corDaRefeicao('j', refeicoes)).toBe('janta');
    expect(corDaRefeicao('x', refeicoes)).toBe('ceia');
  });

  it('cicla depois da quinta', () => {
    const seis = [...refeicoes, { id: 'z', nome: 'Madrugada', inicio: '23:00', fim: '23:30' }];
    expect(corDaRefeicao('z', seis)).toBe('cafe');
  });

  it('id desconhecido cai em café', () => {
    expect(corDaRefeicao('nao-existe', refeicoes)).toBe('cafe');
  });

  it('não reordena o array recebido', () => {
    const copia = [...refeicoes];
    corDaRefeicao('a', refeicoes);
    expect(refeicoes).toEqual(copia);
  });
});

describe('litros', () => {
  it('formata com vírgula e uma casa', () => {
    expect(litros(1200)).toBe('1,2');
    expect(litros(2500)).toBe('2,5');
    expect(litros(0)).toBe('0,0');
    expect(litros(1250)).toBe('1,3');
  });
});

describe('meses', () => {
  it('mesLongo em português', () => {
    expect(mesLongo('2026-09')).toBe('setembro');
    expect(mesLongo('2026-03')).toBe('março');
  });

  it('deslocarMes atravessa o ano', () => {
    expect(deslocarMes('2026-01', -1)).toBe('2025-12');
    expect(deslocarMes('2025-12', 1)).toBe('2026-01');
    expect(deslocarMes('2026-09', 0)).toBe('2026-09');
    expect(deslocarMes('2026-09', -14)).toBe('2025-07');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./visual"`.

- [ ] **Step 3: Implementar**

Create `frontend/src/lib/visual.ts`:
```ts
import type { Refeicao, StatusDia } from './types';

export type StatusVisual = 'meta' | 'sobrou' | 'passou' | 'vazio';

const STATUS_DA_API: Record<StatusDia, StatusVisual> = {
  na_meta: 'meta',
  abaixo: 'sobrou',
  acima: 'passou',
  sem_registro: 'vazio',
};

/** Datas em YYYY-MM-DD comparam certo como texto. */
export function statusVisual(status: StatusDia, data: string, hoje: string): StatusVisual {
  if (data > hoje) return 'vazio';
  return STATUS_DA_API[status];
}

export const ROTULO_STATUS: Record<StatusVisual, string> = {
  meta: 'na meta',
  sobrou: 'sobrou',
  passou: 'passou da meta',
  vazio: 'sem registro',
};

export type CorRefeicao = 'cafe' | 'almoco' | 'lanche' | 'janta' | 'ceia';

const CICLO_CORES: CorRefeicao[] = ['cafe', 'almoco', 'lanche', 'janta', 'ceia'];

/** Refeições são livres por pessoa: a cor vem da posição por horário, não do nome. */
export function corDaRefeicao(refeicaoId: string, refeicoes: Refeicao[]): CorRefeicao {
  const ordenadas = [...refeicoes].sort((a, b) => a.inicio.localeCompare(b.inicio));
  const posicao = ordenadas.findIndex((item) => item.id === refeicaoId);
  return CICLO_CORES[Math.max(posicao, 0) % CICLO_CORES.length] ?? 'cafe';
}

export function litros(ml: number): string {
  return (ml / 1000).toFixed(1).replace('.', ',');
}

function partesDoMes(mes: string): { ano: number; indice: number } {
  const [ano, numero] = mes.split('-').map(Number);
  return { ano: ano ?? 1970, indice: (numero ?? 1) - 1 };
}

export function mesLongo(mes: string): string {
  const { ano, indice } = partesDoMes(mes);
  return new Date(ano, indice, 1).toLocaleDateString('pt-BR', { month: 'long' });
}

export function deslocarMes(mes: string, delta: number): string {
  const { ano, indice } = partesDoMes(mes);
  const total = ano * 12 + indice + delta;
  const novoAno = Math.floor(total / 12);
  const novoMes = total - novoAno * 12 + 1;
  return `${novoAno}-${String(novoMes).padStart(2, '0')}`;
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npm test`
Expected: PASS (todos de `tema` e `visual`). Se `mesLongo` devolver `"September"`, o Node está sem ICU completo — rodar `node -e "console.log(new Intl.DateTimeFormat('pt-BR',{month:'long'}).format(new Date(2026,8,1)))"`; Node ≥ 20 oficial traz ICU completo, então trocar para o binário oficial em vez de mudar o código.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/visual.ts frontend/src/lib/visual.test.ts
git commit -m "Adiciona funcoes visuais de status, cor de refeicao, litros e meses"
```

---

### Task 3: Liquid Glass Tab Bar

**Files:**
- Create: `frontend/src/components/tabbar/brilho.ts`
- Create: `frontend/src/components/tabbar/rolagem.ts`
- Create: `frontend/src/components/tabbar/vidro.ts`
- Create: `frontend/src/components/tabbar/icones.tsx`
- Create: `frontend/src/components/tabbar/useRolagemCompacta.ts`
- Create: `frontend/src/components/tabbar/TabBarIndicator.tsx`
- Create: `frontend/src/components/tabbar/TabBarItem.tsx`
- Create: `frontend/src/components/tabbar/LiquidGlassTabBar.tsx`
- Test: `frontend/src/components/tabbar/brilho.test.ts`
- Test: `frontend/src/components/tabbar/rolagem.test.ts`

**Interfaces:**
- Consumes: `paleta(theme)` (Task 1).
- Produces:
  - `export interface ItemTab { id: string; rotulo: string; icone: ReactNode; badge?: number }` (em `LiquidGlassTabBar.tsx`)
  - `export default function LiquidGlassTabBar(props: { itens: ItemTab[]; ativo: string | null; aoTrocar: (id: string) => void; acaoCentral: ReactNode }): JSX.Element`
  - `export function useRolagemCompacta(): boolean`
  - `export function posicaoRelativa(clientX: number, clientY: number, rect: Retangulo): { x: number; y: number }` e `export const BRILHO_REPOUSO = { x: 50, y: 0 }`
  - `export function decidirCompacta(atual: boolean, delta: number, y: number): boolean`, `LIMIAR_DELTA = 6`, `TOPO = 40` (em `rolagem.ts` — separado do hook para testar sem Motion)
  - `export function estiloVidro(theme: Theme): CSSObject` (em `vidro.ts`, reaproveitado pelo popover do `MenuCaptura`)
  - `export function IconeInicio()`, `IconeSocial()`, `IconeCalendario()`, `IconePerfil()`, `IconeMais()` (em `icones.tsx`)

- [ ] **Step 1: Testes das funções puras (falham)**

Create `frontend/src/components/tabbar/brilho.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { BRILHO_REPOUSO, posicaoRelativa } from './brilho';

const rect = { left: 100, top: 500, width: 300, height: 60 };

describe('posicaoRelativa', () => {
  it('converte para porcentagem da pílula', () => {
    expect(posicaoRelativa(250, 530, rect)).toEqual({ x: 50, y: 50 });
    expect(posicaoRelativa(100, 500, rect)).toEqual({ x: 0, y: 0 });
    expect(posicaoRelativa(400, 560, rect)).toEqual({ x: 100, y: 100 });
  });

  it('prende entre 0 e 100 quando o dedo sai da pílula', () => {
    expect(posicaoRelativa(0, 900, rect)).toEqual({ x: 0, y: 100 });
    expect(posicaoRelativa(999, 0, rect)).toEqual({ x: 100, y: 0 });
  });

  it('retângulo sem tamanho volta ao repouso', () => {
    expect(posicaoRelativa(10, 10, { left: 0, top: 0, width: 0, height: 0 })).toEqual(BRILHO_REPOUSO);
  });
});
```

Create `frontend/src/components/tabbar/rolagem.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { decidirCompacta } from './rolagem';

describe('decidirCompacta', () => {
  it('perto do topo sempre normal', () => {
    expect(decidirCompacta(true, 20, 40)).toBe(false);
    expect(decidirCompacta(true, 0, 10)).toBe(false);
  });

  it('descendo mais que o limiar compacta', () => {
    expect(decidirCompacta(false, 7, 300)).toBe(true);
  });

  it('subindo mais que o limiar volta ao normal', () => {
    expect(decidirCompacta(true, -7, 300)).toBe(false);
  });

  it('movimento pequeno mantém o estado', () => {
    expect(decidirCompacta(true, 6, 300)).toBe(true);
    expect(decidirCompacta(false, -6, 300)).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL — imports `./brilho` e `./rolagem` não resolvem.

- [ ] **Step 3: Funções puras**

Create `frontend/src/components/tabbar/brilho.ts`:
```ts
export interface Retangulo {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Brilho parado: centro horizontal, colado no topo da pílula. */
export const BRILHO_REPOUSO = { x: 50, y: 0 };

const limitar = (valor: number) => Math.min(100, Math.max(0, valor));

export function posicaoRelativa(clientX: number, clientY: number, rect: Retangulo): { x: number; y: number } {
  if (rect.width <= 0 || rect.height <= 0) return { ...BRILHO_REPOUSO };
  return {
    x: limitar(((clientX - rect.left) / rect.width) * 100),
    y: limitar(((clientY - rect.top) / rect.height) * 100),
  };
}
```

Create `frontend/src/components/tabbar/rolagem.ts`:
```ts
export const LIMIAR_DELTA = 6;
export const TOPO = 40;

/** `delta` é a distância desde a última rolagem que mudou a decisão (positivo = descendo). */
export function decidirCompacta(atual: boolean, delta: number, y: number): boolean {
  if (y <= TOPO) return false;
  if (delta > LIMIAR_DELTA) return true;
  if (delta < -LIMIAR_DELTA) return false;
  return atual;
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Hook de rolagem**

Create `frontend/src/components/tabbar/useRolagemCompacta.ts`:
```ts
import { useRef, useState } from 'react';
import { useMotionValueEvent, useScroll } from 'motion/react';
import { decidirCompacta, LIMIAR_DELTA, TOPO } from './rolagem';

export function useRolagemCompacta(): boolean {
  const { scrollY } = useScroll();
  const [compacta, setCompacta] = useState(false);
  // Referência só anda quando o movimento passa do limiar: vários scrolls de 2px somam.
  const referencia = useRef(0);

  useMotionValueEvent(scrollY, 'change', (y) => {
    const delta = y - referencia.current;
    if (y > TOPO && Math.abs(delta) <= LIMIAR_DELTA) return;
    referencia.current = y;
    setCompacta((atual) => decidirCompacta(atual, delta, y));
  });

  return compacta;
}
```

- [ ] **Step 6: Vidro compartilhado**

Create `frontend/src/components/tabbar/vidro.ts`:
```ts
import type { CSSObject, Theme } from '@mui/material/styles';

const SEM_BLUR = '@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))';

export function estiloVidro(theme: Theme): CSSObject {
  return {
    background: 'rgba(255,255,255,.6)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255,255,255,.85)',
    boxShadow: '0 10px 30px -10px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.9)',
    [SEM_BLUR]: { background: 'rgba(255,255,255,.92)' },
    ...theme.applyStyles('dark', {
      background: 'rgba(21,24,29,.6)',
      border: '1px solid rgba(255,255,255,.08)',
      boxShadow: '0 10px 30px -10px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.06)',
      [SEM_BLUR]: { background: 'rgba(21,24,29,.95)' },
    }),
  };
}
```

- [ ] **Step 7: Ícones do design**

Create `frontend/src/components/tabbar/icones.tsx`:
```tsx
import type { ReactNode } from 'react';

function Icone({ tamanho = 19, traco = 1.8, children }: { tamanho?: number; traco?: number; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      fill="none"
      stroke="currentColor"
      strokeWidth={traco}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function IconeInicio() {
  return (
    <Icone>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9h12v-9" />
    </Icone>
  );
}

export function IconeSocial() {
  return (
    <Icone>
      <circle cx="9" cy="9" r="3" />
      <circle cx="16.5" cy="10" r="2.4" />
      <path d="M3.5 20c0-3.3 2.6-5.6 5.5-5.6s5.5 2.3 5.5 5.6" />
      <path d="M15 14.7c2.4.4 4 2.3 4 5.3" />
    </Icone>
  );
}

export function IconeCalendario() {
  return (
    <Icone>
      <rect x="4" y="5" width="16" height="15" rx="2.6" />
      <path d="M4 9.5h16" />
      <path d="M8 3v4M16 3v4" />
    </Icone>
  );
}

export function IconePerfil() {
  return (
    <Icone>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </Icone>
  );
}

export function IconeMais() {
  return (
    <Icone tamanho={22} traco={2.1}>
      <path d="M12 5v14M5 12h14" />
    </Icone>
  );
}
```

- [ ] **Step 8: Indicador líquido**

Create `frontend/src/components/tabbar/TabBarIndicator.tsx`:
```tsx
import { styled } from '@mui/material/styles';
import { motion, useReducedMotion } from 'motion/react';

// Duas camadas: a externa faz a animação de layout (posição/tamanho) e a interna a
// "esticada" em scaleX — as duas mexem em transform e brigariam no mesmo elemento.
const Trilho = styled(motion.span)({
  position: 'absolute',
  inset: 0,
  zIndex: 0,
  borderRadius: 20,
});

const Gota = styled(motion.span)(({ theme }) => ({
  position: 'absolute',
  inset: 0,
  borderRadius: 20,
  background: 'rgba(0,0,0,.08)',
  ...theme.applyStyles('dark', { background: 'rgba(255,255,255,.09)' }),
}));

export default function TabBarIndicator({ esticar }: { esticar: boolean }) {
  const reduzir = useReducedMotion() ?? false;
  return (
    <Trilho
      layoutId="tab-indicador"
      aria-hidden="true"
      transition={reduzir ? { duration: 0.15 } : { type: 'spring', stiffness: 380, damping: 30, mass: 0.9 }}
    >
      <Gota
        initial={false}
        animate={esticar && !reduzir ? { scaleX: [1, 1.35, 1] } : { scaleX: 1 }}
        transition={{ duration: 0.45, ease: 'easeInOut' }}
      />
    </Trilho>
  );
}
```

- [ ] **Step 9: Item da barra**

Create `frontend/src/components/tabbar/TabBarItem.tsx`:
```tsx
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import { motion, useReducedMotion } from 'motion/react';
import TabBarIndicator from './TabBarIndicator';
import type { ItemTab } from './LiquidGlassTabBar';
import { paleta } from '../../theme/tema';

const MOLA = { type: 'spring', stiffness: 300, damping: 28 } as const;

const Botao = styled(motion.button)(({ theme }) => ({
  position: 'relative',
  width: 50,
  padding: 0,
  margin: 0,
  border: 'none',
  borderRadius: 20,
  background: 'none',
  font: 'inherit',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  color: paleta(theme).text.secondary,
  transition: 'color .25s ease',
  WebkitTapHighlightColor: 'transparent',
  '&[aria-current="page"]': { color: paleta(theme).primary.main },
  '&:focus-visible': { outline: `2px solid ${paleta(theme).primary.main}`, outlineOffset: 2 },
  '@media (prefers-reduced-motion: reduce)': { transition: 'color .15s ease' },
}));

interface Props {
  item: ItemTab;
  ativo: boolean;
  compacta: boolean;
  esticar: boolean;
  aoSelecionar: () => void;
}

export default function TabBarItem({ item, ativo, compacta, esticar, aoSelecionar }: Props) {
  const reduzir = useReducedMotion() ?? false;
  const transicao = reduzir ? { duration: 0.15 } : MOLA;
  const temBadge = item.badge !== undefined && item.badge > 0;

  return (
    <Botao
      type="button"
      onClick={aoSelecionar}
      aria-current={ativo ? 'page' : undefined}
      aria-label={temBadge ? `${item.rotulo}, ${item.badge} novidades` : item.rotulo}
      initial={false}
      animate={{ height: compacta ? 36 : 46 }}
      transition={transicao}
      whileTap={reduzir ? undefined : { scale: 0.86 }}
    >
      {ativo && <TabBarIndicator esticar={esticar} />}

      <Box component="span" sx={{ position: 'relative', zIndex: 1, display: 'flex' }}>
        {item.icone}
        {temBadge && (
          <Box
            component="span"
            aria-hidden="true"
            sx={{
              position: 'absolute',
              top: -4,
              right: -6,
              minWidth: 16,
              height: 16,
              px: '4px',
              boxSizing: 'border-box',
              borderRadius: 999,
              bgcolor: '#FF3B30',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              lineHeight: '16px',
              textAlign: 'center',
            }}
          >
            {(item.badge ?? 0) > 9 ? '9+' : item.badge}
          </Box>
        )}
      </Box>

      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{ opacity: compacta ? 0 : 1, height: compacta ? 0 : 8 }}
        transition={transicao}
        style={{
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          fontSize: 8,
          lineHeight: 1,
          fontWeight: ativo ? 600 : 500,
        }}
      >
        {item.rotulo}
      </motion.span>
    </Botao>
  );
}
```

- [ ] **Step 10: A barra**

Create `frontend/src/components/tabbar/LiquidGlassTabBar.tsx`:
```tsx
import { useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import {
  LayoutGroup,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import TabBarItem from './TabBarItem';
import { BRILHO_REPOUSO, posicaoRelativa } from './brilho';
import { useRolagemCompacta } from './useRolagemCompacta';
import { estiloVidro } from './vidro';

export interface ItemTab {
  id: string;
  rotulo: string;
  icone: ReactNode;
  badge?: number;
}

interface Props {
  itens: ItemTab[];
  ativo: string | null;
  aoTrocar: (id: string) => void;
  acaoCentral: ReactNode;
}

const Pilula = styled('div')(({ theme }) => ({
  ...estiloVidro(theme),
  pointerEvents: 'auto',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  padding: 6,
  borderRadius: 28,
}));

export default function LiquidGlassTabBar({ itens, ativo, aoTrocar, acaoCentral }: Props) {
  const compacta = useRolagemCompacta();
  const reduzir = useReducedMotion() ?? false;
  const [trocouPara, setTrocouPara] = useState<string | null>(null);

  const brilhoX = useMotionValue(BRILHO_REPOUSO.x);
  const brilhoY = useMotionValue(BRILHO_REPOUSO.y);
  const x = useSpring(brilhoX, { stiffness: 150, damping: 20 });
  const y = useSpring(brilhoY, { stiffness: 150, damping: 20 });
  const brilho = useMotionTemplate`radial-gradient(140px 90px at ${x}% ${y}%, rgba(255,255,255,.35), transparent 70%)`;

  function moverBrilho(evento: PointerEvent<HTMLDivElement>) {
    const posicao = posicaoRelativa(evento.clientX, evento.clientY, evento.currentTarget.getBoundingClientRect());
    brilhoX.set(posicao.x);
    brilhoY.set(posicao.y);
  }

  function repousarBrilho() {
    brilhoX.set(BRILHO_REPOUSO.x);
    brilhoY.set(BRILHO_REPOUSO.y);
  }

  function selecionar(id: string) {
    setTrocouPara(id);
    aoTrocar(id);
  }

  const meio = Math.ceil(itens.length / 2);
  const renderizar = (item: ItemTab) => (
    <TabBarItem
      key={item.id}
      item={item}
      ativo={item.id === ativo}
      compacta={compacta}
      esticar={trocouPara === item.id}
      aoSelecionar={() => selecionar(item.id)}
    />
  );

  return (
    <Box
      component="nav"
      aria-label="navegação principal"
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 'calc(16px + env(safe-area-inset-bottom))',
        px: 2,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 1100,
      }}
    >
      <Pilula
        onPointerMove={reduzir ? undefined : moverBrilho}
        onPointerLeave={reduzir ? undefined : repousarBrilho}
        onPointerUp={reduzir ? undefined : repousarBrilho}
      >
        {!reduzir && (
          <Box
            aria-hidden="true"
            sx={{ position: 'absolute', inset: 0, borderRadius: 'inherit', overflow: 'hidden', pointerEvents: 'none' }}
          >
            <motion.span
              style={{ position: 'absolute', inset: 0, background: brilho, mixBlendMode: 'overlay' }}
            />
          </Box>
        )}

        <LayoutGroup id="tabbar">
          {itens.slice(0, meio).map(renderizar)}
          {acaoCentral}
          {itens.slice(meio).map(renderizar)}
        </LayoutGroup>
      </Pilula>
    </Box>
  );
}
```

- [ ] **Step 11: Testes, typecheck e build**

Run: `npm test` → PASS.
Run: `npm run typecheck` → sem erros. Se `styled(motion.button)` perder a tipagem de `animate`/`whileTap`, trocar por `const Botao = styled(motion.create('button'))(…)` (mesma API no Motion 13) e rodar de novo.
Run: `npm run build` → sucesso. (A barra ainda não aparece na tela; entra na Task 5.)

- [ ] **Step 12: Commit**

```bash
git add frontend/src/components/tabbar
git commit -m "Adiciona a tab bar Liquid Glass com indicador liquido, brilho e modo compacto"
```

---

### Task 4: Captura global e botão central

**Files:**
- Move: `frontend/src/pages/useEntradaIA.ts` → `frontend/src/captura/useEntradaIA.ts` (conteúdo igual)
- Create: `frontend/src/captura/CapturaContext.tsx`
- Create: `frontend/src/components/captura/MenuCaptura.tsx`
- Modify: `frontend/src/pages/Home.tsx` (arquivo inteiro abaixo)
- Delete: `frontend/src/components/BarraAcoes.tsx`

**Interfaces:**
- Consumes: `useEntradaIA(aoGravar, aoFalhar)` (existente), `EntradaTexto`, `GravadorAudio`, `ConfirmacaoRegistro`, `OverlayCarregando` (existentes), `mensagemDoErro` de `lib/api`, `estiloVidro`, `IconeMais`, `useRolagemCompacta` (Task 3).
- Produces:
  - `export interface Captura { enviarFoto(arquivo: File): void; abrirAudio(): void; abrirTexto(): void; ocupado: boolean; versao: number }`
  - `export function CapturaProvider({ children }: { children: ReactNode }): JSX.Element` — precisa estar **dentro** do `BrowserRouter` (usa `useNavigate`).
  - `export function useCaptura(): Captura`
  - `export default function MenuCaptura(): JSX.Element`

- [ ] **Step 1: Mover o hook de entrada**

Run (na raiz do repo):
```bash
git mv frontend/src/pages/useEntradaIA.ts frontend/src/captura/useEntradaIA.ts
```
O arquivo não importa nada relativo além de `../lib/api` e `../lib/types`, que continuam válidos de `captura/`.

- [ ] **Step 2: Provider de captura**

Create `frontend/src/captura/CapturaContext.tsx`:
```tsx
import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { mensagemDoErro } from '../lib/api';
import { useEntradaIA } from './useEntradaIA';
import EntradaTexto from '../components/EntradaTexto';
import GravadorAudio from '../components/GravadorAudio';
import ConfirmacaoRegistro from '../components/ConfirmacaoRegistro';
import { OverlayCarregando } from '../components/Overlay';

export interface Captura {
  enviarFoto(arquivo: File): void;
  abrirAudio(): void;
  abrirTexto(): void;
  ocupado: boolean;
  /** Incrementa a cada registro gravado — páginas usam como dependência para recarregar. */
  versao: number;
}

const CapturaContexto = createContext<Captura | null>(null);

type Modal = 'texto' | 'audio' | null;

export function CapturaProvider({ children }: { children: ReactNode }) {
  const navegar = useNavigate();
  const [modal, setModal] = useState<Modal>(null);
  const [versao, setVersao] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  const aoGravar = useCallback(async () => {
    setModal(null);
    setVersao((atual) => atual + 1);
    navegar('/');
  }, [navegar]);

  const aoFalhar = useCallback((falha: unknown) => setErro(mensagemDoErro(falha)), []);

  const entrada = useEntradaIA(aoGravar, aoFalhar);

  const valor: Captura = {
    enviarFoto: (arquivo) => void entrada.enviarFoto(arquivo),
    abrirAudio: () => setModal('audio'),
    abrirTexto: () => setModal('texto'),
    ocupado: entrada.textoCarregando !== null,
    versao,
  };

  return (
    <CapturaContexto.Provider value={valor}>
      {children}

      {modal === 'texto' && (
        <EntradaTexto
          aoFechar={() => setModal(null)}
          aoEnviar={(texto) => {
            setModal(null);
            void entrada.enviarTexto(texto);
          }}
        />
      )}

      {modal === 'audio' && (
        <GravadorAudio
          aoFechar={() => setModal(null)}
          aoEnviar={(audio) => {
            setModal(null);
            void entrada.enviarAudio(audio);
          }}
        />
      )}

      {entrada.interpretacao !== null && (
        <ConfirmacaoRegistro
          interpretacao={entrada.interpretacao}
          aoConfirmar={entrada.confirmar}
          aoDescartar={entrada.descartar}
        />
      )}

      {entrada.textoCarregando !== null && <OverlayCarregando texto={entrada.textoCarregando} />}

      <Snackbar
        open={erro !== null}
        autoHideDuration={6000}
        onClose={() => setErro(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setErro(null)}>
          {erro}
        </Alert>
      </Snackbar>
    </CapturaContexto.Provider>
  );
}

export function useCaptura(): Captura {
  const ctx = useContext(CapturaContexto);
  if (ctx === null) throw new Error('useCaptura precisa estar dentro de <CapturaProvider>');
  return ctx;
}
```

- [ ] **Step 3: Botão central com menu foto/áudio/texto**

Create `frontend/src/components/captura/MenuCaptura.tsx`:
```tsx
import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Camera, Mic, Type } from 'lucide-react';
import { useCaptura } from '../../captura/CapturaContext';
import { IconeMais } from '../tabbar/icones';
import { estiloVidro } from '../tabbar/vidro';
import { useRolagemCompacta } from '../tabbar/useRolagemCompacta';
import { paleta } from '../../theme/tema';

const MOLA = { type: 'spring', stiffness: 300, damping: 28 } as const;

const BotaoCentral = styled(motion.button)(({ theme }) => ({
  margin: '0 2px',
  padding: 0,
  border: 'none',
  borderRadius: '50%',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  background: 'linear-gradient(155deg,#14C77A,#0B7A46)',
  boxShadow: '0 8px 20px -6px rgba(11,122,70,.55), inset 0 1.4px 0 rgba(255,255,255,.5)',
  WebkitTapHighlightColor: 'transparent',
  '&:hover': { filter: 'brightness(1.06)' },
  '&:disabled': { cursor: 'progress', opacity: 0.7 },
  '&:focus-visible': { outline: `2px solid ${paleta(theme).primary.main}`, outlineOffset: 3 },
  ...theme.applyStyles('dark', {
    color: '#07130e',
    background: 'linear-gradient(155deg,#47b989,#2c6f55)',
    boxShadow: '0 8px 20px -6px rgba(63,168,124,.5), inset 0 1.4px 0 rgba(255,255,255,.35)',
    '&:hover': { filter: 'brightness(1.08)' },
  }),
}));

const Popover = styled(motion.div)(({ theme }) => ({
  ...estiloVidro(theme),
  position: 'absolute',
  bottom: 'calc(100% + 14px)',
  left: '50%',
  display: 'flex',
  gap: 4,
  padding: 6,
  borderRadius: 22,
}));

const Opcao = styled('button')(({ theme }) => ({
  width: 64,
  minHeight: 58,
  border: 'none',
  borderRadius: 16,
  background: 'none',
  font: 'inherit',
  fontSize: 11,
  fontWeight: 600,
  color: paleta(theme).text.primary,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  '&:hover': { background: 'rgba(0,0,0,.06)' },
  '&:focus-visible': { outline: `2px solid ${paleta(theme).primary.main}` },
  ...theme.applyStyles('dark', { '&:hover': { background: 'rgba(255,255,255,.08)' } }),
}));

export default function MenuCaptura() {
  const { enviarFoto, abrirAudio, abrirTexto, ocupado } = useCaptura();
  const [aberto, setAberto] = useState(false);
  const compacta = useRolagemCompacta();
  const reduzir = useReducedMotion() ?? false;
  const raiz = useRef<HTMLDivElement>(null);
  const seletorFoto = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const aoTocarFora = (evento: PointerEvent) => {
      if (raiz.current !== null && !raiz.current.contains(evento.target as Node)) setAberto(false);
    };
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAberto(false);
    };
    document.addEventListener('pointerdown', aoTocarFora);
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('pointerdown', aoTocarFora);
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto]);

  function escolher(acao: () => void) {
    setAberto(false);
    acao();
  }

  const tamanho = compacta ? 44 : 54;

  return (
    <Box ref={raiz} sx={{ position: 'relative', display: 'flex' }}>
      <AnimatePresence>
        {aberto && (
          <Popover
            role="menu"
            aria-label="registrar por"
            style={{ x: '-50%' }}
            initial={reduzir ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduzir ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.9 }}
            transition={reduzir ? { duration: 0.15 } : { type: 'spring', stiffness: 420, damping: 30 }}
          >
            <Opcao type="button" role="menuitem" onClick={() => escolher(() => seletorFoto.current?.click())}>
              <Camera size={20} aria-hidden="true" />
              foto
            </Opcao>
            <Opcao type="button" role="menuitem" onClick={() => escolher(abrirAudio)}>
              <Mic size={20} aria-hidden="true" />
              áudio
            </Opcao>
            <Opcao type="button" role="menuitem" onClick={() => escolher(abrirTexto)}>
              <Type size={20} aria-hidden="true" />
              texto
            </Opcao>
          </Popover>
        )}
      </AnimatePresence>

      <BotaoCentral
        type="button"
        aria-label="registrar refeição"
        aria-haspopup="menu"
        aria-expanded={aberto}
        disabled={ocupado}
        onClick={() => setAberto((atual) => !atual)}
        initial={false}
        animate={{ width: tamanho, height: tamanho, rotate: aberto ? 45 : 0 }}
        transition={reduzir ? { duration: 0.15 } : MOLA}
        whileTap={reduzir ? undefined : { scale: 0.86 }}
      >
        <IconeMais />
      </BotaoCentral>

      {/* Abre a câmera traseira no celular; no desktop cai no seletor de arquivo. */}
      <input
        ref={seletorFoto}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(evento) => {
          const arquivo = evento.target.files?.[0];
          evento.target.value = ''; // permite escolher a mesma foto de novo
          if (arquivo !== undefined) enviarFoto(arquivo);
        }}
      />
    </Box>
  );
}
```

Observação: `CapturaFoto.tsx` deixa de ser usado depois desta task; quem apaga é a Task 11 do plano D (junto com o fim do CSS puro). Não apagar aqui.

- [ ] **Step 4: Home sem a barra de ações**

Replace `frontend/src/pages/Home.tsx` inteiro:
```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useConfirmacao } from '../components/useConfirmacao';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { dataLonga, ehHoje, hojeISO } from '../lib/format';
import { useAuth } from '../auth/useAuth';
import { useRefeicoes } from '../lib/RefeicoesContext';
import { useCaptura } from '../captura/CapturaContext';
import { useDadosDoDia } from './useDadosDoDia';
import FaixaSemanal from '../components/FaixaSemanal';
import AnelCalorias from '../components/AnelCalorias';
import BarraMacro from '../components/BarraMacro';
import CardAgua from '../components/CardAgua';
import ListaRefeicoes from '../components/ListaRefeicoes';
import Erro from '../components/Erro';

export default function Home() {
  const { perfil, sair } = useAuth();
  const [hoje] = useState(hojeISO);
  const [data, setData] = useState(hoje);
  const [ocupado, setOcupado] = useState(false);
  const { confirmar, elemento: confirmacao } = useConfirmacao();
  const { versao } = useCaptura();

  const dados = useDadosDoDia(data, hoje);
  const { recarregar, reportarErro } = dados;
  const refeicoesCtx = useRefeicoes();

  // Registros novos caem sempre em hoje: volto a Home para hoje quando a captura grava.
  const versaoVista = useRef(versao);
  useEffect(() => {
    if (versao === versaoVista.current) return;
    versaoVista.current = versao;
    setData(hoje);
    void recarregar();
  }, [versao, hoje, recarregar]);

  const comOcupado = useCallback(
    async (acao: () => Promise<unknown>) => {
      setOcupado(true);
      try {
        await acao();
        await recarregar();
      } catch (falha: unknown) {
        reportarErro(falha);
      } finally {
        setOcupado(false);
      }
    },
    [recarregar, reportarErro],
  );

  const adicionarAgua = (ml: number) => void comOcupado(() => api.adicionarAgua(ml));
  const excluirRegistro = (id: string) =>
    void (async () => {
      const ok = await confirmar({
        titulo: 'excluir registro',
        texto: 'o registro sai do resumo do dia e some do feed dos seus amigos.',
        rotulo: 'excluir',
      });
      if (ok) await comOcupado(() => api.excluirRegistro(id));
    })();
  const trocarRefeicao = (id: string, refeicaoId: string) =>
    void comOcupado(() => api.atualizarRegistro(id, { refeicao_id: refeicaoId }));

  const { resumo, registros, semana, carregando, erro } = dados;

  return (
    <>
      <main className="app">
        <header className="topo">
          <h1>{dataLonga(data)}</h1>
          <div className="topo-links">
            <Link className="link-texto" to="/relatorio">
              relatório
            </Link>
            <button type="button" className="link-texto" onClick={sair}>
              sair
            </button>
          </div>
        </header>

        {erro !== null && <Erro mensagem={erro} aoFechar={dados.limparErro} />}
        {refeicoesCtx.erro !== null && (
          <Erro mensagem={refeicoesCtx.erro} aoFechar={refeicoesCtx.limparErro} />
        )}

        {semana !== null && (
          <FaixaSemanal dias={semana.dias} selecionada={data} aoSelecionar={setData} />
        )}

        {resumo === null ? (
          <p className="carregando-pagina">{carregando ? 'carregando o dia...' : 'sem dados'}</p>
        ) : (
          <>
            <section className="cartao">
              <AnelCalorias metrica={resumo.calorias} />
            </section>

            <section className="cartao">
              <h2 className="titulo-secao">macros</h2>
              <BarraMacro rotulo="carboidrato" unidade="g" metrica={resumo.carboidrato_g} />
              <BarraMacro rotulo="proteína" unidade="g" metrica={resumo.proteina_g} />
              <BarraMacro rotulo="gordura" unidade="g" metrica={resumo.gordura_g} />
            </section>

            <CardAgua
              metrica={resumo.agua_ml}
              aoAdicionar={adicionarAgua}
              ocupado={ocupado || !ehHoje(data)}
            />

            {registros !== null && (
              <ListaRefeicoes
                grupos={registros.refeicoes}
                ocupado={ocupado}
                aoExcluir={excluirRegistro}
                aoTrocarRefeicao={trocarRefeicao}
              />
            )}
          </>
        )}

        {perfil !== null && perfil.modo_preguicoso && (
          <p className="mudo" style={{ fontSize: 12, textAlign: 'center' }}>
            modo preguiçoso ligado — registros gravam sem confirmação
          </p>
        )}
      </main>

      {confirmacao}
    </>
  );
}
```
(Os links `amigos`, `grupos` e `perfil` do topo saem porque viraram abas; `sair` fica aqui até o plano B levá-lo para o perfil.)

- [ ] **Step 5: Apagar a barra antiga**

Run: `git rm frontend/src/components/BarraAcoes.tsx`

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: sem erros de tipo. (Em runtime a Home ainda quebra com "useCaptura precisa estar dentro de <CapturaProvider>" até a Task 5 montar o provider — não é erro de tipo.) Se `lucide-react` 1.x não exportar `Type`, usar o ícone de texto que existir em `node_modules/lucide-react/dist/lucide-react.d.ts` (ex.: `LetterText`) e rodar de novo.
Run: `npm test` → PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/captura frontend/src/components/captura frontend/src/pages/Home.tsx
git commit -m "Move a captura para um provider global e cria o menu do botao central"
```
(O app ainda quebra em runtime até a Task 5 montar o provider — as duas tasks vão no mesmo PR.)

---

### Task 5: Casca com tab bar e rotas novas

**Files:**
- Create: `frontend/src/layout/abas.ts`
- Test: `frontend/src/layout/abas.test.ts`
- Create: `frontend/src/layout/Casca.tsx`
- Create: `frontend/src/pages/TelaProvisoria.tsx`
- Create: `frontend/src/pages/SocialProvisorio.tsx`
- Modify: `frontend/src/App.tsx` (arquivo inteiro abaixo)

**Interfaces:**
- Consumes: `LiquidGlassTabBar`, `ItemTab`, ícones (Task 3); `CapturaProvider`, `MenuCaptura` (Task 4); `api.pedidos()` (existente).
- Produces:
  - `export type IdAba = 'inicio' | 'social' | 'calendario' | 'perfil'`
  - `export const ROTA_DA_ABA: Record<IdAba, string>`
  - `export function abaDaRota(caminho: string): IdAba | null`
  - `export function ehIdAba(valor: string): valor is IdAba`
  - `export default function Casca(): JSX.Element` — rota-layout (`<Outlet/>` + tab bar).
  - `TelaProvisoria({ titulo })` e `SocialProvisorio` — **provisórias**: o plano C troca `/relatorio`, o plano B troca `/calendario`, o plano D troca `/social`. Cada um desses planos apaga o provisório correspondente; o último a remover um uso apaga o arquivo.

- [ ] **Step 1: Testes do mapeamento de abas (falham)**

Create `frontend/src/layout/abas.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { abaDaRota, ehIdAba, ROTA_DA_ABA } from './abas';

describe('abaDaRota', () => {
  it('início só na raiz', () => {
    expect(abaDaRota('/')).toBe('inicio');
  });

  it('social cobre grupos e perfil público', () => {
    expect(abaDaRota('/social')).toBe('social');
    expect(abaDaRota('/grupos/abc')).toBe('social');
    expect(abaDaRota('/u/123')).toBe('social');
  });

  it('calendário e perfil', () => {
    expect(abaDaRota('/calendario')).toBe('calendario');
    expect(abaDaRota('/perfil')).toBe('perfil');
    expect(abaDaRota('/perfil/metas')).toBe('perfil');
  });

  it('relatório não marca aba', () => {
    expect(abaDaRota('/relatorio')).toBeNull();
    expect(abaDaRota('/qualquer')).toBeNull();
  });

  it('não confunde prefixos', () => {
    expect(abaDaRota('/perfilx')).toBeNull();
    expect(abaDaRota('/grupos')).toBeNull();
  });
});

describe('ROTA_DA_ABA e ehIdAba', () => {
  it('ida e volta', () => {
    for (const id of Object.keys(ROTA_DA_ABA)) {
      expect(ehIdAba(id)).toBe(true);
      if (ehIdAba(id)) expect(abaDaRota(ROTA_DA_ABA[id])).toBe(id);
    }
    expect(ehIdAba('relatorio')).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL — `./abas` não resolve.

- [ ] **Step 3: Implementar `abas.ts`**

Create `frontend/src/layout/abas.ts`:
```ts
export type IdAba = 'inicio' | 'social' | 'calendario' | 'perfil';

export const ROTA_DA_ABA: Record<IdAba, string> = {
  inicio: '/',
  social: '/social',
  calendario: '/calendario',
  perfil: '/perfil',
};

const dentroDe = (caminho: string, base: string) => caminho === base || caminho.startsWith(`${base}/`);

export function abaDaRota(caminho: string): IdAba | null {
  if (caminho === '/') return 'inicio';
  if (dentroDe(caminho, '/social') || caminho.startsWith('/grupos/') || caminho.startsWith('/u/')) return 'social';
  if (dentroDe(caminho, '/calendario')) return 'calendario';
  if (dentroDe(caminho, '/perfil')) return 'perfil';
  return null;
}

export function ehIdAba(valor: string): valor is IdAba {
  return valor in ROTA_DA_ABA;
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Casca**

Create `frontend/src/layout/Casca.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import LiquidGlassTabBar from '../components/tabbar/LiquidGlassTabBar';
import type { ItemTab } from '../components/tabbar/LiquidGlassTabBar';
import { IconeCalendario, IconeInicio, IconePerfil, IconeSocial } from '../components/tabbar/icones';
import MenuCaptura from '../components/captura/MenuCaptura';
import { api } from '../lib/api';
import { abaDaRota, ehIdAba, ROTA_DA_ABA } from './abas';

export default function Casca() {
  const { pathname } = useLocation();
  const navegar = useNavigate();
  const [pedidosRecebidos, setPedidosRecebidos] = useState(0);
  const emSocial = pathname.startsWith('/social');

  useEffect(() => {
    let ativo = true;
    api
      .pedidos()
      .then((pedidos) => {
        if (ativo) setPedidosRecebidos(pedidos.recebidos.length);
      })
      .catch(() => {
        // O badge é só um aviso: se a chamada falhar a navegação continua funcionando.
      });
    return () => {
      ativo = false;
    };
  }, [emSocial]);

  const itens: ItemTab[] = [
    { id: 'inicio', rotulo: 'início', icone: <IconeInicio /> },
    { id: 'social', rotulo: 'social', icone: <IconeSocial />, badge: pedidosRecebidos },
    { id: 'calendario', rotulo: 'calendário', icone: <IconeCalendario /> },
    { id: 'perfil', rotulo: 'perfil', icone: <IconePerfil /> },
  ];

  return (
    <>
      <Box sx={{ pb: 'calc(110px + env(safe-area-inset-bottom))' }}>
        <Outlet />
      </Box>
      <LiquidGlassTabBar
        itens={itens}
        ativo={abaDaRota(pathname)}
        aoTrocar={(id) => {
          if (ehIdAba(id)) navegar(ROTA_DA_ABA[id]);
        }}
        acaoCentral={<MenuCaptura />}
      />
    </>
  );
}
```

- [ ] **Step 6: Telas provisórias**

Create `frontend/src/pages/TelaProvisoria.tsx`:
```tsx
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

/** Provisória: planos B (calendário) e C (relatório) substituem esta tela e apagam o arquivo. */
export default function TelaProvisoria({ titulo }: { titulo: string }) {
  return (
    <Box component="main" sx={{ px: '22px', pt: '14px' }}>
      <Typography
        component="h1"
        sx={{ m: 0, fontSize: 22, fontWeight: 700, lineHeight: 1, letterSpacing: '-.02em' }}
      >
        {titulo}
      </Typography>
    </Box>
  );
}
```

Create `frontend/src/pages/SocialProvisorio.tsx`:
```tsx
import { useSearchParams } from 'react-router-dom';
import Amigos from './Amigos';
import Grupos from './Grupos';

/** Provisório: o plano D troca por Social.tsx (amigos · grupos · feed) e apaga este arquivo. */
export default function SocialProvisorio() {
  const [parametros] = useSearchParams();
  return parametros.get('aba') === 'grupos' ? <Grupos /> : <Amigos />;
}
```

- [ ] **Step 7: Rotas**

Replace `frontend/src/App.tsx` inteiro:
```tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import { AuthProvider } from './auth/AuthContext';
import { useAuth } from './auth/useAuth';
import { RefeicoesProvider } from './lib/RefeicoesContext';
import { CapturaProvider } from './captura/CapturaContext';
import Casca from './layout/Casca';
import Login from './pages/Login';
import Home from './pages/Home';
import PerfilPage from './pages/Perfil';
import GrupoPage from './pages/Grupo';
import PerfilPublico from './pages/PerfilPublico';
import TelaProvisoria from './pages/TelaProvisoria';
import SocialProvisorio from './pages/SocialProvisorio';

function Protegida({ children }: { children: ReactElement }) {
  const { perfil, carregando } = useAuth();
  if (carregando) return <p className="carregando-pagina">carregando...</p>;
  if (perfil === null) return <Navigate to="/login" replace />;
  return children;
}

function Rotas() {
  const { perfil, carregando } = useAuth();
  return (
    <Routes>
      <Route
        path="/login"
        element={carregando || perfil === null ? <Login /> : <Navigate to="/" replace />}
      />

      <Route
        element={
          <Protegida>
            <CapturaProvider>
              <Casca />
            </CapturaProvider>
          </Protegida>
        }
      >
        <Route index element={<Home />} />
        <Route path="relatorio" element={<TelaProvisoria titulo="relatório" />} />
        <Route path="calendario" element={<TelaProvisoria titulo="calendário" />} />
        <Route path="social" element={<SocialProvisorio />} />
        <Route path="grupos/:id" element={<GrupoPage />} />
        <Route path="u/:id" element={<PerfilPublico />} />
        <Route path="perfil" element={<PerfilPage />} />
      </Route>

      <Route path="/amigos" element={<Navigate to="/social?aba=amigos" replace />} />
      <Route path="/grupos" element={<Navigate to="/social?aba=grupos" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RefeicoesProvider>
        <BrowserRouter>
          <Rotas />
        </BrowserRouter>
      </RefeicoesProvider>
    </AuthProvider>
  );
}
```
Os links internos das páginas antigas para `/amigos` e `/grupos` continuam funcionando pelos redirects.

- [ ] **Step 8: Verificação completa**

Run: `npm test` → PASS.
Run: `npm run typecheck` → sem erros.
Run: `npm run build` → sucesso; anotar o tamanho do `index-*.js` gzip no commit.

- [ ] **Step 9: Verificação no navegador (golden path e bordas)**

Com backend (`backend/`: `npm run dev`) e frontend (`npm run dev`) rodando, abrir `http://localhost:5173` em viewport de celular (DevTools, 390×844):
1. Login → cai em `/` com a pílula de vidro flutuando, `início` ativo em verde.
2. Tocar `calendário` → indicador escorre e estica; título provisório `calendário`. `perfil` → página de perfil atual. `social` → lista de amigos; `/social?aba=grupos` → grupos.
3. Abrir `/amigos` e `/grupos` → redirecionam para `/social?aba=…` com `social` ativo; `/grupos/<id>` e `/u/<id>` mantêm `social` ativo; `/relatorio` sem aba ativa.
4. Em `/` rolar para baixo → barra compacta (sem rótulos, botão central menor); rolar para cima → volta.
5. Passar o mouse sobre a pílula → reflexo segue o cursor; sair → volta ao topo.
6. Botão `+` → menu `foto · áudio · texto` aparece acima; tocar fora ou `Esc` fecha. `texto` → modal atual; enviar "arroz e feijão" → overlay "interpretando o texto..." → confirmação → confirmar → volta para `/` com o registro na lista.
7. Estando em `/perfil`, registrar por texto → após confirmar navega para `/` já atualizado.
8. Com outra conta mandar pedido de amizade → badge vermelho no `social` depois de entrar/sair de `/social`.
9. DevTools → Rendering → `prefers-color-scheme: light` e `dark` → vidro, indicador e botão central trocam de cor; `prefers-reduced-motion: reduce` → sem reflexo, sem esticada.
10. Desligar o backend e clicar em `social` → barra continua navegável, sem badge, sem erro na tela.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/layout frontend/src/pages/TelaProvisoria.tsx frontend/src/pages/SocialProvisorio.tsx frontend/src/App.tsx
git commit -m "Monta a casca com a tab bar e reorganiza as rotas do app"
```

---

### Task 6: Documentação (CLAUDE.md e docs/design.md)

**Files:**
- Modify: `CLAUDE.md` (linha da stack, comandos do frontend, convenções)
- Modify: `docs/design.md` (arquivo inteiro)

**Interfaces:**
- Consumes: decisões do spec.
- Produces: documentação de referência que os planos B–F seguem.

- [ ] **Step 1: CLAUDE.md — stack**

Em `CLAUDE.md`, trocar a linha:
```
TypeScript · React 19 + Vite (SPA) · Express 5 + `pg` (PostgreSQL 16) · Vitest ·
Docker Compose · Gemini ou OpenAI (visão, chat, áudio) · npm
```
por:
```
TypeScript · React 19 + Vite (SPA) · MUI 9 + Emotion · Motion (`motion/react`) · lucide-react ·
Express 5 + `pg` (PostgreSQL 16) · Vitest · Docker Compose · Gemini ou OpenAI (visão, chat, áudio) · npm
```

- [ ] **Step 2: CLAUDE.md — comandos do frontend**

Na seção "Frontend (`frontend/`)", depois de `- Typecheck: \`npm run typecheck\``, acrescentar:
```
- Test: `npm test`
```

- [ ] **Step 3: CLAUDE.md — convenção de UI**

Na lista "Convenções", depois do item de testes com Vitest, acrescentar:
```
- Frontend estilizado só com MUI (`sx`/`styled`) e o tema de `frontend/src/theme/tema.ts`;
  cores vêm do tema (`paleta(theme)`), nunca hex solto fora dele. Animação com Motion,
  respeitando `useReducedMotion`. Sem CSS puro novo.
```

- [ ] **Step 4: Reescrever `docs/design.md`**

Replace `docs/design.md` inteiro:
````markdown
# Direção visual — dieta-preguicoso

Design "Sistema" (handoff `design_handoff_calendario_agua`), claro e escuro. Números grandes,
listas com hairline, zero ilustração. Especificação completa:
[`docs/superpowers/specs/2026-09-16-redesign-liquid-glass-design.md`](superpowers/specs/2026-09-16-redesign-liquid-glass-design.md).

## Base

- **MUI 9** com `cssVariables` e `colorSchemes` (`frontend/src/theme/tema.ts`). Todas as cores
  saem do tema; em `sx`/`styled` use `paleta(theme)` para ganhar as variáveis `--mui-*` que
  trocam com o esquema, ou `theme.applyStyles('dark', …)`.
- **Tema**: segue o sistema por padrão; o perfil permite forçar `claro`/`escuro`
  (`useColorScheme`, salvo em `localStorage['dieta.tema']`). O `index.html` aplica
  `data-esquema` antes do React para não piscar.
- **Fonte**: Plus Jakarta Sans (variável, self-hosted), pesos 400–800. Números com `tabular-nums`.
- **Animação**: Motion (`motion/react`). Toda animação respeita `useReducedMotion`.

## Tokens

| Token | Claro | Escuro |
|---|---|---|
| fundo | `#FFFFFF` | `#0d0f12` |
| texto | `#14120F` | `#e7eaee` |
| texto mudo | `#63635D` | `#8a919d` |
| fraco | `#B8B4AA` | `#525a66` |
| hairline | `#F0EEE9` | `#262b34` |
| borda | `#E6E4DF` | `#262b34` |
| cartão | `#F7F6F3` | `#15181d` |
| marca (CTA) | `#0B7A46` | `#3fa87c` |
| erro/destrutivo | `#FF2146` | `#e5837a` |
| status meta · sobrou · passou · vazio | `#0CA85D` · `#2B87E3` · `#FF2146` · `#E6E4DF` | `#3fa87c` · `#4B93D6` · `#e5837a` · `#33383f` |
| macro carbo · proteína · gordura | `#2B87E3` · `#9F43CC` · `#EBA10F` | `#4B93D6` · `#A06BC4` · `#D99B2E` |

Pílulas de status, gradiente da água e cor por refeição: ver o spec.
Raios: cartões/pílulas 11–14 px, CTA 13 px, tab bar 28 px. Rótulo de seção: 600 9.5px,
maiúsculas, `letter-spacing .16em`, texto mudo. Título de tela: 700 22px.

## Navegação

Tab bar **Liquid Glass** flutuante (`frontend/src/components/tabbar/`):
`início · social · [+] · calendário · perfil`. Vidro com blur + saturate, borda clara de 1 px,
sombra, reflexo que segue o ponteiro, indicador que escorre entre abas (`layoutId` + esticada),
encolhe ao rolar para baixo e volta ao rolar para cima. O `+` abre `foto · áudio · texto`.
Login, detalhe de item, subtelas de perfil e a confirmação da IA ficam sem a barra.

## Status do dia (cores)

`na_meta` → meta · `abaixo` → sobrou · `acima` → passou · `sem_registro` e dias futuros → vazio
(`frontend/src/lib/visual.ts`).

## Estados

- **Carregando a IA**: overlay com texto honesto (`analisando a foto...`) e pulso sutil.
- **Vazio**: frase curta em texto mudo, sem ilustração.
- **Erro**: mensagem da API visível (alerta no topo), nunca stack trace.

## Acessibilidade

Contraste mínimo 4.5:1 no texto. Alvos de toque ≥ 44 px (itens da tab bar 50×46).
Barras com `role="progressbar"` e `aria-valuenow`. Foco visível na cor da marca.
Tab bar em `<nav aria-label="navegação principal">`, aba ativa com `aria-current="page"`.
````

- [ ] **Step 5: Verificar e commitar**

Run: `git diff --stat CLAUDE.md docs/design.md` → só esses dois arquivos.
```bash
git add CLAUDE.md docs/design.md
git commit -m "Atualiza CLAUDE.md e design.md para MUI, Motion e a tab bar Liquid Glass"
```
