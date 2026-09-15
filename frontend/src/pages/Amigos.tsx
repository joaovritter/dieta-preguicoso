import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, mensagemDoErro } from '../lib/api';
import Erro from '../components/Erro';
import { useConfirmacao } from '../components/useConfirmacao';
import ProgressoAmigo from '../components/ProgressoAmigo';
import type { MembroComProgresso, PedidoAmizade, PedidosAmizade } from '../lib/types';

export default function Amigos() {
  const [amigos, setAmigos] = useState<MembroComProgresso[] | null>(null);
  const [pedidos, setPedidos] = useState<PedidosAmizade | null>(null);
  const [nomeTag, setNomeTag] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const { confirmar, elemento: confirmacao } = useConfirmacao();

  const carregar = useCallback(async () => {
    try {
      const [lista, pendentes] = await Promise.all([api.amigos(), api.pedidos()]);
      setAmigos(lista.amigos);
      setPedidos(pendentes);
      setErro(null);
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  /** Toda ação que desfaz um vínculo passa por aqui antes de tocar a API. */
  async function comConfirmacao(
    pedido: { titulo: string; texto: string; rotulo: string },
    acao: () => Promise<unknown>,
  ) {
    if (await confirmar(pedido)) await comOcupado(acao);
  }

  async function comOcupado(acao: () => Promise<unknown>) {
    setOcupado(true);
    try {
      await acao();
      setErro(null);
      await carregar();
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    } finally {
      setOcupado(false);
    }
  }

  function adicionar(evento: React.FormEvent) {
    evento.preventDefault();
    const valor = nomeTag.trim();
    if (valor === '') return;
    void comOcupado(async () => {
      await api.pedirAmizade(valor);
      setNomeTag('');
    });
  }

  return (
    <main className="app" style={{ paddingBottom: 32 }}>
      <header className="topo">
        <h1>amigos</h1>
        <div>
          <Link className="link-texto" to="/grupos">
            grupos
          </Link>
          <Link className="link-texto" to="/">
            voltar
          </Link>
        </div>
      </header>

      {erro !== null && <Erro mensagem={erro} aoFechar={() => setErro(null)} />}

      <section className="cartao">
        <h2 className="titulo-secao">adicionar</h2>
        <form className="linha-form" onSubmit={adicionar}>
          <input
            className="campo-entrada"
            value={nomeTag}
            placeholder="nome#0000"
            aria-label="nome e tag de quem você quer adicionar"
            onChange={(evento) => setNomeTag(evento.target.value)}
          />
          <button type="submit" className="botao botao-primario" disabled={ocupado}>
            pedir
          </button>
        </form>
      </section>

      {amigos === null || pedidos === null ? (
        <p className="carregando-pagina">carregando...</p>
      ) : (
        <>
          {pedidos.recebidos.length > 0 && (
            <section className="cartao">
              <h2 className="titulo-secao">pedidos recebidos</h2>
              {pedidos.recebidos.map((pedido: PedidoAmizade) => (
                <div className="linha-social" key={pedido.id}>
                  <span className="linha-social-nome">{pedido.perfil.nome_tag}</span>
                  <button
                    type="button"
                    className="botao-mini"
                    disabled={ocupado}
                    onClick={() => void comOcupado(() => api.aceitarPedido(pedido.id))}
                  >
                    aceitar
                  </button>
                  <button
                    type="button"
                    className="botao-mini"
                    disabled={ocupado}
                    onClick={() =>
                      void comConfirmacao(
                        {
                          titulo: 'recusar pedido',
                          texto: `o pedido de ${pedido.perfil.nome_tag} some. para virar amizade depois, precisa de um pedido novo.`,
                          rotulo: 'recusar',
                        },
                        () => api.recusarPedido(pedido.id),
                      )
                    }
                  >
                    recusar
                  </button>
                </div>
              ))}
            </section>
          )}

          {pedidos.enviados.length > 0 && (
            <section className="cartao">
              <h2 className="titulo-secao">pedidos enviados</h2>
              {pedidos.enviados.map((pedido: PedidoAmizade) => (
                <div className="linha-social" key={pedido.id}>
                  <span className="linha-social-nome">{pedido.perfil.nome_tag}</span>
                  <span className="mudo linha-social-kcal">aguardando</span>
                  <button
                    type="button"
                    className="botao-mini"
                    disabled={ocupado}
                    onClick={() =>
                      void comConfirmacao(
                        {
                          titulo: 'cancelar pedido',
                          texto: `o pedido para ${pedido.perfil.nome_tag} some. você pode mandar outro depois.`,
                          rotulo: 'cancelar pedido',
                        },
                        () => api.recusarPedido(pedido.id),
                      )
                    }
                  >
                    cancelar
                  </button>
                </div>
              ))}
            </section>
          )}

          <section className="cartao">
            <h2 className="titulo-secao">amigos</h2>
            {amigos.length === 0 ? (
              <p className="mudo estado-vazio">nenhum amigo ainda</p>
            ) : (
              amigos.map((amigo) => (
                <ProgressoAmigo
                  key={amigo.perfil.id}
                  perfil={amigo.perfil}
                  progresso={amigo.progresso_hoje}
                >
                  <button
                    type="button"
                    className="botao-mini botao-perigo"
                    disabled={ocupado}
                    aria-label={`remover ${amigo.perfil.nome_tag}`}
                    onClick={() =>
                      void comConfirmacao(
                        {
                          titulo: 'remover amigo',
                          texto: `vocês deixam de ver o progresso um do outro no feed.`,
                          rotulo: 'remover',
                        },
                        () => api.removerAmigo(amigo.perfil.id),
                      )
                    }
                  >
                    remover
                  </button>
                </ProgressoAmigo>
              ))
            )}
          </section>
        </>
      )}
      {confirmacao}
    </main>
  );
}
