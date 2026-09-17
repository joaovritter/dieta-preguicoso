import { useCallback, useEffect, useRef, useState } from 'react';
import { useConfirmacao } from '../components/useConfirmacao';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { dataLonga, ehHoje, hojeISO } from '../lib/format';
import { useAuth } from '../auth/useAuth';
import { useRefeicoes } from '../lib/RefeicoesContext';
import { useCaptura } from '../captura/CapturaContext';
import { useDadosDoDia } from './useDadosDoDia';
import FaixaSemanal from '../components/FaixaSemanal';
import AnelCalorias from '../components/AnelCalorias';
import BarraMacro from '../components/BarraMacro';
import CardAgua from '../components/CardAgua';
import ListaRefeicoes from '../components/ListaRefeicoes';
import Erro from '../components/Erro';

export default function Home() {
  const { perfil, sair } = useAuth();
  const [hoje] = useState(hojeISO);
  const [data, setData] = useState(hoje);
  const [ocupado, setOcupado] = useState(false);
  const { confirmar, elemento: confirmacao } = useConfirmacao();
  const { versao } = useCaptura();

  const dados = useDadosDoDia(data, hoje);
  const { recarregar, reportarErro } = dados;
  const refeicoesCtx = useRefeicoes();

  // Registros novos caem sempre em hoje: volto a Home para hoje quando a captura grava.
  const versaoVista = useRef(versao);
  useEffect(() => {
    if (versao === versaoVista.current) return;
    versaoVista.current = versao;
    setData(hoje);
    void recarregar();
  }, [versao, hoje, recarregar]);

  const comOcupado = useCallback(
    async (acao: () => Promise<unknown>) => {
      setOcupado(true);
      try {
        await acao();
        await recarregar();
      } catch (falha: unknown) {
        reportarErro(falha);
      } finally {
        setOcupado(false);
      }
    },
    [recarregar, reportarErro],
  );

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

  const { resumo, registros, semana, carregando, erro } = dados;

  return (
    <>
      <main className="app">
        <header className="topo">
          <h1>{dataLonga(data)}</h1>
          <div className="topo-links">
            <Link className="link-texto" to="/relatorio">
              relatório
            </Link>
            <button type="button" className="link-texto" onClick={sair}>
              sair
            </button>
          </div>
        </header>

        {erro !== null && <Erro mensagem={erro} aoFechar={dados.limparErro} />}
        {refeicoesCtx.erro !== null && (
          <Erro mensagem={refeicoesCtx.erro} aoFechar={refeicoesCtx.limparErro} />
        )}

        {semana !== null && (
          <FaixaSemanal dias={semana.dias} selecionada={data} aoSelecionar={setData} />
        )}

        {resumo === null ? (
          <p className="carregando-pagina">{carregando ? 'carregando o dia...' : 'sem dados'}</p>
        ) : (
          <>
            <section className="cartao">
              <AnelCalorias metrica={resumo.calorias} />
            </section>

            <section className="cartao">
              <h2 className="titulo-secao">macros</h2>
              <BarraMacro rotulo="carboidrato" unidade="g" metrica={resumo.carboidrato_g} />
              <BarraMacro rotulo="proteína" unidade="g" metrica={resumo.proteina_g} />
              <BarraMacro rotulo="gordura" unidade="g" metrica={resumo.gordura_g} />
            </section>

            <CardAgua
              metrica={resumo.agua_ml}
              aoAdicionar={adicionarAgua}
              ocupado={ocupado || !ehHoje(data)}
            />

            {registros !== null && (
              <ListaRefeicoes
                grupos={registros.refeicoes}
                ocupado={ocupado}
                aoExcluir={excluirRegistro}
                aoTrocarRefeicao={trocarRefeicao}
              />
            )}
          </>
        )}

        {perfil !== null && perfil.modo_preguicoso && (
          <p className="mudo" style={{ fontSize: 12, textAlign: 'center' }}>
            modo preguiçoso ligado — registros gravam sem confirmação
          </p>
        )}
      </main>

      {confirmacao}
    </>
  );
}
