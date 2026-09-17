import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import RotuloSecao from '../ui/RotuloSecao';
import { milhar } from '../../lib/format';
import type { Metrica } from '../../lib/types';

export default function SaldoDia({ metrica }: { metrica: Metrica }) {
  const passou = metrica.excedido > 0;
  const largura = Math.min(metrica.percentual, 100);
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <RotuloSecao>saldo do dia</RotuloSecao>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
        <Typography
          sx={{ fontWeight: 800, fontSize: 62, lineHeight: 0.88, letterSpacing: '-.04em', fontVariantNumeric: 'tabular-nums', color: passou ? 'error.main' : 'text.primary' }}
        >
          {milhar(passou ? metrica.excedido : metrica.restante)}
        </Typography>
        <Typography sx={{ fontWeight: 600, fontSize: 15, color: 'text.secondary', pb: '8px' }}>
          {passou ? 'kcal a mais' : 'kcal restantes'}
        </Typography>
      </Box>
      <Box
        role="progressbar"
        aria-label="calorias do dia"
        aria-valuenow={Math.round(metrica.percentual)}
        aria-valuemin={0}
        aria-valuemax={100}
        sx={{ height: 10, borderRadius: '5px', bgcolor: 'neutro.linha', overflow: 'hidden', mt: '4px' }}
      >
        <Box
          sx={{
            height: '100%',
            width: `${largura}%`,
            bgcolor: passou ? 'error.main' : 'primary.vivo',
            transition: 'width .7s cubic-bezier(.22,1,.36,1)',
          }}
        />
      </Box>
      <Typography sx={{ fontWeight: 500, fontSize: 11.5, lineHeight: 1, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
        {milhar(metrica.consumido)} / {milhar(metrica.meta)} kcal
      </Typography>
    </Box>
  );
}
