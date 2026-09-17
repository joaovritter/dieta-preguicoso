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
