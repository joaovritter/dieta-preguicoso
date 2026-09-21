import { styled } from '@mui/material/styles';
import { motion, useReducedMotion } from 'motion/react';
import { ID_FILTRO_VIDRO } from './FiltroVidro';
import { estiloVidroIndicador } from './vidro';

// Duas camadas: a externa faz a animação de layout (posição/tamanho) e a interna a
// "esticada" em scaleX — as duas mexem em transform e brigariam no mesmo elemento.
const Trilho = styled(motion.span)({
  position: 'absolute',
  inset: 0,
  zIndex: 0,
  borderRadius: 20,
});

const Gota = styled(motion.span)(({ theme }) => ({
  position: 'absolute',
  inset: 0,
  borderRadius: 20,
  ...estiloVidroIndicador(theme),
}));

// Só o brilho de cima recebe o filtro de refração — aplicar turbulência no vidro
// inteiro (fundo + blur) deixa pesado e ilegível num elemento tão pequeno.
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

export default function TabBarIndicator({ esticar }: { esticar: boolean }) {
  const reduzir = useReducedMotion() ?? false;
  return (
    <Trilho
      layoutId="tab-indicador"
      aria-hidden="true"
      transition={reduzir ? { duration: 0.15 } : { type: 'spring', stiffness: 380, damping: 30, mass: 0.9 }}
    >
      <Gota
        initial={false}
        animate={esticar && !reduzir ? { scaleX: [1, 1.35, 1] } : { scaleX: 1 }}
        transition={{ duration: 0.45, ease: 'easeInOut' }}
      >
        <Brilho />
      </Gota>
    </Trilho>
  );
}
