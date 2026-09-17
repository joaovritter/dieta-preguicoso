import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import { motion, useReducedMotion } from 'motion/react';
import TabBarIndicator from './TabBarIndicator';
import type { ItemTab } from './LiquidGlassTabBar';
import { paleta } from '../../theme/tema';

const MOLA = { type: 'spring', stiffness: 300, damping: 28 } as const;

const Botao = styled(motion.button)(({ theme }) => ({
  position: 'relative',
  width: 50,
  padding: 0,
  margin: 0,
  border: 'none',
  borderRadius: 20,
  background: 'none',
  font: 'inherit',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  color: paleta(theme).text.secondary,
  transition: 'color .25s ease',
  WebkitTapHighlightColor: 'transparent',
  '&[aria-current="page"]': { color: paleta(theme).primary.main },
  '&:focus-visible': { outline: `2px solid ${paleta(theme).primary.main}`, outlineOffset: 2 },
  '@media (prefers-reduced-motion: reduce)': { transition: 'color .15s ease' },
}));

interface Props {
  item: ItemTab;
  ativo: boolean;
  compacta: boolean;
  esticar: boolean;
  aoSelecionar: () => void;
}

export default function TabBarItem({ item, ativo, compacta, esticar, aoSelecionar }: Props) {
  const reduzir = useReducedMotion() ?? false;
  const transicao = reduzir ? { duration: 0.15 } : MOLA;
  const temBadge = item.badge !== undefined && item.badge > 0;

  return (
    <Botao
      type="button"
      onClick={aoSelecionar}
      aria-current={ativo ? 'page' : undefined}
      aria-label={temBadge ? `${item.rotulo}, ${item.badge} novidades` : item.rotulo}
      initial={false}
      animate={{ height: compacta ? 36 : 46 }}
      transition={transicao}
      whileTap={reduzir ? undefined : { scale: 0.86 }}
    >
      {ativo && <TabBarIndicator esticar={esticar} />}

      <Box component="span" sx={{ position: 'relative', zIndex: 1, display: 'flex' }}>
        {item.icone}
        {temBadge && (
          <Box
            component="span"
            aria-hidden="true"
            sx={{
              position: 'absolute',
              top: -4,
              right: -6,
              minWidth: 16,
              height: 16,
              px: '4px',
              boxSizing: 'border-box',
              borderRadius: 999,
              bgcolor: '#FF3B30',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              lineHeight: '16px',
              textAlign: 'center',
            }}
          >
            {(item.badge ?? 0) > 9 ? '9+' : item.badge}
          </Box>
        )}
      </Box>

      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{ opacity: compacta ? 0 : 1, height: compacta ? 0 : 8 }}
        transition={transicao}
        style={{
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          fontSize: 8,
          lineHeight: 1,
          fontWeight: ativo ? 600 : 500,
        }}
      >
        {item.rotulo}
      </motion.span>
    </Botao>
  );
}
