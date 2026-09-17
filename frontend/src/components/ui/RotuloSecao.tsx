import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

export default function RotuloSecao({ children, sx }: { children: ReactNode; sx?: SxProps<Theme> }) {
  return (
    <Typography
      component="span"
      sx={[
        {
          display: 'block',
          fontWeight: 600,
          fontSize: 9.5,
          lineHeight: 1,
          letterSpacing: '.16em',
          textTransform: 'uppercase',
          color: 'text.secondary',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Typography>
  );
}
