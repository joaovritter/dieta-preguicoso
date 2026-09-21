# Plano I — Social redesenhado: feed primeiro, menu por ícone, busca de amigos

> **Modelo:** cada tarefa é implementada por subagente **Sonnet**; a sessão coordena e revisa.

**Goal:** A tela Social passa a abrir no feed (não mais em "amigos"), com um menu compacto de
ícones (feed / grupos / amigos — visualmente distinguíveis, rótulo aparece embaixo do ícone
selecionado, igual à tab bar) e uma busca que filtra a lista de amigos por nome, com uma barra que
encolhe/expande com a mesma linguagem visual de vidro que já existe na tab bar. Os links
"relatório" e "amigos" somem do topo da tela Início — já dá pra chegar em relatório pelo
calendário, e em social pela própria tab bar.

**Contexto levantado no código atual:**
- `frontend/src/pages/Home.tsx`: os links ficam na prop `direita` de `TituloTela`, dois
  `Box component={Link}` simples (`/relatorio` e `/social`).
- `frontend/src/pages/Social.tsx`: hoje usa `Segmentado` (texto, não ícone) com 3 abas
  (`amigos`/`grupos`/`feed`), padrão `amigos`, aba na URL via `?aba=`.
- `frontend/src/pages/social/AbaAmigos.tsx`: carrega `api.amigos()` + `api.pedidos()`; **não tem
  campo de busca hoje** — decisão confirmada: a busca é só um filtro client-side sobre a lista já
  carregada de amigos, sem endpoint novo (sem risco de expor busca de qualquer usuário).
- `frontend/src/components/social/Segmentado.tsx`: controle segmentado genérico atual, baseado em
  texto — este plano não o remove do projeto (ainda é usado em `Perfil.tsx`), só troca de uso na
  tela Social por um novo componente de ícones.
- Ícones existentes em `frontend/src/components/tabbar/icones.tsx`: `IconeSocial` (dois círculos +
  arcos, representa "social" como um todo na tab bar principal) — não serve pra diferenciar
  feed/grupos/amigos entre si, precisa de três ícones novos e visualmente distintos.
- `frontend/src/components/tabbar/TabBarItem.tsx`/`TabBarIndicator.tsx`: referência de como o
  rótulo aparece/some por baixo do ícone (o mesmo efeito visual pedido aqui, "aparece o nome dele
  igual fica na tabbar" — anima altura/opacidade do texto).
- Vidro compartilhado: `frontend/src/components/tabbar/vidro.ts` — `estiloVidro` (pílula grande) e
  `estiloVidroIndicador` + `FiltroVidro` (indicador pequeno com bisel e refração SVG) já existem e
  devem ser reaproveitados na barra de busca, não recriados do zero.

## Global Constraints

- Sem endpoint novo de busca. O filtro de amigos é uma função pura no cliente sobre a lista que
  `api.amigos()` já traz.
- Sem Tailwind/shadcn — a animação de encolher/expandir a busca é feita com `motion/react`
  (`layout`, `layoutId`, `AnimatePresence`), que já é a biblioteca de animação do projeto.
- A barra de busca, quando expandida, usa o mesmo tratamento de vidro da tab bar
  (`estiloVidro`/`estiloVidroIndicador` de `frontend/src/components/tabbar/vidro.ts` — pode
  reexportar ou importar direto, evite duplicar as sombras/blur).
- Estilo só com MUI (`sx`/`styled`) e tokens do tema. Sem CSS puro novo.
- Domínio em português, termos técnicos em inglês. Testes Vitest só de função pura, sem
  rede/DOM.
- Commits em português, frase imperativa curta, terminando com as linhas de atribuição da sessão.
- Verificação de cada tarefa: `cd frontend && npm test && npm run typecheck && npm run build`.

---

### Task 1: Remove os links "relatório"/"amigos" do topo da Início

**Files:**
- Modify: `frontend/src/pages/Home.tsx`

**Steps:**
1. Remova o `Box` com os dois links da prop `direita` de `TituloTela` (ou remova a prop `direita`
   inteira, se não sobrar mais nada nela).
2. Confirme visualmente que o título "hoje"/data continua sozinho no cabeçalho, sem quebrar o
   layout do `TituloTela`.
3. `npm test`, `npm run typecheck`, `npm run build` em `frontend/`.
4. Commit.

---

### Task 2: Três ícones novos, visualmente distinguíveis (feed / grupos / amigos)

**Files:**
- Modify: `frontend/src/components/tabbar/icones.tsx` (ou crie um arquivo próprio, ex.
  `frontend/src/components/social/iconesSocial.tsx`, se fizer mais sentido não misturar com os
  ícones da tab bar principal — decida pelo que for mais simples de reaproveitar depois)

**Steps:**
1. Crie três ícones SVG no mesmo estilo dos existentes (`stroke`, `strokeWidth`, `viewBox="0 0 24
   24"`, sem preenchimento) — **feed** (ex: linhas horizontais/lista, tipo um "stream" de posts),
   **grupos** (ex: três círculos sobrepostos representando várias pessoas), **amigos** (ex: dois
   círculos/perfis lado a lado, ou uma pessoa + coração). O importante é dar pra diferenciar grupos
   de amigos num relance — não reaproveite o mesmo desenho pros dois.
2. `npm run typecheck` em `frontend/`.
3. Commit.

---

### Task 3: Filtro de amigos por nome (função pura, TDD)

**Files:**
- Modify: `frontend/src/lib/social.ts`
- Modify: `frontend/src/lib/social.test.ts`

**Interfaces:**
- `export function filtrarAmigos<T extends { perfil: { nome: string; tag: string } }>(consulta: string, lista: T[]): T[]`
  — compara sem acento/case (normalize + lowercase) contra `nome` e `nome#tag`; consulta vazia
  devolve a lista inteira sem filtrar.

**Steps:**
1. Escreva os testes primeiro (consulta vazia, filtro por nome parcial, filtro por tag, sem
   correspondência, acento/maiúscula não importam).
2. Rode e confirme que falham.
3. Implemente.
4. Rode e confirme que passam. `npm run typecheck`.
5. Commit.

---

### Task 4: Menu de ícones com rótulo embaixo (feed / grupos / amigos)

**Files:**
- Create: `frontend/src/components/social/MenuIconesSocial.tsx`
- Modify: `frontend/src/pages/Social.tsx`

**Interfaces:**
- `export default function MenuIconesSocial(props: { aba: 'feed' | 'grupos' | 'amigos'; aoMudar: (aba: 'feed' | 'grupos' | 'amigos') => void }): JSX.Element`

**Steps:**
1. Componente com os três ícones da Task 2 lado a lado (`ButtonBase`, `role="tablist"`/`role="tab"`
   como o `Segmentado` atual já faz, pra manter acessibilidade). O ícone da aba ativa mostra o
   rótulo (feed/grupos/amigos) numa `motion.span` que anima altura/opacidade de 0 a algo pequeno
   (mesmo efeito de `TabBarItem.tsx` quando a barra não está compacta — copie a ideia, não precisa
   ser o mesmo componente).
2. Em `Social.tsx`, troque o `Segmentado` atual por `MenuIconesSocial`, e mude o padrão da aba de
   `'amigos'` para `'feed'` (`lerAba` devolve `'feed'` quando o parâmetro `aba` da URL não é
   `'grupos'` nem `'amigos'`).
3. `npm test`, `npm run typecheck`, `npm run build`.
4. Checagem visual manual fora do escopo do subagente.
5. Commit.

---

### Task 5: Barra de busca de amigos com o vidro da tab bar

**Files:**
- Create: `frontend/src/components/social/BarraBuscaAmigos.tsx`
- Modify: `frontend/src/pages/social/AbaAmigos.tsx`
- Modify: `frontend/src/pages/Social.tsx` (se a busca ficar no cabeçalho, ao lado do
  `MenuIconesSocial`, em vez de dentro da própria `AbaAmigos`)

**Interfaces:**
- `export default function BarraBuscaAmigos(props: { valor: string; aoMudar: (v: string) => void }): JSX.Element`
  — ícone de lupa que, ao tocar, anima (via `motion`/`layout`) de um botão circular pequeno para um
  campo de texto, usando `estiloVidro`/`estiloVidroIndicador` (de
  `frontend/src/components/tabbar/vidro.ts`) como fundo — mesma pílula de vidro com blur, borda e
  o bisel/refração já usados no indicador da tab bar. Ao perder foco com o campo vazio, encolhe de
  volta pro ícone.

**Steps:**
1. Implemente o componente. Reaproveite `estiloVidro`/`estiloVidroIndicador`/`FiltroVidro` — não
   duplique as definições de sombra/blur, importe do módulo existente.
2. A busca só aparece/faz sentido quando a aba ativa é "amigos" (esconda ou desabilite nas outras
   abas, já que grupos/feed não têm busca neste plano).
3. `AbaAmigos.tsx` passa a filtrar a lista de amigos exibida usando `filtrarAmigos` (Task 3) com o
   valor digitado — filtra só a lista de amigos aceitos, não os pedidos pendentes (que continuam
   aparecendo sempre, sem filtro).
4. `npm test`, `npm run typecheck`, `npm run build`.
5. Checagem visual manual fora do escopo do subagente — deixe claro no resumo que a animação
   precisa ser vista de verdade num navegador.
6. Commit.

---

### Task 6: Revisão final

**Steps:**
1. Rode `npm test`, `npm run typecheck`, `npm run build` em `frontend/`.
2. Confirme que a tela Social abre no feed por padrão (`/social` sem `?aba=`).
3. Confirme que os links "relatório"/"amigos" sumiram da Início e que ainda dá pra chegar em
   relatório (calendário → "ver relatório") e em social (tab bar).
4. Confirme que buscar por um nome que não existe entre os amigos não quebra nada (lista vazia,
   sem erro).
5. Reporte qualquer pendência, principalmente a parte visual da animação de encolher/expandir a
   busca, que só dá pra confirmar olhando no navegador.
