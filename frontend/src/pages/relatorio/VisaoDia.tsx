import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, ButtonBase, Typography } from '@mui/material';
import { api, mensagemDoErro } from '../../lib/api';
import {
  barrasDoDia,
  deslocarDia,
  descricaoDoGrupo,
  diaCurto,
  kcal,
  podeAvancarDia,
  statusDoDia,
} from '../../lib/relatorio';
import type { RegistrosDoDia, ResumoDia } from '../../lib/types';
import { ROTULO_STATUS, statusVisual } from '../../lib/visual';
import BarrasPorRefeicao from '../../components/relatorio/BarrasPorRefeicao';
import CabecalhoNavegavel from '../../components/relatorio/CabecalhoNavegavel';
import LinhaRefeicao from '../../components/relatorio/LinhaRefeicao';
import { FONTE, botaoSecundario, rotuloSecao } from '../../components/relatorio/estilos';

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'erro'; mensagem: string }
  | { tipo: 'pronto'; resumo: ResumoDia; registros: RegistrosDoDia };

interface Props {
  data: string;
  hoje: string;
  aoTrocarDia: (data: string) => void;
}

export default function VisaoDia({ data, hoje, aoTrocarDia }: Props) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setEstado({ tipo: 'carregando' });
    Promise.all([api.resumoDia(data), api.registrosDoDia(data)])
      .then(([resumo, registros]) => {
        if (!cancelado) setEstado({ tipo: 'pronto', resumo, registros });
      })
      .catch((falha: unknown) => {
        if (!cancelado) setEstado({ tipo: 'erro', mensagem: mensagemDoErro(falha) });
      });
    return () => {
      cancelado = true;
    };
  }, [data, tentativa]);

  return (
    <>
      <CabecalhoNavegavel
        titulo={diaCurto(data).toLowerCase()}
        rotuloAnterior="dia anterior"
        rotuloProximo="próximo dia"
        aoAnterior={() => aoTrocarDia(deslocarDia(data, -1))}
        aoProximo={() => aoTrocarDia(deslocarDia(data, 1))}
        podeAvancar={podeAvancarDia(data, hoje)}
        lateral={
          <ButtonBase
            component={RouterLink}
            to={`/relatorio?mes=${data.slice(0, 7)}`}
            sx={{ font: `500 12.5px ${FONTE}`, color: 'text.secondary', flex: 'none' }}
          >
            ver mês
          </ButtonBase>
        }
      />

      {estado.tipo === 'carregando' && (
        <Typography sx={{ color: 'text.secondary', fontSize: 13 }} role="status">
          carregando o dia...
        </Typography>
      )}

      {estado.tipo === 'erro' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
          <Typography sx={{ color: 'error.main', fontSize: 13 }} role="alert">
            {estado.mensagem}
          </Typography>
          <ButtonBase sx={botaoSecundario} onClick={() => setTentativa((n) => n + 1)}>
            tentar de novo
          </ButtonBase>
        </Box>
      )}

      {estado.tipo === 'pronto' && (
        <ConteudoDia key={data} data={data} hoje={hoje} resumo={estado.resumo} registros={estado.registros} />
      )}
    </>
  );
}

function ConteudoDia({
  data,
  hoje,
  resumo,
  registros,
}: {
  data: string;
  hoje: string;
  resumo: ResumoDia;
  registros: RegistrosDoDia;
}) {
  const quantidade = resumo.refeicoes.reduce((s, r) => s + r.quantidade_registros, 0);
  const visual = statusVisual(statusDoDia(resumo.calorias.consumido, resumo.calorias.meta, quantidade), data, hoje);
  const grupos = registros.refeicoes.filter((g) => g.registros.length > 0);

  if (quantidade === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
        <Typography sx={{ font: `400 12.5px ${FONTE}`, color: 'text.secondary' }}>
          nada registrado em {diaCurto(data).toLowerCase()}.
        </Typography>
        <ButtonBase component={RouterLink} to={`/calendario?mes=${data.slice(0, 7)}`} sx={botaoSecundario}>
          ver calendário
        </ButtonBase>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <Typography
              sx={{ font: `800 34px/.9 ${FONTE}`, letterSpacing: '-.03em', fontVariantNumeric: 'tabular-nums' }}
            >
              {kcal(resumo.calorias.consumido)}
            </Typography>
            <Typography sx={{ font: `600 13px ${FONTE}`, color: 'text.secondary' }}>
              / {kcal(resumo.calorias.meta)} kcal
            </Typography>
          </Box>
          {visual !== 'vazio' && (
            <Box
              component="span"
              sx={(t) => ({
                minHeight: 26,
                display: 'flex',
                alignItems: 'center',
                px: '10px',
                borderRadius: '8px',
                font: `600 11px ${FONTE}`,
                bgcolor: t.vars.palette.pilula[visual].bg,
                color: t.vars.palette.pilula[visual].fg,
              })}
            >
              {ROTULO_STATUS[visual]}
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Typography component="h2" sx={rotuloSecao}>
          por refeição
        </Typography>
        <BarrasPorRefeicao
          itens={barrasDoDia(resumo.refeicoes)}
          rotuloAria={(item) => `${item.refeicao_nome}: ${kcal(item.calorias)} kcal`}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px', pb: 2 }}>
        <Typography component="h2" sx={{ ...rotuloSecao, pb: '9px' }}>
          registros
        </Typography>
        {grupos.map((g) => (
          <LinhaRefeicao
            key={g.refeicao_id}
            refeicaoId={g.refeicao_id}
            nome={g.refeicao_nome}
            descricao={descricaoDoGrupo(g)}
            calorias={g.calorias}
          />
        ))}
      </Box>
    </>
  );
}
