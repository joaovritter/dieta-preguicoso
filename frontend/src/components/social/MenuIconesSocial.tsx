import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { IconeAmigos, IconeFeed, IconeGrupos } from './iconesSocial';

export type AbaSocial = 'feed' | 'grupos' | 'amigos';

const MOLA = { type: 'spring', stiffness: 300, damping: 28 } as const;

const ITENS: { valor: AbaSocial; icone: ReactNode }[] = [
  { valor: 'feed', icone: <IconeFeed /> },
  { valor: 'grupos', icone: <IconeGrupos /> },
  { valor: 'amigos', icone: <IconeAmigos /> },
];

interface Props {
  aba: AbaSocial;
  aoMudar: (aba: AbaSocial) => void;
}

/** Menu do social: três ícones; a aba ativa ganha cor de destaque e mostra o rótulo embaixo. */
export default function MenuIconesSocial({ aba, aoMudar }: Props) {
  const reduzir = useReducedMotion() ?? false;
  const transicao = reduzir ? { duration: 0.15 } : MOLA;

  return (
    <Box role="tablist" aria-label="seções do social" sx={{ display: 'flex', gap: '6px' }}>
      {ITENS.map(({ valor, icone }) => {
        const ativo = valor === aba;
        return (
          <ButtonBase
            key={valor}
            role="tab"
            aria-selected={ativo}
            aria-label={valor}
            onClick={() => aoMudar(valor)}
            sx={{
              flex: 1,
              minHeight: 44,
              py: '6px',
              borderRadius: '12px',
              flexDirection: 'column',
              gap: '2px',
              fontFamily: 'inherit',
              color: ativo ? 'primary.main' : 'text.secondary',
              transition: 'color .25s ease',
            }}
          >
            {icone}
            <motion.span
              aria-hidden="true"
              initial={false}
              animate={{ opacity: ativo ? 1 : 0, height: ativo ? 11 : 0 }}
              transition={transicao}
              style={{ overflow: 'hidden', whiteSpace: 'nowrap', fontSize: 9.5, lineHeight: 1, fontWeight: 600 }}
            >
              {valor}
            </motion.span>
          </ButtonBase>
        );
      })}
    </Box>
  );
}
