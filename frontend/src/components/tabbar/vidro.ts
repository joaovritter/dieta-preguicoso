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
