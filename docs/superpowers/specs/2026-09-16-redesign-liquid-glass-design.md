# Redesign "Sistema" + Liquid Glass Tab Bar — design

Data: 2026-09-16. Fonte visual: handoff `design_handoff_calendario_agua` (arquivo
`Dieta Preguicoso - Sistema.dc.html` + `README.md` + screenshots 01–08). Cópia de trabalho
extraída em `C:\dz\design_handoff_calendario_agua\` — os planos citam esse caminho; quem
executar em outra máquina extrai o zip de novo.

## Objetivo

Levar o frontend inteiro para o design "Sistema" (claro + escuro, 8 telas), trocar o CSS puro
por MUI, substituir a barra foto/áudio/texto por uma tab bar "Liquid Glass" no estilo iOS 26
(seguindo o prompt do usuário, não a barra do HTML), e construir o backend que o design pede e
hoje não existe: relatório mensal, feed geral com curtidas/comentários, ranking semanal nos
grupos, trocar senha e excluir conta.

## Decisões fechadas com o usuário

| # | Decisão |
|---|---|
| D1 | Botão central `+` de captura **dentro** da pílula: `início · social · [+] · calendário · perfil`. Substitui `BarraAcoes`. |
| D2 | Frontend inteiro migra para **MUI** (sem CSS puro). Animações com **Motion** (`motion/react`, sucessor do framer-motion). **Three.js** entra num único ponto opcional e com lazy-load (plano F). |
| D3 | Entram: relatório mensal, feed geral + curtidas/comentários, ranking semanal, trocar senha, excluir conta. **Ficam fora:** lembrete de refeição e resumo semanal por e-mail (não há infra de push/e-mail) — as duas linhas de "NOTIFICAÇÕES" do design não são implementadas. |
| D4 | Tema segue o sistema (`prefers-color-scheme`) e o perfil tem seletor `sistema · claro · escuro`, salvo no aparelho. |
| D14 | **Conta não é excluída, é desativada.** Nada é apagado (registros, mídia, grupos ficam). Reativar só pelo administrador do servidor (script de linha de comando na VPS). O botão do perfil passa a se chamar `desativar conta`. |
| D15 | **Relatório tem setas.** Visão de mês (`/relatorio?mes=`) com `‹ setembro ›` navegando entre meses; visão de dia (`/relatorio?data=`) com `‹ 13 set ›` navegando entre dias. O `ver relatório` do calendário abre a visão de **dia**; o link `relatório` do início abre a de **mês**. O calendário continua sendo o caminho para um dia distante. |
| D16 | **`adicionar refeição` abre o menu do `+` direto**, já apontado para o dia selecionado (padrão de apps de dieta: ação contextual no próprio dia, sem desvio de tela). Só aparece para hoje e dias passados; dia futuro mostra só "ainda sem registro nesse dia.". O registro nasce com `criado_em` naquele dia; ao gravar, vai para `/?data=` daquele dia. |

## Decisões tomadas no planejamento (o usuário pode reverter)

- **D5 — sem MUI X Charts**: as 4 barras do relatório são `Box` animados com Motion; não
  compensa a dependência.
- **D6 — presets de água no aparelho** (`localStorage` chave `dieta.agua.presets`, padrão
  `[200, 300, 500]`, 50–2000 ml em passos de 50). Não vai para o banco.
- **D7 — sem teto no `+água`**: o mock limita a meta+500 ml; aqui gravamos o que a pessoa bebeu.
  A barra satura em 100%.
- **D8 — cor da refeição por posição** na lista do usuário (ordenada por `inicio`), ciclando
  `[café=âmbar, almoço=azul, lanche=roxo, janta=verde, ceia=rosa]` — refeições são livres, não
  dá pra casar por nome. Rosa (não existe no design): claro `#D6457A`, escuro `#D98AA8`.
- **D9 — dia futuro e dia sem registro** usam o mesmo visual `vazio` do design.
- **D10 — tab bar ativa em cor de destaque** (verde da marca), pílula indicadora translúcida —
  é o comportamento do iOS 26 pedido no prompt; o HTML usava cor de texto.
- **D11 — minimizar ao rolar = encolher** (sem rótulos, altura menor), nunca esconder: o botão
  `+` precisa ficar sempre alcançável. Volta ao normal ao rolar para cima ou no topo.
- **D12 — detalhe de item com multiplicador de porção** (ver Telas › Detalhe de item).
- **D13 — dia navegável pela URL**: `editar dia` no calendário leva a `/?data=YYYY-MM-DD`; a
  faixa semanal some (o calendário é a navegação por data).

## Stack nova do frontend (versões verificadas no npm em 2026-09-16)

| Pacote | Versão | Uso |
|---|---|---|
| `@mui/material` | `^9.4.0` | componentes + tema com CSS variables |
| `@emotion/react`, `@emotion/styled` | `^11.14.0`, `^11.14.1` | engine de estilo do MUI |
| `motion` | `^13.4.0` | animações (`import { motion } from 'motion/react'`) |
| `lucide-react` | `^1.46.0` | ícones genéricos (voltar, câmera, mic, texto, coração, balão…) |
| `@fontsource-variable/plus-jakarta-sans` | `^5.3.0` | fonte self-hosted (VPS sem CDN externo) |
| `three`, `@react-three/fiber` | `^0.186.0`, `^9.7.0` | só no plano F, lazy |
| `vitest` (dev) | `^5.0.1` | testes de funções puras do frontend (ambiente `node`) |

Frontend ganha `npm test` (`vitest run`). CLAUDE.md e `docs/design.md` são atualizados no plano A.

## Tokens (tema MUI)

`frontend/src/theme/tema.ts` exporta `tema = createTheme({ cssVariables: { colorSchemeSelector: 'data' }, colorSchemes: { light, dark }, typography, shape })`.
Fonte: `'Plus Jakarta Sans Variable', system-ui, sans-serif`. Números grandes com `tabular-nums`.

Paleta (claro / escuro), valores do README do handoff:

| Token (`theme.vars.palette.*`) | Claro | Escuro |
|---|---|---|
| `background.default` | `#FFFFFF` | `#0d0f12` |
| `text.primary` | `#14120F` | `#e7eaee` |
| `text.secondary` (muted) | `#63635D` | `#8a919d` |
| `neutro.fraco` (dias vazios, chevron) | `#B8B4AA` | `#525a66` |
| `neutro.linha` (hairline) | `#F0EEE9` | `#262b34` |
| `neutro.borda` | `#E6E4DF` | `#262b34` |
| `neutro.cartao` | `#F7F6F3` | `#15181d` |
| `primary.main` (marca/CTA) | `#0B7A46` | `#3fa87c` |
| `primary.dark` (hover) | `#096338` | `#47b989` |
| `primary.contrastText` | `#FFFFFF` | `#07130e` |
| `primary.vivo` (login, barras) | `#0CA85D` | `#3fa87c` |
| `error.main` (sair, excluir) | `#FF2146` | `#e5837a` |
| `status.meta` | `#0CA85D` | `#3fa87c` |
| `status.sobrou` | `#2B87E3` | `#4B93D6` |
| `status.passou` | `#FF2146` | `#e5837a` |
| `status.vazio` | `#E6E4DF` | `#33383f` |
| `pilula.meta` bg/fg | `#DFF3E8`/`#0B7A46` | `#0e2b1e`/`#3fa87c` |
| `pilula.sobrou` bg/fg | `#E4EEFB`/`#1B69B8` | `#0f1f30`/`#4B93D6` |
| `pilula.passou` bg/fg | `#FCE4E7`/`#C4002A` | `#2c1416`/`#e5837a` |
| `macro.carbo` | `#2B87E3` | `#4B93D6` |
| `macro.proteina` | `#9F43CC` | `#A06BC4` |
| `macro.gordura` | `#EBA10F` | `#D99B2E` |
| `agua.gradiente` | `linear-gradient(90deg,#2B87E3,#5AA9F0)` | `linear-gradient(90deg,#4B93D6,#79B7EF)` |
| `agua.trilha` | `#F0EEE9` | `#262b34` |

Raios: pílulas/cartões 11–14 px, CTA 13 px, círculos 50%, tab bar 28 px.
Rótulo de seção: 600 9.5px, `letter-spacing .16em`, maiúsculas, `text.secondary`.
Título de tela: 700 22px, `letter-spacing -.02em`. CTA: `min-height 52px`, 700 15px.

A augmentação de tipos do MUI (`palette.neutro`, `status`, `pilula`, `macro`, `agua`,
`refeicao`, `primary.vivo`) mora em `frontend/src/theme/tipos.d.ts`.

Tema escolhido: `useColorScheme()` do MUI (`mode: 'system' | 'light' | 'dark'`), que persiste
sozinho no `localStorage`. `index.html` recebe o script de init do MUI para não piscar.

## Tab bar Liquid Glass (prompt do usuário)

Arquivos em `frontend/src/components/tabbar/`:

- `LiquidGlassTabBar.tsx` — `<LiquidGlassTabBar itens={ItemTab[]} ativo={string|null} aoTrocar={(id)=>void} acaoCentral={ReactNode} />`
- `TabBarItem.tsx` — um item (ícone + rótulo + badge).
- `TabBarIndicator.tsx` — a pílula com `layoutId="tab-indicador"`.
- `useRolagemCompacta.ts` — `useRolagemCompacta(): boolean` (true = compacta).
- `brilho.ts` — funções puras: `posicaoRelativa(clientX, clientY, rect) → { x: number; y: number }` (0–100, com clamp).
- `icones.tsx` — SVGs de `início`, `social`, `calendário`, `perfil` copiados dos paths do HTML
  (stroke 1.8, 19×19). O de calendário é o do handoff (rect rx 2.6 + linha + dois ticks).

```ts
export interface ItemTab { id: string; rotulo: string; icone: ReactNode; badge?: number }
```

Visual:
1. Pílula flutuante `position: fixed`, `bottom: calc(16px + env(safe-area-inset-bottom))`,
   centrada, margem lateral 16 px, `border-radius: 28px`, padding 6 px, gap 2 px.
2. Vidro: claro `rgba(255,255,255,.6)`, escuro `rgba(21,24,29,.6)`; `backdrop-filter: blur(20px) saturate(180%)`
   (+ `-webkit-`); borda 1 px claro `rgba(255,255,255,.85)` / escuro `rgba(255,255,255,.08)`;
   sombra claro `0 10px 30px -10px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.9)` /
   escuro `0 10px 30px -10px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.06)`.
   Sem suporte a `backdrop-filter` → fundo quase opaco (`.92` / `.95`).
3. Brilho: camada absoluta com `radial-gradient(140px 90px at X% Y%, rgba(255,255,255,.35), transparent 70%)`,
   `mix-blend-mode: overlay`; X/Y são `useMotionValue` suavizados por `useSpring({stiffness:150,damping:20})`
   e atualizados em `onPointerMove` (mouse **e** toque). Em repouso volta para 50%/0% (brilho fixo suave no topo).
4. Itens 50×46, ícone 19 px, rótulo 500 8px (600 quando ativo). Badge: bolinha `#FF3B30`,
   `min-width 16`, texto branco 700 10px, `9+` acima de 9, posição top −4 / right −6.
5. Botão central 54×54 circular, `linear-gradient(155deg,#14C77A,#0B7A46)` claro /
   `linear-gradient(155deg,#47b989,#2c6f55)` escuro, ícone `+` 22 px (branco / `#07130e`),
   sombra `0 8px 20px -6px rgba(11,122,70,.55)` (escuro `rgba(63,168,124,.5)`).

Comportamento:
1. Indicador líquido: `layoutId` com `transition: { type: 'spring', stiffness: 380, damping: 30, mass: 0.9 }`
   + "esticada": ao trocar de aba, `scaleX` anima `[1, 1.35, 1]` em 0.45 s (keyed pelo id ativo),
   o que dá a sensação de líquido escorrendo. Fundo do indicador: claro `rgba(0,0,0,.08)`,
   escuro `rgba(255,255,255,.09)`.
2. Rolagem: `useRolagemCompacta` usa `useScroll` + `useMotionValueEvent`; delta > 6 px para baixo
   com `scrollY > 40` → compacta; delta > 6 px para cima ou `scrollY <= 40` → normal. Compacta:
   itens 46→36 px de altura, rótulo some (`opacity 0`, `height 0`), botão central 54→44 px, tudo com spring
   `{stiffness: 300, damping: 28}`.
3. Toque: `whileTap={{ scale: 0.86 }}` em item e botão central. Cor do ícone/rótulo anima
   0.25 s entre `text.secondary` e `primary.main`.
4. `useReducedMotion()` → sem brilho, sem esticada, transições de 0.15 s.
5. Acessibilidade: `<nav aria-label="navegação principal">`, itens são `button` com
   `aria-current="page"` no ativo; botão central `aria-label="registrar refeição"`, `aria-expanded`.

Ação central: `frontend/src/components/captura/MenuCaptura.tsx` — o `+` abre um popover de vidro
acima da barra com `foto · áudio · texto` (entrada com spring, fecha ao tocar fora/Escape). As
ações chamam o `CapturaContext`.

## Casca do app e rotas

`frontend/src/layout/Casca.tsx` renderiza `<Outlet/>` + tab bar e reserva `padding-bottom` de
`110px + safe-area` no conteúdo. `frontend/src/captura/CapturaContext.tsx` sobe o que hoje mora
na Home (`useEntradaIA`, modais de texto/áudio, overlay de carregamento, `ConfirmacaoRegistro`) e
expõe:

```ts
interface Captura {
  /** D16 — abre o menu do `+`; `data` (YYYY-MM-DD, hoje ou passado) faz o registro nascer naquele dia. Sem `data` = agora. */
  abrirMenu(data?: string): void;
  enviarFoto(arquivo: File): void;
  abrirAudio(): void;
  abrirTexto(): void;
  ocupado: boolean;
  /** Incrementa a cada registro gravado — páginas usam como dependência para recarregar. */
  versao: number;
}
export function useCaptura(): Captura;
```

Depois de gravar, navega para `/` (hoje).

| Rota | Tela | Tab ativa | Tab bar |
|---|---|---|---|
| `/login` | Login | — | não |
| `/` (`?data=YYYY-MM-DD` opcional) | Início | início | sim |
| `/relatorio` (`?mes=YYYY-MM`) | Relatório | nenhuma | sim |
| `/calendario` (`?mes=YYYY-MM`) | Calendário | calendário | sim |
| `/social` (`?aba=amigos|grupos|feed`) | Social | social | sim |
| `/grupos/:id` | Grupo | social | sim |
| `/u/:id` | Perfil público | social | sim |
| `/perfil` | Perfil | perfil | sim |
| `/perfil/metas`, `/perfil/dados`, `/perfil/refeicoes`, `/perfil/senha` | subtelas | perfil | não |
| `/registros/:id/alimentos/:indice` | Detalhe de item | — | não |

`/amigos` e `/grupos` antigos redirecionam para `/social?aba=amigos|grupos`.
Badge da aba social = `pedidos.recebidos.length` (`GET /api/amigos/pedidos`, recarregado ao entrar em `/social`).

## Funções puras compartilhadas (`frontend/src/lib/visual.ts`, com testes)

```ts
export type StatusVisual = 'meta' | 'sobrou' | 'passou' | 'vazio';
export function statusVisual(status: StatusDia, data: string, hoje: string): StatusVisual; // data > hoje → 'vazio'
export const ROTULO_STATUS: Record<StatusVisual, string>; // meta 'na meta', sobrou 'sobrou', passou 'passou da meta', vazio 'sem registro'
export type CorRefeicao = 'cafe' | 'almoco' | 'lanche' | 'janta' | 'ceia';
export function corDaRefeicao(refeicaoId: string, refeicoes: Refeicao[]): CorRefeicao; // posição após ordenar por inicio, ciclo de 5
export function litros(ml: number): string; // 1200 → "1,2"
export function mesLongo(mes: string): string; // "2026-09" → "setembro"
export function deslocarMes(mes: string, delta: number): string; // "2026-01", -1 → "2025-12"
```

`corDaRefeicao` resolve para token via `theme.vars.palette.refeicao[cor]` (café=`macro.gordura`,
almoço=`status.sobrou`, lanche=`macro.proteina`, janta=`status.meta`, ceia=rosa D8).

## Telas

Todas pixel-close ao HTML "Sistema", claro e escuro. Cada tela: padding lateral 22 px,
título 22 px no topo.

- **Login** (01): rótulo `DIETA PREGUIÇOSO`, headline 800 50px/.94 com "O resto é com a gente." em
  `primary.vivo`; campos sublinhados (borda inferior 1.6 px, rótulo maiúsculo); segmentado
  `entrar | cadastrar` (claro: ativo preto/branco; escuro: ativo `#1c2027` + inset `primary`);
  CTA verde. Cadastro mostra "CONFIRMAR SENHA" e o campo de nome já existente.
- **Início** (02): header `hoje` (ou `13 set` quando `?data`) + links `relatório` e `amigos`
  (→ `/social`); `SALDO DO DIA` com número 800 62px e `kcal restantes` (ou `kcal a mais` em
  `error.main` quando excedeu), barra 10 px `primary.vivo`, `consumido / meta kcal`; grid de 3
  cartões de macro (`CARBO/PROT/GORD`, número 700 19px, `/metag`, barra 5 px na cor do macro);
  seção **ÁGUA** (abaixo); lista do dia: rótulo `14 SET 2026` + total, linhas por refeição com
  barrinha 6×34 na cor D8, nome, alimentos resumidos, kcal; tocar expande registros e cada alimento
  leva ao detalhe; `ver calendário →`. Excluir registro e trocar refeição continuam, dentro da linha expandida.
- **Água** (`CardAgua`): header `ÁGUA` + `editar`/`pronto`; padrão = litros 800 28px + `/ 2,5 L`,
  barra 14 px com gradiente e `transition: width .7s cubic-bezier(.22,1,.36,1)`, 3 botões
  `+200ml` (borda, hover azul); editando = uma linha por preset com `−`/`+` 32×32. Só adiciona
  quando a data exibida é hoje.
- **Relatório** (03): `setembro` + `média 1 890 kcal`; `POR REFEIÇÃO` com barras (altura proporcional
  ao maior, máx 96 px, cor D8, valor em cima, nome embaixo, animam crescendo); até 2 linhas de
  variação (`↓ 8% menos no lanche que em agosto` em `primary.main`, `↑ 21% mais na janta…` em
  `pilula.passou.fg`) — as de maior |variação|, ignorando `null`; filtro que cicla
  `todas as refeições → só <refeição> …` + `ver calendário`; lista por dia (`13 SET` + total,
  linhas `refeição · descrição` + kcal).
- **Calendário** (04): `calendário` + `‹ setembro ›` (botões); letras `D S T Q Q S S`; grade 7
  colunas de círculos `aspect-ratio 1`, borda 1.8 px (2.6 selecionado) na cor do status, selecionado
  preenchido com texto branco/`#07130e`, hoje em 700; painel com hairline: com dados → `14 de setembro`,
  pílula de status, kcal 800 34px, `ver relatório` (→ `/relatorio?mes=`) e `editar dia` (→ `/?data=`);
  sem dados → "ainda sem registro nesse dia." + `adicionar refeição` (D16: `useCaptura().abrirMenu(data)`
  abre o menu do `+` para aquele dia; escondido em dia futuro). `ver relatório` → `/relatorio?data=`. Dados: `GET /api/social/usuarios/<meu id>/calendario?mes=`.
- **Detalhe de item** (05): `← voltar`, pílula da refeição (cor D8), nome 800 32px, kcal 800 52px
  com sublinhado 1.6 px, `PORÇÃO` com `−`/`+` 44×44, linhas carboidrato/proteína/gordura nas cores
  de macro, rodapé `remover` (38%) + `salvar`. **Porção (D12):** `lerPorcao("4 colheres")` →
  `{ quantidade: 4, unidade: "colheres" }`; o passo é 1 (ou 0,5 se a quantidade original < 2);
  sem número → quantidade 1 e unidade `porção`, passo 0,5. Fator = nova/original; `escalarAlimento`
  multiplica kcal e macros (1 casa) e reescreve `quantidade_estimada`. Salvar →
  `PATCH /api/registros/:id { alimentos }`. Remover → tira o alimento; se era o único, pede
  confirmação e apaga o registro. Na confirmação da IA o mesmo componente abre sobre a folha,
  editando o estado local. Funções em `frontend/src/lib/porcao.ts`, com testes.
- **Confirmação da IA** (06): bottom sheet (claro raio 26, escuro 20); `LI DA SUA FOTO|ÁUDIO|TEXTO`,
  `confere aí?`, descrição entre aspas; chips de refeição (ativo `#1B69B8` claro / `status.sobrou`
  escuro); linhas de alimento (nome, quantidade, kcal sublinhado) que abrem o detalhe; `+ adicionar
  alimento` tracejado (abre o detalhe de um alimento vazio com campos de nome/kcal/macros editáveis);
  total 800 40px + `C · P · G`; `descartar` + `confirmar`.
- **Perfil** (07): avatar 58 px com inicial em `primary.main`, nome 700 17px, e-mail, `editar`
  (→ `/perfil/dados`). Seções em lista com hairline e `›`: **METAS** (`meta diária 2 200 kcal`,
  `macros C 275 · P 140 · G 73`, `água 2,5 L` → `/perfil/metas`); **REGISTRO** (`modo preguiçoso`
  com switch que salva na hora; `refeições` → `/perfil/refeicoes`); **IDENTIDADE** (`nome#tag` +
  copiar); **APARÊNCIA** (segmentado `sistema · claro · escuro`); **CONTA** (`trocar senha` →
  `/perfil/senha`, `sair` e `excluir conta` em `error.main`). Switch estilo iOS 40×24.
- **Social** (08): `social` + segmentado `amigos · grupos · feed` (claro: ativo `#14120F`/branco;
  escuro: ativo `#e7eaee`/`#0d0f12`). Amigos: avatar 40 px colorido pela inicial, nome, texto de
  status do dia, bolinha 8 px na cor do status; pedidos recebidos no topo com aceitar/recusar;
  `+ adicionar amigo` tracejado (abre campo `nome#tag`). Grupos: cartão com nome, `N membros`,
  `você é #3 esta semana` em `primary.main` (esconde se `null`); `+ criar grupo` e entrar por código.
  Feed: post com avatar 34, nome, `há 20 min`, foto (raio 14, 180 px), descrição, chip `612 kcal`,
  coração com contagem (toggle otimista) e balão com contagem (abre folha de comentários).
- **Grupo** e **Perfil público**: mesmo vocabulário (lista de membros como Amigos; calendário
  reaproveita o componente da tela Calendário em modo só leitura).

## Backend novo

Tudo entra primeiro em `docs/api-contract.md` (fonte da verdade), depois no código. Rotas validam
com Zod; erros via `AppError`; SQL puro em `repos/`; cálculo em `domain/` com testes Vitest.

### Relatório mensal — `GET /api/resumo/mes?mes=YYYY-MM`

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
    data: string;                 // YYYY-MM-DD, ordem desc
    calorias: number;
    refeicoes: Array<{ refeicao_id: string; refeicao_nome: string; calorias: number; descricao: string }>;
    // descricao = nomes dos alimentos dos registros daquela refeição, juntados com ", "; ordem: inicio da refeição
  }>;                             // só dias com registro
}
```
Cálculo em `backend/src/domain/relatorio.ts` (`montarRelatorioMes(registrosMes, registrosMesAnterior, refeicoes, timezone)`).

### Interações no feed — migration `004_interacoes.sql`

```sql
CREATE TABLE curtidas (
  registro_id UUID NOT NULL REFERENCES registros_alimentares(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (registro_id, user_id)
);
CREATE TABLE comentarios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_id UUID NOT NULL REFERENCES registros_alimentares(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  texto       TEXT NOT NULL CHECK (char_length(texto) BETWEEN 1 AND 500),
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comentarios_registro ON comentarios (registro_id, criado_em);
```

`Post` ganha: `curtidas: number; curti: boolean; comentarios: number` — em **todos** os feeds
(grupo, pessoa, geral).

- `GET /api/social/feed?antes=<ISO>&limite=<1..50>` → `200 Feed`: registros de amigos aceitos e de
  quem divide grupo com você, **sem os seus**, mais recentes primeiro, `limite` padrão 20.
- `PUT /api/social/posts/:id/curtida` → `204` (idempotente) · `DELETE` mesmo caminho → `204`.
- `GET /api/social/posts/:id/comentarios` → `200 { comentarios: Comentario[] }` (ordem `criado_em` asc).
- `POST /api/social/posts/:id/comentarios` body `{ texto: string }` (trim, 1–500) → `201 Comentario`.
  Limite 30/hora por usuário (`429 LIMITE_EXCEDIDO`, middleware `limiteTaxa` existente).
- `DELETE /api/social/comentarios/:id` → `204`; só o autor do comentário ou o dono do post; senão `404 NAO_ENCONTRADO`.
- Acesso a um post: regra "Quem vê o quê" aplicada ao dono do registro; fora dela `403 SEM_ACESSO`;
  registro inexistente `404 NAO_ENCONTRADO`.

```ts
interface Comentario { id: string; autor: PerfilPublico; texto: string; criado_em: string; posso_apagar: boolean }
```

### Ranking semanal — campo novo em `Grupo`

`Grupo` ganha `minha_posicao_semana: number | null` (em `GET /api/grupos`, `POST /api/grupos`,
`POST /api/grupos/entrar`, `GET /api/grupos/:id`). Janela: os 7 dias terminando hoje, no fuso
**de quem pede**. Pontuação por membro: `dias_na_meta` (status `na_meta`) desc; desempate
`desvio_medio` = média de `|percentual − 100|` nos dias com registro, asc; membro sem nenhum
registro na janela fica depois de todos e com desvio infinito; empate total → mesma posição
(ranking "1, 2, 2, 4"). `null` quando o grupo tem 1 membro. Cálculo em
`backend/src/domain/ranking.ts` (`posicaoNoRanking(pontuacoes, userId): number | null`) com testes.

### Registro retroativo (D16)

`POST /api/registros/texto|foto|audio` aceitam `criado_em?: ISO datetime` opcional (campo JSON no
texto; campo de formulário no multipart). Só é usado quando o modo preguiçoso grava direto —
no fluxo normal o frontend repassa o mesmo `criado_em` ao `POST /api/registros/confirmar`, que já
aceita. Data no futuro → `400 VALIDACAO`. O frontend monta `criado_em` = dia escolhido + hora atual
do aparelho (a refeição sugerida segue a hora; a pessoa troca no chip se quiser).

### Relatório do dia (D15)

Sem endpoint novo: a visão de dia usa `GET /api/resumo/dia` + `GET /api/registros/dia`. Mostra
`13 set` com setas, total do dia vs meta com pílula de status, barras por refeição do dia (mesmo
componente da visão de mês) e a lista de registros; seta `›` desabilitada em hoje.

### Conta

- `PUT /api/me/senha` body `{ senha_atual: string, senha_nova: string (8–200) }` → `204`;
  `400 SENHA_INCORRETA` ("senha atual incorreta") — **não** 401, que derruba a sessão no frontend.
- `POST /api/me/desativar` body `{ senha: string }` → `204`; `400 SENHA_INCORRETA`. Migration
  `005_conta_desativada.sql`: `ALTER TABLE users ADD COLUMN desativada_em TIMESTAMPTZ`. **Nada é
  apagado.** Efeitos de conta desativada:
  - `POST /api/auth/login` → `403 CONTA_DESATIVADA` ("conta desativada — fale com o administrador"),
    checado **depois** de conferir a senha (não revela a situação a quem não sabe a senha);
  - middleware de autenticação recusa tokens dela com o mesmo `403 CONTA_DESATIVADA` (o frontend
    trata como logout, mostrando a mensagem no login);
  - some do social: não aparece em amigos, membros de grupo, feeds, ranking, busca por `nome#tag`
    (`404`), e o perfil público dela dá `404 NAO_ENCONTRADO`. Grupos que ela criou continuam.
- Reativação só pelo administrador, na VPS: `npm run conta:reativar -- <email>` (script
  `backend/src/scripts/reativarConta.ts`, zera `desativada_em`, imprime o resultado), documentado em
  `docs/deploy.md`. Não existe tela nem endpoint de admin.
- Limite: 10 tentativas / 15 min por usuário somando senha e desativar.
- O plano E roda **depois** do D (migration 005 depois da 004, e filtra as consultas sociais do D).

## Divisão em planos (ordem de execução)

| Plano | Arquivo | Depende de |
|---|---|---|
| A — Fundação MUI + tab bar + casca | `docs/superpowers/plans/2026-09-16-a-fundacao-mui-tabbar.md` | — |
| B — Telas (login, início, água, calendário, detalhe, confirmação, perfil + subtelas) | `…-b-telas.md` | A |
| C — Relatório mensal (backend + tela) | `…-c-relatorio.md` | A (backend pode começar antes) |
| D — Social: tela + feed geral + curtidas/comentários + ranking | `…-d-social.md` | A |
| E — Conta: trocar senha e desativar (backend + telas + script de reativação) | `…-e-conta.md` | B e D |
| F — Three.js no login (opcional) | `…-f-threejs-login.md` | B |

**Execução:** cada tarefa de cada plano é implementada por subagente **Sonnet**; Opus só planeja
e revisa (entre tarefas e no fim de cada plano).

Cada plano termina com `npm run typecheck` + `npm run build` (e `npm test` onde houver) verdes
e o app rodando. O plano B apaga `home.css` e os componentes que ficaram sem uso; o CSS que ainda
serve às telas sociais e aos modais de captura some na última tarefa do plano D (modais de captura
em MUI + remoção de todo `styles/*.css`). C/D/E não reintroduzem CSS puro.

Ordem final: A → B → C → D → E → F (E depende de D; C pode rodar em paralelo a D).

## Plano F — Three.js (opcional)

Fundo do Login: plano full-screen atrás da headline com shader de "vidro líquido" (ruído suave
em verde da marca, baixa opacidade, 30 fps máx), `React.lazy` + `Suspense`, só carrega se houver
WebGL e `prefers-reduced-motion: no-preference`; senão, gradiente estático. Não afeta nenhuma outra
tela nem o bundle inicial. Se o usuário desistir, o plano é simplesmente pulado.

## Fora de escopo

Notificações (lembrete de refeição, resumo por e-mail); `image-slot` do design (usa `midia_url`
real); status bar `9:41` e moldura de celular do HTML; qualquer mudança na IA.
