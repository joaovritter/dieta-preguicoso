import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

export default function TituloTela({ children, direita }: { children: ReactNode; direita?: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2 }}>
      <Typography
        component="h1"
        sx={{ m: 0, fontWeight: 700, fontSize: 22, lineHeight: 1, letterSpacing: '-.02em' }}
      >
        {children}
      </Typography>
      {direita}
    </Box>
  );
}
