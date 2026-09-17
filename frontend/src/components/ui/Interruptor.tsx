import ButtonBase from '@mui/material/ButtonBase';
import Box from '@mui/material/Box';
import { motion } from 'motion/react';

interface Props {
  ligado: boolean;
  aoMudar: (ligado: boolean) => void;
  rotulo: string;
  disabled?: boolean;
}

export default function Interruptor({ ligado, aoMudar, rotulo, disabled }: Props) {
  return (
    <ButtonBase
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      disabled={disabled}
      onClick={() => aoMudar(!ligado)}
      sx={(t) => ({
        width: 40,
        height: 24,
        flex: 'none',
        borderRadius: '12px',
        p: '2px',
        justifyContent: ligado ? 'flex-end' : 'flex-start',
        bgcolor: ligado ? 'status.meta' : 'neutro.borda',
        transition: 'background-color .2s',
        '&.Mui-disabled': { opacity: 0.5 },
        ...t.applyStyles('dark', { bgcolor: ligado ? 'primary.main' : 'neutro.borda' }),
      })}
    >
      <Box
        component={motion.span}
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        sx={(t) => ({
          width: 20,
          height: 20,
          borderRadius: '50%',
          bgcolor: '#fff',
          ...t.applyStyles('dark', { bgcolor: ligado ? '#07130e' : 'text.secondary' }),
        })}
      />
    </ButtonBase>
  );
}
