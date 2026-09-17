import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { LETRAS_SEMANA, deISO, milhar } from '../../lib/format';
import { ROTULO_STATUS, statusVisual } from '../../lib/visual';
import type { ProgressoDia } from '../../lib/types';

interface Props {
  dias: ProgressoDia[];
  hoje: string;
  selecionada: string | null;
  aoSelecionar?: (data: string) => void;
}

export default function GradeCalendario({ dias, hoje, selecionada, aoSelecionar }: Props) {
  if (dias.length === 0) {
    return <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>sem dias nesse mês</Typography>;
  }
  // O dia 1 não cai necessariamente no domingo: empurro a grade com células vazias.
  const vazios = deISO(dias[0]!.data).getDay();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <Box aria-hidden="true" sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
        {LETRAS_SEMANA.map((letra, i) => (
          <Typography key={i} component="span" sx={{ fontWeight: 600, fontSize: 9, lineHeight: 1, color: 'neutro.fraco' }}>
            {letra}
          </Typography>
        ))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px 4px' }}>
        {Array.from({ length: vazios }, (_, i) => (
          <span key={`vazio-${i}`} />
        ))}
        {dias.map((dia) => {
          const status = statusVisual(dia.status, dia.data, hoje);
          const marcado = dia.data === selecionada;
          const texto = `${deISO(dia.data).getDate()} — ${ROTULO_STATUS[status]}${status === 'vazio' ? '' : `, ${milhar(dia.calorias)} kcal`}`;
          const estilo = {
            width: '100%',
            aspectRatio: '1',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'inherit',
            fontWeight: dia.data === hoje ? 700 : 600,
            fontSize: 12.5,
            fontVariantNumeric: 'tabular-nums',
            border: `${marcado ? 2.6 : 1.8}px solid`,
            borderColor: `status.${status}`,
            bgcolor: marcado ? `status.${status}` : 'transparent',
            color: marcado && status !== 'vazio' ? 'primary.contrastText' : status === 'vazio' && !marcado ? 'neutro.fraco' : 'text.primary',
            transition: 'background-color .2s, border-width .2s, color .2s',
          } as const;
          return aoSelecionar === undefined ? (
            <Box key={dia.data} component="span" title={texto} aria-label={texto} sx={estilo}>
              {deISO(dia.data).getDate()}
            </Box>
          ) : (
            <ButtonBase key={dia.data} aria-label={texto} aria-pressed={marcado} onClick={() => aoSelecionar(dia.data)} sx={estilo}>
              {deISO(dia.data).getDate()}
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}
