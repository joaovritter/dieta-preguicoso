import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, mensagemDoErro } from '../lib/api';
import { TEXTO_STATUS, deISO, hojeISO, numero } from '../lib/format';
import Erro from '../components/Erro';
import GradeCalendario from '../components/calendario/GradeCalendario';
import CardPost from '../components/CardPost';
import type { CalendarioMes, Feed, MembroComProgresso } from '../lib/types';

function mesAtual(): string {
  return hojeISO().slice(0, 7);
}

function deslocarMes(mes: string, passo: number): string {
  const [ano, numeroMes] = mes.split('-').map(Number);
  const data = new Date(ano, numeroMes - 1 + passo, 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}

function nomeDoMes(mes: string): string {
  return deISO(`${mes}-01`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export default function PerfilPublico() {
  const { id = '' } = useParams();
  const [pessoa, setPessoa] = useState<MembroComProgresso | null>(null);
  const [feed, setFeed] = useState<Feed | null>(null);
  const [mes, setMes] = useState(mesAtual);
  const [calendario, setCalendario] = useState<CalendarioMes | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const [dados, primeiraPagina] = await Promise.all([api.perfilPublico(id), api.refeicoesDe(id)]);
      setPessoa(dados);
      setFeed(primeiraPagina);
      setErro(null);
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    }
  }, [id]);

  const carregarCalendario = useCallback(async () => {
    try {
      setCalendario(await api.calendarioDe(id, mes));
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    }
  }, [id, mes]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    void carregarCalendario();
  }, [carregarCalendario]);

  async function carregarMais() {
    if (feed === null || feed.proximo_antes === null) return;
    setOcupado(true);
    try {
      const pagina = await api.refeicoesDe(id, feed.proximo_antes);
      setFeed({ posts: [...feed.posts, ...pagina.posts], proximo_antes: pagina.proximo_antes });
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <main className="app" style={{ paddingBottom: 32 }}>
      <header className="topo">
        <h1>{pessoa === null ? 'perfil' : pessoa.perfil.nome_tag}</h1>
        <div>
          <Link className="link-texto" to="/amigos">
            amigos
          </Link>
          <Link className="link-texto" to="/">
            voltar
          </Link>
        </div>
      </header>

      {erro !== null && <Erro mensagem={erro} aoFechar={() => setErro(null)} />}

      {pessoa === null ? (
        <p className="carregando-pagina">carregando...</p>
      ) : (
        <>
          <section className="cartao">
            <h2 className="titulo-secao">hoje</h2>
            <div className="linha-social">
              <span
                className={`ponto-status status-${pessoa.progresso_hoje.status}`}
                aria-hidden="true"
              />
              <span className="linha-social-nome num">
                {numero(pessoa.progresso_hoje.calorias)} / {numero(pessoa.progresso_hoje.meta_calorias)} kcal
              </span>
              <span className="linha-social-kcal">{TEXTO_STATUS[pessoa.progresso_hoje.status]}</span>
            </div>
          </section>

          <section className="cartao">
            <div className="cal-topo">
              <button
                type="button"
                className="botao-mini"
                aria-label="mês anterior"
                onClick={() => setMes(deslocarMes(mes, -1))}
              >
                ‹
              </button>
              <span className="cal-mes">{nomeDoMes(mes)}</span>
              <button
                type="button"
                className="botao-mini"
                aria-label="mês seguinte"
                disabled={mes >= mesAtual()}
                onClick={() => setMes(deslocarMes(mes, 1))}
              >
                ›
              </button>
            </div>
            {calendario === null ? (
              <p className="mudo estado-vazio">carregando o mês...</p>
            ) : (
              <GradeCalendario dias={calendario.dias} hoje={hojeISO()} selecionada={null} />
            )}
          </section>

          <h2 className="titulo-secao">refeições</h2>
          {feed === null ? (
            <p className="carregando-pagina">carregando as refeições...</p>
          ) : feed.posts.length === 0 ? (
            <section className="cartao">
              <p className="mudo estado-vazio">nada registrado ainda</p>
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
        </>
      )}
    </main>
  );
}
