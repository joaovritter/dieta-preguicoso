import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { NOME_OBJETIVO } from '../lib/format';
import type { Formulario } from '../pages/formularioPerfil';
import type { Objetivo, Sexo } from '../lib/types';

interface Props {
  form: Formulario;
  aoMudar: <C extends keyof Formulario>(campo: C, valor: Formulario[C]) => void;
}

const numerico = { htmlInput: { inputMode: 'decimal' as const, min: 0, step: 0.1 } };

export default function SecaoDadosPessoais({ form, aoMudar }: Props) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      <TextField label="nome" value={form.nome} onChange={(e) => aoMudar('nome', e.target.value)} autoComplete="name" sx={{ gridColumn: '1 / -1' }} />
      <TextField select label="sexo" value={form.sexo} onChange={(e) => aoMudar('sexo', e.target.value as '' | Sexo)}>
        <MenuItem value="">não informado</MenuItem>
        <MenuItem value="M">masculino</MenuItem>
        <MenuItem value="F">feminino</MenuItem>
      </TextField>
      <TextField label="idade" type="number" value={form.idade} onChange={(e) => aoMudar('idade', e.target.value)} slotProps={numerico} />
      <TextField label="peso (kg)" type="number" value={form.peso_kg} onChange={(e) => aoMudar('peso_kg', e.target.value)} slotProps={numerico} />
      <TextField label="altura (cm)" type="number" value={form.altura_cm} onChange={(e) => aoMudar('altura_cm', e.target.value)} slotProps={numerico} />
      <TextField select label="objetivo" value={form.objetivo} onChange={(e) => aoMudar('objetivo', e.target.value as Objetivo)} sx={{ gridColumn: '1 / -1' }}>
        {(Object.keys(NOME_OBJETIVO) as Objetivo[]).map((item) => (
          <MenuItem key={item} value={item}>{NOME_OBJETIVO[item]}</MenuItem>
        ))}
      </TextField>
    </Box>
  );
}
