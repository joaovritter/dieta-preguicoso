import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Metrica, ResumoDia } from '../../lib/types';

const MACROS = [
  { chave: 'carboidrato_g', rotulo: 'carbo', cor: 'macro.carbo' },
  { chave: 'proteina_g', rotulo: 'prot', cor: 'macro.proteina' },
  { chave: 'gordura_g', rotulo: 'gord', cor: 'macro.gordura' },
] as const;

function Cartao({ rotulo, cor, metrica }: { rotulo: string; cor: string; metrica: Metrica }) {
  return (
    <Box
      sx={(t) => ({
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        p: '12px',
        borderRadius: '12px',
        bgcolor: 'neutro.cartao',
        ...t.applyStyles('dark', { border: '1px solid', borderColor: 'neutro.borda' }),
      })}
    >
      <Typography sx={{ fontWeight: 600, fontSize: 9, lineHeight: 1, letterSpacing: '.1em', textTransform: 'uppercase', color: 'text.secondary' }}>
        {rotulo}
      </Typography>
      <Typography sx={{ fontWeight: 700, fontSize: 19, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {Math.round(metrica.consumido)}
        <Box component="span" sx={{ fontSize: 11, color: 'text.secondary' }}>
          /{Math.round(metrica.meta)}g
        </Box>
      </Typography>
      <Box
        role="progressbar"
        aria-label={rotulo}
        aria-valuenow={Math.round(metrica.percentual)}
        sx={{ height: 5, borderRadius: '3px', bgcolor: 'neutro.borda', overflow: 'hidden' }}
      >
        <Box sx={{ height: '100%', width: `${Math.min(metrica.percentual, 100)}%`, bgcolor: cor, transition: 'width .7s cubic-bezier(.22,1,.36,1)' }} />
      </Box>
    </Box>
  );
}

export default function CartoesMacro({ resumo }: { resumo: ResumoDia }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
      {MACROS.map((m) => (
        <Cartao key={m.chave} rotulo={m.rotulo} cor={m.cor} metrica={resumo[m.chave]} />
      ))}
    </Box>
  );
}
