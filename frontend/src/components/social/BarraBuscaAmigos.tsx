import { useState } from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import InputBase from '@mui/material/InputBase';
import { styled } from '@mui/material/styles';
import { Search } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { ID_FILTRO_VIDRO } from '../tabbar/FiltroVidro';
import { estiloVidroIndicador } from '../tabbar/vidro';

interface Props {
  valor: string;
  aoMudar: (v: string) => void;
}

const ALTURA = 40;

// `layout` anima a largura (40px -> 100%) por transform; o borderRadius vai em `style`
// porque só assim o motion corrige a deformação do raio durante a animação.
const Vidro = styled(motion.div)(({ theme }) => ({
  ...estiloVidroIndicador(theme),
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  height: ALTURA,
  overflow: 'hidden',
  color: theme.palette.text.primary,
}));

// O filtro SVG (ID_FILTRO_VIDRO) já é renderizado pela tab bar da Casca, que está sempre montada.
// Só o brilho de cima recebe a refração, igual ao indicador da tab bar.
const Brilho = styled('span')(({ theme }) => ({
  position: 'absolute',
  inset: 0,
  borderRadius: 'inherit',
  pointerEvents: 'none',
  background: 'linear-gradient(165deg, rgba(255,255,255,.65) 0%, rgba(255,255,255,0) 50%)',
  filter: `url(#${ID_FILTRO_VIDRO})`,
  mixBlendMode: 'overlay',
  ...theme.applyStyles('dark', {
    background: 'linear-gradient(165deg, rgba(255,255,255,.3) 0%, rgba(255,255,255,0) 50%)',
  }),
}));

export default function BarraBuscaAmigos({ valor, aoMudar }: Props) {
  const reduzir = useReducedMotion() ?? false;
  const [aberto, setAberto] = useState(valor !== '');

  return (
    <>
      <Vidro
        layout
        style={{ borderRadius: ALTURA / 2 }}
        transition={reduzir ? { duration: 0.15 } : { type: 'spring', stiffness: 380, damping: 32, mass: 0.9 }}
        sx={{ width: aberto ? '100%' : ALTURA }}
      >
        <Brilho aria-hidden="true" />
        <ButtonBase
          aria-label="abrir busca de amigos"
          tabIndex={aberto ? -1 : 0}
          onClick={() => setAberto(true)}
          sx={{ position: 'relative', width: ALTURA, height: ALTURA, flexShrink: 0, borderRadius: '50%' }}
        >
          <motion.span layout="position" style={{ display: 'flex' }}>
            <Search size={18} aria-hidden="true" />
          </motion.span>
        </ButtonBase>
        {aberto && (
          <InputBase
            autoFocus
            value={valor}
            onChange={(e) => aoMudar(e.target.value)}
            onBlur={() => {
              if (valor === '') setAberto(false);
            }}
            placeholder="buscar amigo"
            inputProps={{ 'aria-label': 'buscar amigos' }}
            sx={{ position: 'relative', flex: 1, minWidth: 0, pr: '14px', fontSize: 14 }}
          />
        )}
      </Vidro>
    </>
  );
}
