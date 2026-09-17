import Alert from '@mui/material/Alert';

export default function Erro({ mensagem, aoFechar }: { mensagem: string; aoFechar?: () => void }) {
  return (
    <Alert
      severity="error"
      variant="filled"
      onClose={aoFechar}
      slotProps={{ closeButton: { 'aria-label': 'fechar aviso' } }}
      sx={{ borderRadius: '12px', fontSize: 13, fontWeight: 500, bgcolor: 'error.main', alignItems: 'center' }}
    >
      {mensagem}
    </Alert>
  );
}
