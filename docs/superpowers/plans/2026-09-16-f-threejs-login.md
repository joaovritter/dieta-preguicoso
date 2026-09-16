# Plano F — Fundo "vidro líquido" em Three.js no Login (opcional) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Modelo:** cada tarefa é implementada por subagente **Sonnet** (`model: "sonnet"`); a sessão Opus só coordena e revisa. Não executar antes de o usuário liberar.

**Goal:** Colocar atrás da headline do Login um fundo animado de "vidro líquido" (shader de ruído em verde da marca), carregado sob demanda, sem pesar no bundle inicial nem em nenhuma outra tela.

**Architecture:** `FundoLogin` decide entre o fundo animado (`FundoLiquido`, importado com `React.lazy`) e um gradiente estático feito com `sx` do MUI. A decisão vem de uma função pura (`deveAnimarFundo`) alimentada por detecção de WebGL e por `prefers-reduced-motion`. `FundoLiquido` é um `<Canvas>` do React Three Fiber com um plano de tela cheia e um `ShaderMaterial` com ruído simplex. Ele renderiza sob demanda a ~30 fps e lê o tema claro/escuro do MUI.

**Tech Stack:** React 19, MUI 9 (`useColorScheme`, `useMediaQuery`, `Box`), `three` ^0.186.0, `@react-three/fiber` ^9.7.0, `@types/three` ^0.186.0, Vitest 5, Vite 7.

**Spec:** `docs/superpowers/specs/2026-09-16-redesign-liquid-glass-design.md` (seção "Plano F — Three.js (opcional)")

## Global Constraints

- Plano **opcional**: se o usuário desistir, pule-o inteiro. Nada fora do Login depende dele.
- Pré-condição: planos A e B concluídos. `frontend/src/pages/Login.tsx` já é uma página MUI cujo elemento raiz é um `Box` (ou equivalente) de altura cheia. Se a raiz não tiver `position: relative`, este plano adiciona.
- Ponto de inserção: `<FundoLogin />` é o **primeiro filho da raiz da página, posicionado de forma absoluta atrás do conteúdo** (`position: absolute; inset: 0; z-index: 0; pointer-events: none`). O conteúdo existente fica com `position: relative; z-index: 1`.
- Versões: `three` `^0.186.0`, `@react-three/fiber` `^9.7.0`, `@types/three` `^0.186.0` (dev).
- Só carrega Three se houver WebGL **e** `prefers-reduced-motion: no-preference`; senão, gradiente estático.
- Verde da marca: claro `#0CA85D`, escuro `#3fa87c` (`primary.vivo` do spec). Opacidade baixa (máx. 0.18 no claro, 0.22 no escuro).
- Máx. ~30 fps, `dpr={[1, 1.5]}`.
- `three` precisa ir para um chunk separado. O bundle inicial (`index-*.js`) não pode conter Three.
- Sem CSS puro novo: estilos via `sx`. Comentários só quando o porquê não for óbvio.
- Comandos (em `frontend/`): `npm test`, `npm run typecheck`, `npm run build`.

---

### Task 1: Dependências + detecção de suporte (função pura testada)

**Files:**
- Modify: `frontend/package.json` (dependências)
- Create: `frontend/src/components/fundo/suporteWebgl.ts`
- Test: `frontend/src/components/fundo/suporteWebgl.test.ts`

**Interfaces:**
- Consumes: nada de tasks anteriores (Vitest já configurado pelo plano A, `npm test` = `vitest run`).
- Produces:
  - `export function temWebgl(criarCanvas?: () => { getContext(tipo: string): unknown }): boolean`
  - `export function deveAnimarFundo(temWebgl: boolean, reduzMovimento: boolean): boolean`

- [ ] **Step 1: Instalar dependências**

Run (em `frontend/`):
```bash
npm install three@^0.186.0 @react-three/fiber@^9.7.0
npm install -D @types/three@^0.186.0
```
Expected: `package.json` passa a listar `three`, `@react-three/fiber` em `dependencies` e `@types/three` em `devDependencies`, sem erro de peer dependency com React 19.

- [ ] **Step 2: Escrever o teste que falha**

`frontend/src/components/fundo/suporteWebgl.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { deveAnimarFundo, temWebgl } from './suporteWebgl';

describe('deveAnimarFundo', () => {
  it('anima só com WebGL e sem pedido de menos movimento', () => {
    expect(deveAnimarFundo(true, false)).toBe(true);
  });

  it('não anima sem WebGL', () => {
    expect(deveAnimarFundo(false, false)).toBe(false);
  });

  it('não anima quando o sistema pede menos movimento', () => {
    expect(deveAnimarFundo(true, true)).toBe(false);
    expect(deveAnimarFundo(false, true)).toBe(false);
  });
});

describe('temWebgl', () => {
  it('true quando o canvas devolve contexto webgl2', () => {
    const canvas = { getContext: (tipo: string) => (tipo === 'webgl2' ? {} : null) };
    expect(temWebgl(() => canvas)).toBe(true);
  });

  it('true quando só existe webgl 1', () => {
    const canvas = { getContext: (tipo: string) => (tipo === 'webgl' ? {} : null) };
    expect(temWebgl(() => canvas)).toBe(true);
  });

  it('false quando nenhum contexto existe', () => {
    expect(temWebgl(() => ({ getContext: () => null }))).toBe(false);
  });

  it('false quando criar o canvas ou o contexto explode', () => {
    expect(
      temWebgl(() => {
        throw new Error('sem DOM');
      }),
    ).toBe(false);
  });

  it('false fora do navegador (sem document)', () => {
    expect(temWebgl()).toBe(false);
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test -- src/components/fundo/suporteWebgl.test.ts`
Expected: FAIL com `Failed to resolve import "./suporteWebgl"`.

- [ ] **Step 4: Implementar**

`frontend/src/components/fundo/suporteWebgl.ts`:
```ts
type FabricaCanvas = () => { getContext(tipo: string): unknown };

const canvasDoDocumento: FabricaCanvas = () => {
  if (typeof document === 'undefined') throw new Error('sem document');
  return document.createElement('canvas');
};

export function temWebgl(criarCanvas: FabricaCanvas = canvasDoDocumento): boolean {
  try {
    const canvas = criarCanvas();
    return canvas.getContext('webgl2') != null || canvas.getContext('webgl') != null;
  } catch {
    return false;
  }
}

export function deveAnimarFundo(temWebgl: boolean, reduzMovimento: boolean): boolean {
  return temWebgl && !reduzMovimento;
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test -- src/components/fundo/suporteWebgl.test.ts`
Expected: PASS, 8 testes.

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/components/fundo/suporteWebgl.ts frontend/src/components/fundo/suporteWebgl.test.ts
git commit -m "Adiciona three/r3f e detecção de suporte para o fundo do login"
```

---

### Task 2: `FundoLiquido` (shader R3F), `FundoLogin` (lazy + fallback) e montagem no Login

**Files:**
- Create: `frontend/src/components/fundo/FundoLiquido.tsx`
- Create: `frontend/src/components/fundo/FundoLogin.tsx`
- Modify: `frontend/src/pages/Login.tsx` (raiz da página: primeiro filho + `position: relative`)

**Interfaces:**
- Consumes: `temWebgl()`, `deveAnimarFundo(temWebgl, reduzMovimento)` da Task 1. `useColorScheme()` do MUI (plano A configurou `colorSchemes` + `cssVariables`).
- Produces:
  - `export default function FundoLiquido(): JSX.Element` (export default, exigido pelo `React.lazy`)
  - `export default function FundoLogin(): JSX.Element`

- [ ] **Step 1: Criar o fundo animado**

`frontend/src/components/fundo/FundoLiquido.tsx`:
```tsx
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useColorScheme } from '@mui/material/styles';
import { Color, type ShaderMaterial } from 'three';

const VERDE = { light: '#0CA85D', dark: '#3fa87c' } as const;
const OPACIDADE = { light: 0.18, dark: 0.22 } as const;
const INTERVALO_QUADRO_MS = 1000 / 30;

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Ruído simplex 2D de Ashima Arts / Stefan Gustavson (licença MIT).
const fragment = /* glsl */ `
  precision mediump float;
  uniform float uTempo;
  uniform vec3 uCor;
  uniform float uOpacidade;
  uniform vec2 uProporcao;
  varying vec2 vUv;

  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 p = vUv * uProporcao * 1.6;
    float t = uTempo * 0.06;
    float n = snoise(p + vec2(t, -t * 0.7));
    n += 0.5 * snoise(p * 2.1 - vec2(t * 1.3, t));
    float onda = smoothstep(-0.2, 1.1, n);
    float realce = smoothstep(0.55, 0.95, n) * 0.6;
    // Mais forte no topo, onde fica a headline; some em direção ao formulário.
    float mascara = smoothstep(0.0, 0.85, vUv.y);
    float alpha = (onda * 0.7 + realce) * uOpacidade * mascara;
    gl_FragColor = vec4(uCor + realce * 0.25, alpha);
  }
`;

function modoResolvido(mode: string | undefined, systemMode: string | undefined): 'light' | 'dark' {
  const efetivo = mode === 'system' ? systemMode : mode;
  return efetivo === 'dark' ? 'dark' : 'light';
}

function Plano({ modo }: { modo: 'light' | 'dark' }) {
  const material = useRef<ShaderMaterial>(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTempo: { value: 0 },
      uCor: { value: new Color(VERDE.light) },
      uOpacidade: { value: OPACIDADE.light },
      uProporcao: { value: [1, 1] as [number, number] },
    }),
    [],
  );

  useEffect(() => {
    uniforms.uCor.value.set(VERDE[modo]);
    uniforms.uOpacidade.value = OPACIDADE[modo];
  }, [modo, uniforms]);

  useEffect(() => {
    const maior = Math.max(size.width, size.height, 1);
    uniforms.uProporcao.value = [size.width / maior, size.height / maior];
  }, [size.width, size.height, uniforms]);

  useFrame(({ clock }) => {
    if (material.current) material.current.uniforms.uTempo.value = clock.elapsedTime;
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

// frameloop="demand" + invalidate a cada ~33 ms segura o fundo em ~30 fps.
function Relogio30fps() {
  const invalidate = useThree((estado) => estado.invalidate);
  useEffect(() => {
    const id = window.setInterval(() => invalidate(), INTERVALO_QUADRO_MS);
    return () => window.clearInterval(id);
  }, [invalidate]);
  return null;
}

export default function FundoLiquido() {
  const { mode, systemMode } = useColorScheme();
  const modo = modoResolvido(mode, systemMode);

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <Relogio30fps />
      <Plano modo={modo} />
    </Canvas>
  );
}
```

- [ ] **Step 2: Criar o wrapper com lazy + fallback**

`frontend/src/components/fundo/FundoLogin.tsx`:
```tsx
import { Suspense, lazy, useMemo } from 'react';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { deveAnimarFundo, temWebgl } from './suporteWebgl';

const FundoLiquido = lazy(() => import('./FundoLiquido'));

function GradienteEstatico() {
  return (
    <Box
      sx={(theme) => ({
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(120% 60% at 20% 0%, rgba(12,168,93,.14), transparent 60%), radial-gradient(90% 50% at 90% 10%, rgba(12,168,93,.08), transparent 70%)',
        ...theme.applyStyles('dark', {
          background:
            'radial-gradient(120% 60% at 20% 0%, rgba(63,168,124,.18), transparent 60%), radial-gradient(90% 50% at 90% 10%, rgba(63,168,124,.10), transparent 70%)',
        }),
      })}
    />
  );
}

export default function FundoLogin() {
  const reduzMovimento = useMediaQuery('(prefers-reduced-motion: reduce)', { noSsr: true });
  const webgl = useMemo(() => temWebgl(), []);
  const animar = deveAnimarFundo(webgl, reduzMovimento);

  return (
    <Box
      aria-hidden="true"
      sx={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
    >
      {animar ? (
        <Suspense fallback={<GradienteEstatico />}>
          <FundoLiquido />
        </Suspense>
      ) : (
        <GradienteEstatico />
      )}
    </Box>
  );
}
```

- [ ] **Step 3: Montar no Login**

Em `frontend/src/pages/Login.tsx`, adicionar o import no topo:
```tsx
import FundoLogin from '../components/fundo/FundoLogin';
```

Na raiz da página (o `Box` de altura cheia criado no plano B), garantir `position: 'relative'` e `overflow: 'hidden'` no `sx`. Colocar `<FundoLogin />` como **primeiro filho** e envolver o conteúdo existente num `Box` acima dele. A forma final da raiz fica assim (mantendo todo o conteúdo que o plano B já colocou dentro do segundo `Box`):
```tsx
<Box sx={{ /* estilos do plano B */ position: 'relative', overflow: 'hidden' }}>
  <FundoLogin />
  <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100%' }}>
    {/* conteúdo atual do Login: rótulo, headline, campos, segmentado, CTA */}
  </Box>
</Box>
```
Se a raiz do plano B já for `display: flex` com `justifyContent: 'space-between'`, mova esses dois estilos para o `Box` interno, para o layout não mudar.

- [ ] **Step 4: Typecheck e testes**

Run: `npm run typecheck && npm test`
Expected: sem erros de tipo; todos os testes passam (incluindo os 8 da Task 1).

- [ ] **Step 5: Conferir no navegador**

Run: `npm run dev` e abra `/login` (deslogado).
Expected:
- Tema claro: manchas verdes suaves se movendo devagar atrás da headline, somem em direção ao formulário; texto e campos legíveis e clicáveis.
- Troque o sistema para escuro (ou use o seletor de tema, se estiver logado antes): o verde muda para `#3fa87c`.
- DevTools › Rendering › "Emulate CSS prefers-reduced-motion: reduce" e recarregue: aparece só o gradiente estático, e a aba Network **não** baixa o chunk de Three.
- DevTools › Network: sem reduced-motion, um chunk extra (`FundoLiquido-*.js`) é baixado só em `/login`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/fundo/FundoLiquido.tsx frontend/src/components/fundo/FundoLogin.tsx frontend/src/pages/Login.tsx
git commit -m "Fundo de vidro líquido em Three.js no login, lazy e com fallback estático"
```

---

### Task 3: Garantir que Three fica fora do bundle inicial

**Files:**
- Nenhum arquivo novo se a verificação passar. Se falhar, Modify: o import que puxou `three` para o chunk inicial (causa mais provável: algum arquivo importando `FundoLiquido` ou `three` de forma estática).

**Interfaces:**
- Consumes: `FundoLogin` e `FundoLiquido` da Task 2.
- Produces: nada.

- [ ] **Step 1: Build**

Run (em `frontend/`): `npm run build`
Expected: build verde. A saída do Vite lista um chunk `dist/assets/FundoLiquido-<hash>.js` bem maior que os outros (Three + R3F, várias centenas de KB sem gzip).

- [ ] **Step 2: Conferir os nomes dos chunks**

Run (PowerShell, em `frontend/`):
```powershell
Get-ChildItem dist/assets/*.js | Sort-Object Length -Descending | Select-Object Name, @{n='KB';e={[math]::Round($_.Length/1KB)}}
```
Expected: existe `FundoLiquido-*.js` separado de `index-*.js`.

- [ ] **Step 3: Conferir que o chunk inicial não contém Three**

Run (PowerShell, em `frontend/`):
```powershell
$inicial = Get-ChildItem dist/assets/index-*.js
Select-String -Path $inicial -Pattern 'WebGLRenderer|ShaderMaterial' -SimpleMatch -List
Select-String -Path dist/assets/FundoLiquido-*.js -Pattern 'WebGLRenderer' -SimpleMatch -List
```
Expected: o primeiro `Select-String` não imprime nada (o chunk inicial está limpo). O segundo imprime uma linha (Three está no chunk lazy).

Também confira que `dist/index.html` só referencia `index-*.js` em `<script type="module">`, não `FundoLiquido-*.js`:
```powershell
Select-String -Path dist/index.html -Pattern 'FundoLiquido' -SimpleMatch
```
Expected: nenhuma saída.

- [ ] **Step 4: Se falhar, corrigir e repetir**

Se `WebGLRenderer` aparecer em `index-*.js`, procure imports estáticos:
```powershell
Select-String -Path src -Recurse -Include *.ts,*.tsx -Pattern "from 'three'","from '@react-three/fiber'","./FundoLiquido'" -SimpleMatch
```
Expected: só `src/components/fundo/FundoLiquido.tsx` importa `three`/`@react-three/fiber`, e só `FundoLogin.tsx` referencia `./FundoLiquido`, via `lazy(() => import('./FundoLiquido'))`. Qualquer outro import estático deve ser removido. Depois repita os Steps 1–3.

- [ ] **Step 5: Commit (só se houve correção)**

```bash
git add <arquivos corrigidos>
git commit -m "Mantém three fora do bundle inicial"
```
