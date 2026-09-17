import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { dataCurta, dataValida, hojeISO } from '../lib/format';
import { useAuth } from '../auth/useAuth';
import { useRefeicoes } from '../lib/RefeicoesContext';
import { useCaptura } from '../captura/CapturaContext';
import { useConfirmacao } from '../components/useConfirmacao';
import { useDadosDoDia } from './useDadosDoDia';
import SaldoDia from '../components/inicio/SaldoDia';
import CartoesMacro from '../components/inicio/CartoesMacro';
import CardAgua from '../components/CardAgua';
import ListaRefeicoes from '../components/ListaRefeicoes';
import Erro from '../components/Erro';
import Tela from '../components/ui/Tela';
import TituloTela from '../components/ui/TituloTela';

const estiloLink = { color: 'inherit', textDecoration: 'none' } as const;

export default function Home() {
  const { perfil } = useAuth();
  const { versao } = useCaptura();
  const [params] = useSearchParams();
  const hoje = hojeISO();
  const data = dataValida(params.get('data'), hoje);
  const [ocupado, setOcupado] = useState(false);
  const { confirmar, elemento: confirmacao } = useConfirmacao();
  const dados = useDadosDoDia(data, versao);
  const refeicoesCtx = useRefeicoes();
  const { resumo, registros, carregando, erro, recarregar, reportarErro } = dados;

  async function comOcupado(acao: () => Promise<unknown>) {
    setOcupado(true);
    try {
      await acao();
      await recarregar();
    } catch (falha: unknown) {
      reportarErro(falha);
    } finally {
      setOcupado(false);
    }
  }

  const adicionarAgua = (ml: number) => void comOcupado(() => api.adicionarAgua(ml));
  const excluirRegistro = (id: string) =>
    void (async () => {
      const ok = await confirmar({
        titulo: 'excluir registro',
        texto: 'o registro sai do resumo do dia e some do feed dos seus amigos.',
        rotulo: 'excluir',
      });
      if (ok) await comOcupado(() => api.excluirRegistro(id));
    })();
  const trocarRefeicao = (id: string, refeicaoId: string) =>
    void comOcupado(() => api.atualizarRegistro(id, { refeicao_id: refeicaoId }));

  return (
    <Tela gap={13}>
      <TituloTela
        direita={
          <Box sx={{ display: 'flex', gap: '14px', fontWeight: 500, fontSize: 12.5, color: 'text.secondary' }}>
            <Box component={Link} to="/relatorio" sx={estiloLink}>relatório</Box>
            <Box component={Link} to="/social" sx={estiloLink}>amigos</Box>
          </Box>
        }
      >
        {data === hoje ? 'hoje' : dataCurta(data)}
      </TituloTela>

      {erro !== null && <Erro mensagem={erro} aoFechar={dados.limparErro} />}
      {refeicoesCtx.erro !== null && <Erro mensagem={refeicoesCtx.erro} aoFechar={refeicoesCtx.limparErro} />}

      {resumo === null ? (
        <Typography sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
          {carregando ? 'carregando o dia...' : 'sem dados'}
        </Typography>
      ) : (
        <>
          <SaldoDia metrica={resumo.calorias} />
          <CartoesMacro resumo={resumo} />
          <CardAgua metrica={resumo.agua_ml} aoAdicionar={adicionarAgua} ocupado={ocupado || data !== hoje} />
          {registros !== null && (
            <ListaRefeicoes
              grupos={registros.refeicoes}
              data={data}
              ocupado={ocupado}
              aoExcluir={excluirRegistro}
              aoTrocarRefeicao={trocarRefeicao}
            />
          )}
        </>
      )}

      {perfil !== null && perfil.modo_preguicoso && (
        <Typography sx={{ fontSize: 12, textAlign: 'center', color: 'text.secondary' }}>
          modo preguiçoso ligado — registros gravam sem confirmação
        </Typography>
      )}

      {confirmacao}
    </Tela>
  );
}
