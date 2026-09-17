import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  gap?: number;
  semTabBar?: boolean;
}

export default function Tela({ children, gap = 16, semTabBar = false }: Props) {
  return (
    <Box
      component="main"
      sx={{
        maxWidth: 480,
        mx: 'auto',
        px: '22px',
        pt: '14px',
        pb: semTabBar ? '26px' : 0,
        display: 'flex',
        flexDirection: 'column',
        gap: `${gap}px`,
        minHeight: semTabBar ? '100dvh' : undefined,
      }}
    >
      {children}
    </Box>
  );
}
