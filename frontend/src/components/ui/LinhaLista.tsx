import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import type { ReactNode } from 'react';

interface Props {
  rotulo: ReactNode;
  valor?: ReactNode;
  chevron?: boolean;
  cor?: 'normal' | 'perigo';
  onClick?: () => void;
  ultima?: boolean;
  children?: ReactNode;
}

export default function LinhaLista({ rotulo, valor, chevron = false, cor = 'normal', onClick, ultima, children }: Props) {
  const conteudo = (
    <>
      <Box
        component="span"
        sx={{ flex: 1, fontWeight: 500, fontSize: 14, color: cor === 'perigo' ? 'error.main' : 'text.primary', textAlign: 'left' }}
      >
        {rotulo}
      </Box>
      {valor}
      {children}
      {chevron && (
        <Box component="span" aria-hidden="true" sx={{ color: 'neutro.fraco' }}>
          ›
        </Box>
      )}
    </>
  );
  const estilo = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    minHeight: 44,
    py: '12px',
    pb: ultima ? '20px' : '12px',
    borderTop: '1px solid',
    borderColor: 'neutro.linha',
    fontFamily: 'inherit',
  } as const;
  return onClick === undefined ? (
    <Box sx={estilo}>{conteudo}</Box>
  ) : (
    <ButtonBase onClick={onClick} sx={estilo}>
      {conteudo}
    </ButtonBase>
  );
}
