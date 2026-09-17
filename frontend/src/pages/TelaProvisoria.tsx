import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

/** Provisória: planos B (calendário) e C (relatório) substituem esta tela e apagam o arquivo. */
export default function TelaProvisoria({ titulo }: { titulo: string }) {
  return (
    <Box component="main" sx={{ px: '22px', pt: '14px' }}>
      <Typography
        component="h1"
        sx={{ m: 0, fontSize: 22, fontWeight: 700, lineHeight: 1, letterSpacing: '-.02em' }}
      >
        {titulo}
      </Typography>
    </Box>
  );
}
