import { Box, Typography, useTheme } from '@mui/material';
import { motion, useReducedMotion } from 'motion/react';
import { useRefeicoes } from '../../lib/RefeicoesContext';
import { kcal, type ItemBarra } from '../../lib/relatorio';
import { corDaRefeicao } from '../../lib/visual';
import { FONTE } from './estilos';

const ALTURA_MAX_BARRA = 96;

interface Props {
  itens: ItemBarra[];
  rotuloAria: (item: ItemBarra) => string;
}

export default function BarrasPorRefeicao({ itens, rotuloAria }: Props) {
  const theme = useTheme();
  const reduzirMovimento = useReducedMotion();
  const { refeicoes } = useRefeicoes();
  const maior = Math.max(1, ...itens.map((i) => i.calorias));

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: 130 }}>
      {itens.map((item, indice) => {
        const altura = Math.max(4, Math.round((item.calorias / maior) * ALTURA_MAX_BARRA));
        const cor = theme.vars.palette.refeicao[corDaRefeicao(item.refeicao_id, refeicoes)];
        return (
          <Box
            key={item.refeicao_id}
            sx={{
              flex: 1,
              minWidth: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '7px',
            }}
          >
            <Typography sx={{ font: `700 13px/1 ${FONTE}`, fontVariantNumeric: 'tabular-nums' }}>
              {kcal(item.calorias)}
            </Typography>
            <motion.div
              role="img"
              aria-label={rotuloAria(item)}
              initial={{ height: reduzirMovimento ? altura : 0 }}
              animate={{ height: altura }}
              transition={
                reduzirMovimento
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 170, damping: 22, delay: indice * 0.06 }
              }
              style={{ width: '100%', background: cor, borderRadius: '7px 7px 0 0' }}
            />
            <Typography
              noWrap
              sx={{
                maxWidth: '100%',
                font: `500 10px/1 ${FONTE}`,
                color: 'text.secondary',
                textTransform: 'lowercase',
              }}
            >
              {item.refeicao_nome}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
