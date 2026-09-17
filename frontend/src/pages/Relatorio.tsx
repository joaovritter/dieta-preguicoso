import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box } from '@mui/material';
import { hojeISO } from '../lib/format';
import { visaoDosParametros } from '../lib/relatorio';
import VisaoMes from './relatorio/VisaoMes';

export default function Relatorio() {
  const [params, setParams] = useSearchParams();
  const [hoje] = useState(hojeISO);
  const visao = visaoDosParametros(params, hoje);

  // Task 5 troca este ramo por <VisaoDia />; até lá, ?data= abre o mês daquela data.
  const mes = visao.tipo === 'mes' ? visao.mes : visao.data.slice(0, 7);

  return (
    <Box component="main" sx={{ display: 'flex', flexDirection: 'column', gap: '22px', px: '22px', pt: '14px' }}>
      <VisaoMes mes={mes} hoje={hoje} aoTrocarMes={(novo) => setParams({ mes: novo })} />
    </Box>
  );
}
