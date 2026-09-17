import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import BotaoCta from '../ui/BotaoCta';
import { deISO, milhar } from '../../lib/format';
import { ROTULO_STATUS, mesLongo, statusVisual } from '../../lib/visual';
import type { ProgressoDia } from '../../lib/types';

interface Props {
  dia: ProgressoDia;
  hoje: string;
  /** Abre o menu do `+` apontado para o dia (spec D16). Sem ele o botão não aparece. */
  aoAdicionar?: (data: string) => void;
}

export default function PainelDia({ dia, hoje, aoAdicionar }: Props) {
  const navigate = useNavigate();
  const status = statusVisual(dia.status, dia.data, hoje);
  const rotulo = `${deISO(dia.data).getDate()} de ${mesLongo(dia.data.slice(0, 7))}`;

  if (status === 'vazio') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
        <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{rotulo}</Typography>
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>ainda sem registro nesse dia.</Typography>
        {aoAdicionar !== undefined && dia.data <= hoje && (
          <ButtonBase
            onClick={() => aoAdicionar(dia.data)}
            sx={{ minHeight: 40, px: '16px', borderRadius: '11px', bgcolor: 'neutro.cartao', fontFamily: 'inherit', fontWeight: 600, fontSize: 12.5, color: 'text.primary' }}
          >
            adicionar refeição
          </ButtonBase>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{rotulo}</Typography>
        <Box
          component="span"
          sx={{ minHeight: 26, display: 'flex', alignItems: 'center', px: '10px', borderRadius: '8px', bgcolor: `pilula.${status}.bg`, color: `pilula.${status}.fg`, fontWeight: 600, fontSize: 11 }}
        >
          {ROTULO_STATUS[status]}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <Typography sx={{ fontWeight: 800, fontSize: 34, lineHeight: 0.9, letterSpacing: '-.03em', fontVariantNumeric: 'tabular-nums' }}>
          {milhar(dia.calorias)}
        </Typography>
        <Typography sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary' }}>kcal</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: '9px' }}>
        <BotaoCta
          variante="contorno"
          altura={46}
          onClick={() => navigate(`/relatorio?data=${dia.data}`)}
          sx={{ flex: 1, borderRadius: '12px', fontWeight: 600, fontSize: 13, color: 'text.primary' }}
        >
          ver relatório
        </BotaoCta>
        <BotaoCta
          altura={46}
          onClick={() => navigate(dia.data === hoje ? '/' : `/?data=${dia.data}`)}
          sx={{ flex: 1, borderRadius: '12px', fontWeight: 600, fontSize: 13 }}
        >
          editar dia
        </BotaoCta>
      </Box>
    </Box>
  );
}
