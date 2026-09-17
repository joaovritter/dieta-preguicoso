import type { ReactNode } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FONTE } from './estilos';

interface Props {
  titulo: string;
  rotuloAnterior: string;
  rotuloProximo: string;
  aoAnterior: () => void;
  aoProximo: () => void;
  podeAvancar: boolean;
  lateral?: ReactNode;
}

const seta = {
  width: 32,
  height: 32,
  color: 'text.secondary',
  '&.Mui-disabled': { color: 'neutro.fraco' },
} as const;

export default function CabecalhoNavegavel({
  titulo,
  rotuloAnterior,
  rotuloProximo,
  aoAnterior,
  aoProximo,
  podeAvancar,
  lateral,
}: Props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px', minWidth: 0 }}>
        <IconButton aria-label={rotuloAnterior} onClick={aoAnterior} sx={{ ...seta, ml: '-8px' }}>
          <ChevronLeft size={20} strokeWidth={2} />
        </IconButton>
        <Typography
          component="h1"
          aria-live="polite"
          noWrap
          sx={{ m: 0, font: `700 22px/1 ${FONTE}`, letterSpacing: '-.02em' }}
        >
          {titulo}
        </Typography>
        <IconButton aria-label={rotuloProximo} onClick={aoProximo} disabled={!podeAvancar} sx={seta}>
          <ChevronRight size={20} strokeWidth={2} />
        </IconButton>
      </Box>
      {lateral}
    </Box>
  );
}
