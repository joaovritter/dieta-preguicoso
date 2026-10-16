import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { dataCurta } from '../../lib/format';
import { deslocarDia } from '../../lib/relatorio';

interface Props {
  data: string;
  hoje: string;
  aoTrocarDia: (data: string) => void;
}

const seta = {
  width: 32,
  height: 32,
  color: 'text.secondary',
  '&.Mui-disabled': { color: 'neutro.fraco' },
} as const;

/** Título da tela inicial com setas pra andar entre os dias. Não passa de hoje. */
export default function NavegacaoDia({ data, hoje, aoTrocarDia }: Props) {
  const ehHoje = data === hoje;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px', minWidth: 0 }}>
        <IconButton aria-label="dia anterior" onClick={() => aoTrocarDia(deslocarDia(data, -1))} sx={{ ...seta, ml: '-8px' }}>
          <ChevronLeft size={20} strokeWidth={2} />
        </IconButton>
        <Typography
          component="h1"
          aria-live="polite"
          noWrap
          sx={{ m: 0, fontWeight: 700, fontSize: 22, lineHeight: 1, letterSpacing: '-.02em' }}
        >
          {ehHoje ? 'hoje' : dataCurta(data)}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 'none' }}>
        {!ehHoje && (
          <ButtonBase
            onClick={() => aoTrocarDia(hoje)}
            sx={{
              fontFamily: 'inherit',
              fontWeight: 600,
              fontSize: 11.5,
              color: 'primary.main',
              minHeight: 28,
              px: '10px',
              borderRadius: '14px',
              border: 1,
              borderColor: 'neutro.borda',
            }}
          >
            ir pra hoje
          </ButtonBase>
        )}
        <IconButton
          aria-label="próximo dia"
          onClick={() => aoTrocarDia(deslocarDia(data, 1))}
          disabled={ehHoje}
          sx={{ ...seta, mr: '-8px' }}
        >
          <ChevronRight size={20} strokeWidth={2} />
        </IconButton>
      </Box>
    </Box>
  );
}
