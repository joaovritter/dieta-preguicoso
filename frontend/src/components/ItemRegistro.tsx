import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import { horaDoTimestamp, numero } from '../lib/format';
import { useRefeicoes } from '../lib/RefeicoesContext';
import type { Registro } from '../lib/types';

interface Props {
  registro: Registro;
  data: string;
  ocupado: boolean;
  aoTrocarRefeicao: (id: string, refeicaoId: string) => void;
  aoExcluir: (id: string) => void;
}

export default function ItemRegistro({ registro, data, ocupado, aoTrocarRefeicao, aoExcluir }: Props) {
  const navigate = useNavigate();
  const { refeicoes } = useRefeicoes();
  const opcaoValida = refeicoes.some((r) => r.id === registro.refeicao_id);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', pl: '18px', pb: '10px' }}>
      <Typography sx={{ fontSize: 11.5, color: 'text.secondary', py: '6px' }}>
        {horaDoTimestamp(registro.criado_em)} · {registro.descricao_bruta}
      </Typography>
      {registro.alimentos_detectados.map((alimento, indice) => (
        <ButtonBase
          key={`${alimento.nome}-${indice}`}
          onClick={() => navigate(`/registros/${registro.id}/alimentos/${indice}?data=${data}`)}
          sx={{ display: 'flex', alignItems: 'center', gap: '10px', py: '9px', borderTop: '1px solid', borderColor: 'neutro.linha', fontFamily: 'inherit', textAlign: 'left' }}
        >
          <Box component="span" sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <Box component="span" sx={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.2 }}>{alimento.nome}</Box>
            <Box component="span" sx={{ fontSize: 11.5, color: 'text.secondary' }}>{alimento.quantidade_estimada}</Box>
          </Box>
          <Box component="span" sx={{ fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
            {numero(alimento.calorias)}
          </Box>
          <Box component="span" aria-hidden="true" sx={{ color: 'neutro.fraco' }}>›</Box>
        </ButtonBase>
      ))}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', pt: '8px' }}>
        <TextField
          select
          size="small"
          label="refeição"
          value={opcaoValida ? registro.refeicao_id : ''}
          disabled={ocupado || refeicoes.length === 0}
          onChange={(evento) => aoTrocarRefeicao(registro.id, evento.target.value)}
          sx={{ flex: 1 }}
        >
          {refeicoes.map((r) => (
            <MenuItem key={r.id} value={r.id}>{r.nome}</MenuItem>
          ))}
        </TextField>
        <ButtonBase
          disabled={ocupado}
          onClick={() => aoExcluir(registro.id)}
          sx={{ minHeight: 40, px: 1.5, borderRadius: '11px', fontFamily: 'inherit', fontWeight: 600, fontSize: 12.5, color: 'error.main' }}
        >
          excluir
        </ButtonBase>
      </Box>
    </Box>
  );
}
