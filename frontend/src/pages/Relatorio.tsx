import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box } from '@mui/material';
import { hojeISO } from '../lib/format';
import { visaoDosParametros } from '../lib/relatorio';
import VisaoDia from './relatorio/VisaoDia';
import VisaoMes from './relatorio/VisaoMes';

export default function Relatorio() {
  const [params, setParams] = useSearchParams();
  const [hoje] = useState(hojeISO);
  const visao = visaoDosParametros(params, hoje);

  return (
    <Box component="main" sx={{ display: 'flex', flexDirection: 'column', gap: '22px', px: '22px', pt: '14px' }}>
      {visao.tipo === 'dia' ? (
        <VisaoDia data={visao.data} hoje={hoje} aoTrocarDia={(data) => setParams({ data })} />
      ) : (
        <VisaoMes mes={visao.mes} hoje={hoje} aoTrocarMes={(mes) => setParams({ mes })} />
      )}
    </Box>
  );
}
