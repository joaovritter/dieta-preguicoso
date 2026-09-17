import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, ButtonBase, Typography } from '@mui/material';
import { api, mensagemDoErro } from '../../lib/api';
import {
  barrasDoMes,
  diaCurto,
  diasFiltrados,
  kcal,
  linhasDeVariacao,
  opcoesDeFiltro,
  podeAvancarMes,
  proximoFiltro,
} from '../../lib/relatorio';
import type { RelatorioMes } from '../../lib/types';
import { deslocarMes, mesLongo } from '../../lib/visual';
import BarrasPorRefeicao from '../../components/relatorio/BarrasPorRefeicao';
import CabecalhoNavegavel from '../../components/relatorio/CabecalhoNavegavel';
import LinhaRefeicao from '../../components/relatorio/LinhaRefeicao';
import { FONTE, botaoFiltro, botaoSecundario, rotuloSecao } from '../../components/relatorio/estilos';

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'erro'; mensagem: string }
  | { tipo: 'pronto'; dados: RelatorioMes };

interface Props {
  mes: string;
  hoje: string;
  aoTrocarMes: (mes: string) => void;
}

export default function VisaoMes({ mes, hoje, aoTrocarMes }: Props) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setEstado({ tipo: 'carregando' });
    api
      .resumoMes(mes)
      .then((dados) => {
        if (!cancelado) setEstado({ tipo: 'pronto', dados });
      })
      .catch((falha: unknown) => {
        if (!cancelado) setEstado({ tipo: 'erro', mensagem: mensagemDoErro(falha) });
      });
    return () => {
      cancelado = true;
    };
  }, [mes, tentativa]);

  const temDados = estado.tipo === 'pronto' && estado.dados.dias.length > 0;

  return (
    <>
      <CabecalhoNavegavel
        titulo={mesLongo(mes)}
        rotuloAnterior="mês anterior"
        rotuloProximo="próximo mês"
        aoAnterior={() => aoTrocarMes(deslocarMes(mes, -1))}
        aoProximo={() => aoTrocarMes(deslocarMes(mes, 1))}
        podeAvancar={podeAvancarMes(mes, hoje)}
        lateral={
          temDados && estado.tipo === 'pronto' ? (
            <Typography sx={{ font: `500 12.5px ${FONTE}`, color: 'text.secondary', flex: 'none' }}>
              média {kcal(estado.dados.media_calorias)} kcal
            </Typography>
          ) : undefined
        }
      />

      {estado.tipo === 'carregando' && (
        <Typography sx={{ color: 'text.secondary', fontSize: 13 }} role="status">
          carregando o mês...
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

      {estado.tipo === 'pronto' && estado.dados.dias.length === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
          <Typography sx={{ font: `400 12.5px ${FONTE}`, color: 'text.secondary' }}>
            nada registrado em {mesLongo(mes)}.
          </Typography>
          <ButtonBase component={RouterLink} to={`/calendario?mes=${mes}`} sx={botaoSecundario}>
            ver calendário
          </ButtonBase>
        </Box>
      )}

      {estado.tipo === 'pronto' && estado.dados.dias.length > 0 && (
        <ConteudoMes key={estado.dados.mes} dados={estado.dados} />
      )}
    </>
  );
}

function ConteudoMes({ dados }: { dados: RelatorioMes }) {
  const [filtro, setFiltro] = useState<string | null>(null);

  const opcoes = useMemo(() => opcoesDeFiltro(dados), [dados]);
  const rotuloFiltro = opcoes.find((o) => o.id === filtro)?.rotulo ?? 'todas as refeições';
  const dias = useMemo(() => diasFiltrados(dados.dias, filtro), [dados, filtro]);
  const variacoes = linhasDeVariacao(dados.por_refeicao, mesLongo(deslocarMes(dados.mes, -1)));

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Typography component="h2" sx={rotuloSecao}>
          por refeição
        </Typography>

        <BarrasPorRefeicao
          itens={barrasDoMes(dados.por_refeicao)}
          rotuloAria={(item) => `${item.refeicao_nome}: média de ${kcal(item.calorias)} kcal`}
        />

        {variacoes.length > 0 && (
          <Box
            sx={(t) => ({
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              pt: '4px',
              borderTop: `1px solid ${t.vars.palette.neutro.linha}`,
            })}
          >
            {variacoes.map((linha) => (
              <Typography
                key={linha.texto}
                sx={(t) => ({
                  font: `500 12.5px/1.4 ${FONTE}`,
                  color: linha.sentido === 'menos' ? t.vars.palette.primary.main : t.vars.palette.pilula.passou.fg,
                })}
              >
                {linha.texto}
              </Typography>
            ))}
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px', pb: 2 }}>
        <Box sx={{ display: 'flex', gap: '7px', mb: '12px' }}>
          <ButtonBase
            sx={botaoFiltro}
            aria-label={`filtro: ${rotuloFiltro}. tocar para trocar`}
            onClick={() => setFiltro((atual) => proximoFiltro(opcoes, atual))}
          >
            {rotuloFiltro}
          </ButtonBase>
          <ButtonBase component={RouterLink} to={`/calendario?mes=${dados.mes}`} sx={botaoSecundario}>
            ver calendário
          </ButtonBase>
        </Box>

        {dias.map((dia) => (
          <Box key={dia.data} component="section" sx={{ display: 'flex', flexDirection: 'column', mb: '14px' }}>
            <ButtonBase
              component={RouterLink}
              to={`/relatorio?data=${dia.data}`}
              aria-label={`ver relatório de ${diaCurto(dia.data).toLowerCase()}`}
              sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', pb: '9px' }}
            >
              <Typography component="h3" sx={rotuloSecao}>
                {diaCurto(dia.data)}
              </Typography>
              <Typography sx={{ font: `600 12px/1 ${FONTE}`, fontVariantNumeric: 'tabular-nums' }}>
                {kcal(dia.calorias)}
              </Typography>
            </ButtonBase>

            {dia.refeicoes.map((r) => (
              <LinhaRefeicao
                key={r.refeicao_id}
                refeicaoId={r.refeicao_id}
                nome={r.refeicao_nome}
                descricao={r.descricao}
                calorias={r.calorias}
              />
            ))}
          </Box>
        ))}
      </Box>
    </>
  );
}
