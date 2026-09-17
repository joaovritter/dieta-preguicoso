import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface Props {
  titulo: string;
  voltarPara: string;
  children: ReactNode;
  rodape?: ReactNode;
}

export default function SubTela({ titulo, voltarPara, children, rodape }: Props) {
  const navigate = useNavigate();
  return (
    <Box component="main" sx={{ maxWidth: 480, mx: 'auto', minHeight: '100dvh', p: '14px 22px 26px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <ButtonBase onClick={() => navigate(voltarPara)} sx={{ alignSelf: 'flex-start', minHeight: 32, fontFamily: 'inherit', fontWeight: 600, fontSize: 13, color: 'text.secondary' }}>
        ← voltar
      </ButtonBase>
      <Typography component="h1" sx={{ m: 0, fontWeight: 800, fontSize: 32, lineHeight: 1.05, letterSpacing: '-.025em' }}>
        {titulo}
      </Typography>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>{children}</Box>
      {rodape}
    </Box>
  );
}
