import type { ReactNode } from 'react';
import ButtonBase from '@mui/material/ButtonBase';

export default function BotaoTracejado({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      sx={[
        {
          mt: '6px',
          width: '100%',
          minHeight: 46,
          border: '1.4px dashed #D8D5CE',
          borderRadius: '12px',
          fontFamily: 'inherit',
          fontWeight: 500,
          fontSize: 13,
          color: 'text.secondary',
        },
        (t) => t.applyStyles('dark', { border: '1px dashed #33383f' }),
      ]}
    >
      {children}
    </ButtonBase>
  );
}
