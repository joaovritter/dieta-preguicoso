import Box from '@mui/material/Box';
import type { ReactNode } from 'react';
import { useAuth } from '../../auth/useAuth';
import LinhaLista from '../ui/LinhaLista';
import RotuloSecao from '../ui/RotuloSecao';

interface Props {
  antesDeSair?: ReactNode;
  depoisDeSair?: ReactNode;
}

export default function SecaoConta({ antesDeSair, depoisDeSair }: Props) {
  const { sair } = useAuth();
  return (
    <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <RotuloSecao sx={{ mb: '8px' }}>conta</RotuloSecao>
      {antesDeSair}
      <LinhaLista rotulo="sair" cor="perigo" onClick={sair} ultima={depoisDeSair === undefined} />
      {depoisDeSair}
    </Box>
  );
}
