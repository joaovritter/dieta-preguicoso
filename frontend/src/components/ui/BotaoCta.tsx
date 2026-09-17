import ButtonBase from '@mui/material/ButtonBase';
import type { ButtonBaseProps } from '@mui/material/ButtonBase';

type Props = ButtonBaseProps & { variante?: 'primario' | 'contorno' | 'perigo'; altura?: number };

export default function BotaoCta({ variante = 'primario', altura = 52, sx, ...resto }: Props) {
  return (
    <ButtonBase
      {...resto}
      sx={[
        (t) => ({
          minHeight: altura,
          px: 2,
          borderRadius: '13px',
          fontFamily: 'inherit',
          fontSize: variante === 'primario' ? 15 : 14,
          fontWeight: variante === 'primario' ? 700 : 500,
          transition: 'background-color .18s, border-color .18s, color .18s',
          '&.Mui-disabled': { opacity: 0.5 },
          ...(variante === 'primario' && {
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': { bgcolor: 'primary.dark' },
          }),
          ...(variante === 'contorno' && {
            border: '1.4px solid',
            borderColor: 'neutro.borda',
            bgcolor: 'background.default',
            color: 'text.secondary',
            '&:hover': { borderColor: 'text.primary', color: 'text.primary' },
            ...t.applyStyles('dark', { borderWidth: '1px' }),
          }),
          ...(variante === 'perigo' && {
            border: '1.4px solid',
            borderColor: 'neutro.borda',
            bgcolor: 'background.default',
            color: 'text.secondary',
            '&:hover': { borderColor: 'error.main', color: 'error.main' },
            ...t.applyStyles('dark', {
              borderWidth: '1px',
              borderColor: '#402522',
              bgcolor: 'transparent',
              color: '#cf7a72',
              '&:hover': { bgcolor: 'rgba(207,122,114,.12)', color: '#cf7a72', borderColor: '#402522' },
            }),
          }),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}
