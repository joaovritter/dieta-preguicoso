import { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Overlay from './Overlay';
import BotaoCta from './ui/BotaoCta';

interface Props {
  aoEnviar: (texto: string) => void;
  aoFechar: () => void;
}

export default function EntradaTexto({ aoEnviar, aoFechar }: Props) {
  const [texto, setTexto] = useState('');
  const vazio = texto.trim().length === 0;

  return (
    <Overlay titulo="o que você comeu?" aoFechar={aoFechar}>
      <Box
        component="form"
        sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        onSubmit={(evento: React.FormEvent) => {
          evento.preventDefault();
          if (!vazio) aoEnviar(texto.trim());
        }}
      >
        <TextField
          label="descreva do seu jeito"
          autoFocus
          multiline
          minRows={3}
          value={texto}
          placeholder="dois ovos mexidos e um pão francês"
          onChange={(evento) => setTexto(evento.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'neutro.cartao' } }}
        />
        <Box sx={{ display: 'flex', gap: '9px' }}>
          <BotaoCta type="button" variante="contorno" onClick={aoFechar} sx={{ flex: '0 0 38%' }}>
            cancelar
          </BotaoCta>
          <BotaoCta type="submit" variante="primario" disabled={vazio} sx={{ flex: 1 }}>
            interpretar
          </BotaoCta>
        </Box>
      </Box>
    </Overlay>
  );
}
