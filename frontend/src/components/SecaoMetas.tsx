import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Interruptor from './ui/Interruptor';
import type { Formulario } from '../pages/formularioPerfil';

interface Props {
  form: Formulario;
  aoMudar: <C extends keyof Formulario>(campo: C, valor: Formulario[C]) => void;
}

type CampoMeta = 'meta_calorias' | 'meta_carboidrato_g' | 'meta_proteina_g' | 'meta_gordura_g' | 'meta_agua_ml';

const CAMPOS: Array<{ campo: CampoMeta; rotulo: string; largo?: boolean }> = [
  { campo: 'meta_calorias', rotulo: 'calorias (kcal)', largo: true },
  { campo: 'meta_carboidrato_g', rotulo: 'carboidrato (g)' },
  { campo: 'meta_proteina_g', rotulo: 'proteína (g)' },
  { campo: 'meta_gordura_g', rotulo: 'gordura (g)' },
  { campo: 'meta_agua_ml', rotulo: 'água (ml)' },
];

export default function SecaoMetas({ form, aoMudar }: Props) {
  const travadas = form.metas_automaticas;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', py: '12px', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'neutro.linha' }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 500, fontSize: 14 }}>metas automáticas</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>calcula a partir de peso, altura, idade, sexo e objetivo</Typography>
        </Box>
        <Interruptor rotulo="metas automáticas" ligado={travadas} aoMudar={(v) => aoMudar('metas_automaticas', v)} />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {CAMPOS.map(({ campo, rotulo, largo }) => (
          <TextField
            key={campo}
            label={rotulo}
            type="number"
            value={form[campo]}
            onChange={(e) => aoMudar(campo, e.target.value)}
            slotProps={{ htmlInput: { inputMode: 'decimal', min: 0, step: 0.1, readOnly: travadas } }}
            sx={{ gridColumn: largo ? '1 / -1' : undefined, '& input:read-only': { color: 'text.secondary' } }}
          />
        ))}
      </Box>
      {travadas && <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>valores calculados pelo servidor ao salvar</Typography>}
    </Box>
  );
}
