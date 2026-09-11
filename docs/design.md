# Direção visual — dieta-preguicoso

Tema escuro, neutro, um único tom de destaque. Zero decoração. A tela é feita de
números legíveis, não de ilustrações.

## Tokens (CSS custom properties em `:root`)

```css
--bg: #0d0f12;          /* fundo da página */
--surface: #15181d;     /* cards */
--surface-2: #1c2027;   /* hover / elevação */
--border: #262b34;
--text: #e7eaee;
--text-muted: #8a919d;
--accent: #3fa87c;      /* verde discreto — anel, barras, ações primárias */
--accent-dim: #2c6f55;
--excess: #c8794f;      /* excesso além da meta — âmbar apagado, não vermelho berrante */
--danger: #b4574f;      /* só para destrutivo (excluir) */
--radius: 14px;
--radius-sm: 9px;
```

Tipografia: stack de sistema (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`).
Números grandes com `font-variant-numeric: tabular-nums` para não dançarem ao atualizar.

Escala de espaçamento: 4 / 8 / 12 / 16 / 24 / 32.

## Layout

Mobile-first, `max-width: 480px` centralizado. Barra inferior fixa com as 3 ações
(foto · áudio · texto) sempre visível, com `padding-bottom: env(safe-area-inset-bottom)`.

## Home (de cima para baixo)

1. **Faixa semanal** — 7 colunas (D S T Q Q S S), o dia selecionado com fundo `--surface-2`
   e borda `--accent`; dias com registro ganham um ponto de 4px em `--accent` abaixo do número.
   Toca no dia → recarrega a Home naquela data.
2. **Anel de calorias** — SVG circular, `stroke-linecap: round`, trilha em `--border`,
   progresso em `--accent`. Ao passar de 100%, o anel completa e um segundo arco em
   `--excess` desenha o excedente por cima. No centro: número grande (restante ou excedido)
   + rótulo pequeno (`restantes` / `excedidas`) + `consumido / meta` embaixo em `--text-muted`.
   Anima o `stroke-dashoffset` com transição de 600ms.
3. **Barras de macro** — carbo, proteína, gordura. Cada uma: rótulo à esquerda,
   `consumido / meta g` à direita, barra de 6px abaixo. Excesso pintado em `--excess`
   na porção que passa de 100%.
4. **Água** — mesma barra, com botões rápidos `+200` `+300` `+500 ml`.
5. **Refeições do dia** — cards por refeição na ordem canônica, com kcal somadas.
   Expandir mostra os registros com seus alimentos; ceia só aparece se tiver registro.

## Estados

- **Loading da IA**: overlay com texto honesto (`analisando a foto...`) e um pulso sutil.
  Nada de spinner girando por 20s sem contexto.
- **Vazio**: "nada registrado ainda hoje" em `--text-muted`, sem ilustração.
- **Erro**: faixa em `--danger` no topo do card, com a mensagem vinda da API.

## Tela de confirmação

Lista editável de alimentos: nome, quantidade, kcal, C/P/G — cada campo um input inline.
Rodapé com os totais recalculados ao vivo, botão `confirmar` (`--accent`) e `descartar`.
Seletor de refeição aparece pré-preenchido com a sugestão — dá pra trocar, mas não obriga.

## Acessibilidade

Contraste mínimo 4.5:1 no texto. Alvos de toque ≥ 44px. Barras e anel com
`role="progressbar"` e `aria-valuenow`. Foco visível em `--accent`.
