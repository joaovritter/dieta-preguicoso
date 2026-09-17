import ButtonBase from '@mui/material/ButtonBase';

interface Props {
  simbolo: '−' | '+';
  tamanho: 32 | 44;
  rotulo: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function BotaoPasso({ simbolo, tamanho, rotulo, onClick, disabled }: Props) {
  return (
    <ButtonBase
      aria-label={rotulo}
      onClick={onClick}
      disabled={disabled}
      sx={(t) => ({
        width: tamanho,
        height: tamanho,
        flex: 'none',
        border: '1.4px solid',
        borderColor: 'neutro.borda',
        borderRadius: tamanho === 44 ? '12px' : '9px',
        bgcolor: 'background.default',
        color: 'text.primary',
        fontFamily: 'inherit',
        fontWeight: 700,
        fontSize: tamanho === 44 ? 20 : 15,
        '&:hover': { borderColor: 'text.primary' },
        '&.Mui-disabled': { opacity: 0.4 },
        ...t.applyStyles('dark', {
          borderWidth: '1px',
          bgcolor: 'neutro.cartao',
          '&:hover': { borderColor: 'primary.main' },
        }),
      })}
    >
      {simbolo}
    </ButtonBase>
  );
}
