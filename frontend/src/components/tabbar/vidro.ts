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

/**
 * Vidro em escala menor, para a "gota" que destaca a aba ativa dentro da
 * pílula (que já é vidro por si só) — blur mais discreto e sombra mais curta
 * do que `estiloVidro`, senão fica pesado demais num elemento tão pequeno.
 */
// Bisel de vidro: camadas de inset com spread negativo desenham uma linha fina de
// brilho num canto e sombra no oposto, como a borda de um vidro de verdade (em vez
// de um único inset uniforme, que fica "chapado").
const BISEL_CLARO = [
  '0 0 4px rgba(0,0,0,.03)',
  '0 2px 5px rgba(0,0,0,.08)',
  'inset 2px 2px .5px -2px rgba(0,0,0,.55)',
  'inset -2px -2px .5px -2px rgba(0,0,0,.5)',
  'inset 1px 1px 1px -0.5px rgba(255,255,255,.9)',
  'inset -1px -1px 1px -0.5px rgba(255,255,255,.7)',
  '0 0 8px rgba(255,255,255,.25)',
].join(',');

const BISEL_ESCURO = [
  '0 0 4px rgba(0,0,0,.15)',
  '0 2px 5px rgba(0,0,0,.3)',
  'inset 2px 2px .5px -2px rgba(255,255,255,.12)',
  'inset -2px -2px .5px -2px rgba(255,255,255,.6)',
  'inset 1px 1px 1px -0.5px rgba(255,255,255,.4)',
  'inset -1px -1px 1px -0.5px rgba(255,255,255,.35)',
  '0 0 8px rgba(0,0,0,.2)',
].join(',');

export function estiloVidroIndicador(theme: Theme): CSSObject {
  return {
    background: 'rgba(255,255,255,.14)',
    backdropFilter: 'blur(8px) saturate(160%)',
    WebkitBackdropFilter: 'blur(8px) saturate(160%)',
    boxShadow: BISEL_CLARO,
    [SEM_BLUR]: { background: 'rgba(255,255,255,.3)' },
    ...theme.applyStyles('dark', {
      background: 'rgba(255,255,255,.03)',
      boxShadow: BISEL_ESCURO,
      [SEM_BLUR]: { background: 'rgba(255,255,255,.07)' },
    }),
  };
}
