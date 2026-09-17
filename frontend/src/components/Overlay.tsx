import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import { motion, useReducedMotion } from 'motion/react';

interface Props {
  titulo: string;
  aoFechar: () => void;
  children: ReactNode;
}

/** Folha que sobe de baixo — mesmo formato da confirmação da IA (plano B, Task 9). */
export default function Overlay({ titulo, aoFechar, children }: Props) {
  return (
    <Drawer
      anchor="bottom"
      open
      onClose={aoFechar}
      slotProps={{
        paper: {
          role: 'dialog',
          'aria-label': titulo,
          sx: (t) => ({
            maxWidth: 480,
            mx: 'auto',
            maxHeight: '92dvh',
            borderRadius: '26px 26px 0 0',
            bgcolor: 'background.default',
            backgroundImage: 'none',
            p: '22px',
            pb: 'calc(22px + env(safe-area-inset-bottom))',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            ...t.applyStyles('dark', {
              borderRadius: '20px 20px 0 0',
              borderTop: '1px solid',
              borderColor: 'neutro.borda',
            }),
          }),
        },
      }}
    >
      <Typography
        component="h2"
        sx={{ m: 0, font: "700 22px/1.1 'Plus Jakarta Sans Variable', system-ui, sans-serif", letterSpacing: '-.02em' }}
      >
        {titulo}
      </Typography>
      {children}
    </Drawer>
  );
}

/** Texto honesto do que está acontecendo + um pulso discreto. Nada de spinner girando. */
export function OverlayCarregando({ texto }: { texto: string }) {
  const reduzir = useReducedMotion();
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={(t) => ({
        position: 'fixed',
        inset: 0,
        zIndex: t.zIndex.modal + 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '18px',
        bgcolor: 'rgba(255,255,255,.72)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        ...t.applyStyles('dark', { bgcolor: 'rgba(13,15,18,.78)' }),
      })}
    >
      <Box
        component={motion.div}
        aria-hidden="true"
        animate={reduzir ? { opacity: 0.8 } : { scale: [1, 1.18, 1], opacity: [0.55, 1, 0.55] }}
        transition={reduzir ? { duration: 0 } : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: 'primary.vivo' }}
      />
      <Typography sx={{ font: "600 14px 'Plus Jakarta Sans Variable', system-ui, sans-serif", color: 'text.secondary' }}>
        {texto}
      </Typography>
    </Box>
  );
}
