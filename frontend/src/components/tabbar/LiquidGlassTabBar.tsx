import { useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import {
  LayoutGroup,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import TabBarItem from './TabBarItem';
import { BRILHO_REPOUSO, posicaoRelativa } from './brilho';
import FiltroVidro from './FiltroVidro';
import { useRolagemCompacta } from './useRolagemCompacta';
import { estiloVidro } from './vidro';

export interface ItemTab {
  id: string;
  rotulo: string;
  icone: ReactNode;
  badge?: number;
}

interface Props {
  itens: ItemTab[];
  ativo: string | null;
  aoTrocar: (id: string) => void;
  acaoCentral: ReactNode;
}

const Pilula = styled('div')(({ theme }) => ({
  ...estiloVidro(theme),
  pointerEvents: 'auto',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  padding: 6,
  borderRadius: 28,
}));

export default function LiquidGlassTabBar({ itens, ativo, aoTrocar, acaoCentral }: Props) {
  const compacta = useRolagemCompacta();
  const reduzir = useReducedMotion() ?? false;
  const [trocouPara, setTrocouPara] = useState<string | null>(null);

  const brilhoX = useMotionValue(BRILHO_REPOUSO.x);
  const brilhoY = useMotionValue(BRILHO_REPOUSO.y);
  const x = useSpring(brilhoX, { stiffness: 150, damping: 20 });
  const y = useSpring(brilhoY, { stiffness: 150, damping: 20 });
  const brilho = useMotionTemplate`radial-gradient(140px 90px at ${x}% ${y}%, rgba(255,255,255,.35), transparent 70%)`;

  function moverBrilho(evento: PointerEvent<HTMLDivElement>) {
    const posicao = posicaoRelativa(evento.clientX, evento.clientY, evento.currentTarget.getBoundingClientRect());
    brilhoX.set(posicao.x);
    brilhoY.set(posicao.y);
  }

  function repousarBrilho() {
    brilhoX.set(BRILHO_REPOUSO.x);
    brilhoY.set(BRILHO_REPOUSO.y);
  }

  function selecionar(id: string) {
    setTrocouPara(id);
    aoTrocar(id);
  }

  const meio = Math.ceil(itens.length / 2);
  const renderizar = (item: ItemTab) => (
    <TabBarItem
      key={item.id}
      item={item}
      ativo={item.id === ativo}
      compacta={compacta}
      esticar={trocouPara === item.id}
      aoSelecionar={() => selecionar(item.id)}
    />
  );

  return (
    <Box
      component="nav"
      aria-label="navegação principal"
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 'calc(16px + env(safe-area-inset-bottom))',
        px: 2,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 1100,
      }}
    >
      <FiltroVidro />
      <Pilula
        onPointerMove={reduzir ? undefined : moverBrilho}
        onPointerLeave={reduzir ? undefined : repousarBrilho}
        onPointerUp={reduzir ? undefined : repousarBrilho}
      >
        {!reduzir && (
          <Box
            aria-hidden="true"
            sx={{ position: 'absolute', inset: 0, borderRadius: 'inherit', overflow: 'hidden', pointerEvents: 'none' }}
          >
            <motion.span
              style={{ position: 'absolute', inset: 0, background: brilho, mixBlendMode: 'overlay' }}
            />
          </Box>
        )}

        <LayoutGroup id="tabbar">
          {itens.slice(0, meio).map(renderizar)}
          {acaoCentral}
          {itens.slice(meio).map(renderizar)}
        </LayoutGroup>
      </Pilula>
    </Box>
  );
}
