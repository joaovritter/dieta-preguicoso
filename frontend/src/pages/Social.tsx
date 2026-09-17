import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useSearchParams } from 'react-router-dom';
import Segmentado from '../components/social/Segmentado';
import AbaAmigos from './social/AbaAmigos';
import AbaFeed from './social/AbaFeed';
import AbaGrupos from './social/AbaGrupos';

type Aba = 'amigos' | 'grupos' | 'feed';

const ABAS: { valor: Aba; rotulo: string }[] = [
  { valor: 'amigos', rotulo: 'amigos' },
  { valor: 'grupos', rotulo: 'grupos' },
  { valor: 'feed', rotulo: 'feed' },
];

function lerAba(valor: string | null): Aba {
  return valor === 'grupos' || valor === 'feed' ? valor : 'amigos';
}

export default function Social() {
  const [params, setParams] = useSearchParams();
  const aba = lerAba(params.get('aba'));

  return (
    <Box component="main" sx={{ px: '22px', pt: '14px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: 480, mx: 'auto' }}>
      <Typography component="h1" sx={{ fontWeight: 700, fontSize: 22, lineHeight: 1, letterSpacing: '-.02em' }}>
        social
      </Typography>
      <Segmentado
        rotulo="seções do social"
        opcoes={ABAS}
        valor={aba}
        aoMudar={(nova) => setParams({ aba: nova }, { replace: true })}
      />
      {aba === 'amigos' && <AbaAmigos />}
      {aba === 'grupos' && <AbaGrupos />}
      {aba === 'feed' && <AbaFeed />}
    </Box>
  );
}
