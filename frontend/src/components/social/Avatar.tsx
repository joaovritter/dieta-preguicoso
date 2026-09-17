import Box from '@mui/material/Box';
import { corDoAvatar, inicial } from '../../lib/social';

/** Círculo com a inicial, colorido pelo nome. No escuro o texto é o `#07130e` do design. */
export default function Avatar({ nome, tamanho }: { nome: string; tamanho: number }) {
  return (
    <Box
      aria-hidden="true"
      sx={[
        {
          width: tamanho,
          height: tamanho,
          flex: 'none',
          borderRadius: '50%',
          bgcolor: corDoAvatar(nome),
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: Math.round(tamanho * 0.38),
        },
        (t) => t.applyStyles('dark', { color: '#07130e' }),
      ]}
    >
      {inicial(nome)}
    </Box>
  );
}
