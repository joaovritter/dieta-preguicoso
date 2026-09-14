import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, mensagemDoErro } from '../lib/api';
import Erro from '../components/Erro';
import type { Grupo } from '../lib/types';

export default function Grupos() {
  const [grupos, setGrupos] = useState<Grupo[] | null>(null);
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const lista = await api.grupos();
      setGrupos(lista.grupos);
      setErro(null);
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

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

  function criar(evento: React.FormEvent) {
    evento.preventDefault();
    const valor = nome.trim();
    if (valor === '') return;
    void comOcupado(async () => {
      await api.criarGrupo(valor);
      setNome('');
    });
  }

  function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    const valor = codigo.trim();
    if (valor === '') return;
    void comOcupado(async () => {
      await api.entrarNoGrupo(valor);
      setCodigo('');
    });
  }

  return (
    <main className="app" style={{ paddingBottom: 32 }}>
      <header className="topo">
        <h1>grupos</h1>
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

      <section className="cartao">
        <h2 className="titulo-secao">criar grupo</h2>
        <form className="linha-form" onSubmit={criar}>
          <input
            className="campo-entrada"
            value={nome}
            placeholder="nome do grupo"
            aria-label="nome do grupo novo"
            onChange={(evento) => setNome(evento.target.value)}
          />
          <button type="submit" className="botao botao-primario" disabled={ocupado}>
            criar
          </button>
        </form>
      </section>

      <section className="cartao">
        <h2 className="titulo-secao">entrar por código</h2>
        <form className="linha-form" onSubmit={entrar}>
          <input
            className="campo-entrada"
            value={codigo}
            placeholder="K3F9QZ"
            aria-label="código de convite"
            onChange={(evento) => setCodigo(evento.target.value.toUpperCase())}
          />
          <button type="submit" className="botao" disabled={ocupado}>
            entrar
          </button>
        </form>
      </section>

      {grupos === null ? (
        <p className="carregando-pagina">carregando...</p>
      ) : grupos.length === 0 ? (
        <section className="cartao">
          <p className="mudo estado-vazio">nenhum grupo ainda</p>
        </section>
      ) : (
        <section>
          <h2 className="titulo-secao">meus grupos</h2>
          {grupos.map((grupo) => (
            <Link className="cartao cartao-link" key={grupo.id} to={`/grupos/${grupo.id}`}>
              <span className="grupo-nome">{grupo.nome}</span>
              <span className="mudo num" style={{ fontSize: 13 }}>
                {grupo.quantidade_membros} {grupo.quantidade_membros === 1 ? 'membro' : 'membros'} ·{' '}
                {grupo.codigo_convite}
              </span>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
