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
