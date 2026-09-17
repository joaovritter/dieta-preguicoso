import { Box, Typography } from '@mui/material';
import { useRefeicoes } from '../../lib/RefeicoesContext';
import { kcal } from '../../lib/relatorio';
import { corDaRefeicao } from '../../lib/visual';
import { FONTE } from './estilos';

interface Props {
  refeicaoId: string;
  nome: string;
  descricao: string;
  calorias: number;
}

export default function LinhaRefeicao({ refeicaoId, nome, descricao, calorias }: Props) {
  const { refeicoes } = useRefeicoes();
  return (
    <Box
      sx={(t) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '11px',
        py: '10px',
        borderTop: `1px solid ${t.vars.palette.neutro.linha}`,
      })}
    >
      <Box
        aria-hidden="true"
        sx={(t) => ({
          width: 6,
          height: 28,
          borderRadius: '3px',
          flex: 'none',
          bgcolor: t.vars.palette.refeicao[corDaRefeicao(refeicaoId, refeicoes)],
        })}
      />
      <Typography sx={{ flex: 1, minWidth: 0, font: `600 13.5px ${FONTE}` }}>
        {nome.toLowerCase()}
        {descricao.length > 0 && (
          <Box component="span" sx={{ fontWeight: 400, color: 'text.secondary' }}>
            {' · '}
            {descricao}
          </Box>
        )}
      </Typography>
      <Typography sx={{ font: `700 14px/1 ${FONTE}`, fontVariantNumeric: 'tabular-nums' }}>
        {kcal(calorias)}
      </Typography>
    </Box>
  );
}
