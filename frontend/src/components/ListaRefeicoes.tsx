import { useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import ItemRegistro from './ItemRegistro';
import RotuloSecao from './ui/RotuloSecao';
import { dataCurta, ehHoje, milhar } from '../lib/format';
import { useRefeicoes } from '../lib/RefeicoesContext';
import { corDaRefeicao } from '../lib/visual';
import type { GrupoRefeicao } from '../lib/types';

interface Props {
  grupos: GrupoRefeicao[];
  data: string;
  ocupado: boolean;
  aoTrocarRefeicao: (id: string, refeicaoId: string) => void;
  aoExcluir: (id: string) => void;
}

export default function ListaRefeicoes({ grupos, data, ocupado, aoTrocarRefeicao, aoExcluir }: Props) {
  const { refeicoes } = useRefeicoes();
  const [abertas, setAbertas] = useState<string[]>([]);
  const comRegistro = grupos.filter((g) => g.registros.length > 0);
  const total = grupos.reduce((soma, g) => soma + g.calorias, 0);

  function alternar(id: string) {
    setAbertas((atual) => (atual.includes(id) ? atual.filter((r) => r !== id) : [...atual, id]));
  }

  return (
    <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: '8px' }}>
        <RotuloSecao>{dataCurta(data, true)}</RotuloSecao>
        <Typography sx={{ fontWeight: 600, fontSize: 12, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{milhar(total)}</Typography>
      </Box>

      {comRegistro.length === 0 && (
        <Typography sx={{ py: '14px', borderTop: '1px solid', borderColor: 'neutro.linha', fontSize: 13, color: 'text.secondary' }}>
          {ehHoje(data) ? 'nada registrado ainda hoje' : 'nada registrado nesse dia'}
        </Typography>
      )}

      {comRegistro.map((grupo) => {
        const aberta = abertas.includes(grupo.refeicao_id);
        const resumo = grupo.registros
          .flatMap((r) => r.alimentos_detectados.map((a) => a.nome))
          .join(', ');
        return (
          <Box key={grupo.refeicao_id}>
            <ButtonBase
              aria-expanded={aberta}
              onClick={() => alternar(grupo.refeicao_id)}
              sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', py: '9px', borderTop: '1px solid', borderColor: 'neutro.linha', fontFamily: 'inherit', textAlign: 'left' }}
            >
              <Box component="span" sx={{ width: 6, height: 34, borderRadius: '3px', flex: 'none', bgcolor: `refeicao.${corDaRefeicao(grupo.refeicao_id, refeicoes)}` }} />
              <Box component="span" sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <Box component="span" sx={{ fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>{grupo.refeicao_nome}</Box>
                <Box component="span" sx={{ fontSize: 11.5, lineHeight: 1.2, color: 'text.secondary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {resumo}
                </Box>
              </Box>
              <Box component="span" sx={{ fontWeight: 700, fontSize: 15, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {milhar(grupo.calorias)}
              </Box>
            </ButtonBase>
            <Collapse in={aberta} unmountOnExit>
              {grupo.registros.map((registro) => (
                <ItemRegistro
                  key={registro.id}
                  registro={registro}
                  data={data}
                  ocupado={ocupado}
                  aoTrocarRefeicao={aoTrocarRefeicao}
                  aoExcluir={aoExcluir}
                />
              ))}
            </Collapse>
          </Box>
        );
      })}

      <Typography
        component={Link}
        to="/calendario"
        sx={{ textAlign: 'center', pt: '8px', pb: '4px', fontWeight: 600, fontSize: 12.5, color: 'primary.main', textDecoration: 'none' }}
      >
        ver calendário →
      </Typography>
    </Box>
  );
}
