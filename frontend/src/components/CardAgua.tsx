import { useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import RotuloSecao from './ui/RotuloSecao';
import BotaoPasso from './ui/BotaoPasso';
import { usePresetsAgua } from '../lib/usePresetsAgua';
import { litros } from '../lib/visual';
import type { Metrica } from '../lib/types';

interface Props {
  metrica: Metrica;
  aoAdicionar: (ml: number) => void;
  ocupado: boolean;
}

export default function CardAgua({ metrica, aoAdicionar, ocupado }: Props) {
  const { presets, ajustar } = usePresetsAgua();
  const [editando, setEditando] = useState(false);
  const largura = Math.min(metrica.percentual, 100);

  return (
    <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <RotuloSecao>água</RotuloSecao>
        <ButtonBase
          onClick={() => setEditando((v) => !v)}
          aria-pressed={editando}
          sx={{ fontFamily: 'inherit', fontWeight: 600, fontSize: 11.5, color: 'primary.main', minHeight: 28, px: '4px', mr: '-4px' }}
        >
          {editando ? 'pronto' : 'editar'}
        </ButtonBase>
      </Box>

      {editando ? (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {presets.map((ml, indice) => (
            <Box key={indice} sx={{ display: 'flex', alignItems: 'center', gap: '10px', py: '9px', borderTop: '1px solid', borderColor: 'neutro.linha' }}>
              <Typography sx={{ flex: 1, fontWeight: 500, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{ml}ml</Typography>
              <BotaoPasso simbolo="−" tamanho={32} rotulo={`diminuir ${ml}ml`} disabled={ml <= 50} onClick={() => ajustar(indice, -50)} />
              <BotaoPasso simbolo="+" tamanho={32} rotulo={`aumentar ${ml}ml`} disabled={ml >= 2000} onClick={() => ajustar(indice, 50)} />
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <Typography sx={{ fontWeight: 800, fontSize: 28, lineHeight: 1, letterSpacing: '-.03em', fontVariantNumeric: 'tabular-nums' }}>
              {litros(metrica.consumido)}
            </Typography>
            <Typography sx={{ fontWeight: 600, fontSize: 12.5, color: 'text.secondary' }}>/ {litros(metrica.meta)} L</Typography>
          </Box>
          <Box
            role="progressbar"
            aria-label="água do dia"
            aria-valuenow={Math.round(metrica.percentual)}
            aria-valuemin={0}
            aria-valuemax={100}
            sx={{ height: 14, borderRadius: '7px', bgcolor: 'agua.trilha', overflow: 'hidden' }}
          >
            <Box
              sx={(t) => ({
                height: '100%',
                borderRadius: '7px',
                width: `${largura}%`,
                background: (t.vars ?? t).palette.agua.gradiente,
                transition: 'width .7s cubic-bezier(.22,1,.36,1)',
              })}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: '8px' }}>
            {presets.map((ml, indice) => (
              <ButtonBase
                key={indice}
                disabled={ocupado}
                onClick={() => aoAdicionar(ml)}
                sx={(t) => ({
                  flex: 1,
                  minHeight: 36,
                  border: '1.4px solid',
                  borderColor: 'neutro.borda',
                  borderRadius: '11px',
                  bgcolor: 'background.default',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                  fontSize: 12.5,
                  color: 'text.primary',
                  transition: 'border-color .18s, color .18s',
                  '&:hover': { borderColor: 'status.sobrou', color: 'status.sobrou' },
                  '&.Mui-disabled': { opacity: 0.45 },
                  ...t.applyStyles('dark', { borderWidth: '1px', bgcolor: 'neutro.cartao' }),
                })}
              >
                +{ml}ml
              </ButtonBase>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
