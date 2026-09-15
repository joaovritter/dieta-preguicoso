import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, mensagemDoErro } from '../lib/api';
import Erro from '../components/Erro';
import { useConfirmacao } from '../components/useConfirmacao';
import CardPost from '../components/CardPost';
import ProgressoAmigo from '../components/ProgressoAmigo';
import type { DetalheGrupo, Feed } from '../lib/types';

export default function GrupoPage() {
  const { id = '' } = useParams();
  const navegar = useNavigate();
  const [detalhe, setDetalhe] = useState<DetalheGrupo | null>(null);
  const [feed, setFeed] = useState<Feed | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const { confirmar, elemento: confirmacao } = useConfirmacao();

  const carregar = useCallback(async () => {
    try {
      const [dados, primeiraPagina] = await Promise.all([api.grupo(id), api.feedDoGrupo(id)]);
      setDetalhe(dados);
      setFeed(primeiraPagina);
      setErro(null);
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    }
  }, [id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function carregarMais() {
    if (feed === null || feed.proximo_antes === null) return;
    setOcupado(true);
    try {
      const pagina = await api.feedDoGrupo(id, feed.proximo_antes);
      setFeed({ posts: [...feed.posts, ...pagina.posts], proximo_antes: pagina.proximo_antes });
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    } finally {
      setOcupado(false);
    }
  }

  async function copiarCodigo(codigo: string) {
    try {
      await navigator.clipboard.writeText(codigo);
      setAviso('código copiado');
    } catch {
      setAviso('não consegui copiar — o código é ' + codigo);
    }
  }

  async function sair() {
    const nome = detalhe === null ? 'o grupo' : detalhe.grupo.nome;
    const ok = await confirmar({
      titulo: 'sair do grupo',
      texto: `você perde o feed de ${nome}. para voltar, vai precisar do código de convite.`,
      rotulo: 'sair',
    });
    if (!ok) return;

    setOcupado(true);
    try {
      await api.sairDoGrupo(id);
      navegar('/grupos');
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
      setOcupado(false);
    }
  }

  return (
    <main className="app" style={{ paddingBottom: 32 }}>
      <header className="topo">
        <h1>{detalhe === null ? 'grupo' : detalhe.grupo.nome}</h1>
        <div>
          <Link className="link-texto" to="/grupos">
            voltar
          </Link>
        </div>
      </header>

      {erro !== null && <Erro mensagem={erro} aoFechar={() => setErro(null)} />}
      {aviso !== null && (
        <p className="mudo" role="status">
          {aviso}
        </p>
      )}

      {detalhe === null ? (
        <p className="carregando-pagina">carregando...</p>
      ) : (
        <>
          <section className="cartao">
            <h2 className="titulo-secao">convite</h2>
            <div className="linha-form">
              <span className="codigo-convite num">{detalhe.grupo.codigo_convite}</span>
              <button
                type="button"
                className="botao"
                onClick={() => void copiarCodigo(detalhe.grupo.codigo_convite)}
              >
                copiar
              </button>
            </div>
          </section>

          <section className="cartao">
            <h2 className="titulo-secao">membros</h2>
            {detalhe.membros.length === 0 ? (
              <p className="mudo estado-vazio">ninguém aqui ainda</p>
            ) : (
              detalhe.membros.map((membro) => (
                <ProgressoAmigo
                  key={membro.perfil.id}
                  perfil={membro.perfil}
                  progresso={membro.progresso_hoje}
                />
              ))
            )}
          </section>

          <h2 className="titulo-secao">feed</h2>
          {feed === null ? (
            <p className="carregando-pagina">carregando o feed...</p>
          ) : feed.posts.length === 0 ? (
            <section className="cartao">
              <p className="mudo estado-vazio">nada registrado ainda por aqui</p>
            </section>
          ) : (
            <>
              {feed.posts.map((post) => (
                <CardPost key={post.id} post={post} />
              ))}
              {feed.proximo_antes !== null && (
                <button
                  type="button"
                  className="botao"
                  style={{ width: '100%' }}
                  disabled={ocupado}
                  onClick={() => void carregarMais()}
                >
                  {ocupado ? 'carregando...' : 'carregar mais'}
                </button>
              )}
            </>
          )}

          <button
            type="button"
            className="botao botao-perigo"
            style={{ width: '100%', marginTop: 24 }}
            disabled={ocupado}
            onClick={() => void sair()}
          >
            sair do grupo
          </button>
        </>
      )}
      {confirmacao}
    </main>
  );
}
