import { createElement, useCallback, useEffect, useState, type ReactNode } from 'react';
import FolhaComentarios from './FolhaComentarios';
import { api, mensagemDoErro } from '../../lib/api';
import { alternarCurtida, definirSalvo } from '../../lib/social';
import type { Feed, Post } from '../../lib/types';

/** Feed paginado + curtida otimista + folha de comentários, para qualquer origem de posts. */
export function useFeed(buscar: (antes?: string) => Promise<Feed>) {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [comentando, setComentando] = useState<Post | null>(null);

  const recarregar = useCallback(async () => {
    try {
      setFeed(await buscar());
      setErro(null);
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    }
  }, [buscar]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const trocarPost = useCallback((id: string, mudar: (post: Post) => Post) => {
    setFeed((atual) =>
      atual === null ? atual : { ...atual, posts: atual.posts.map((p) => (p.id === id ? mudar(p) : p)) },
    );
  }, []);

  async function carregarMais() {
    if (feed === null || feed.proximo_antes === null) return;
    setCarregando(true);
    try {
      const pagina = await buscar(feed.proximo_antes);
      setFeed({ posts: [...feed.posts, ...pagina.posts], proximo_antes: pagina.proximo_antes });
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    } finally {
      setCarregando(false);
    }
  }

  function curtir(post: Post) {
    trocarPost(post.id, alternarCurtida);
    const chamada = post.curti ? api.descurtir(post.id) : api.curtir(post.id);
    chamada.catch((falha: unknown) => {
      trocarPost(post.id, alternarCurtida); // desfaz a troca otimista
      setErro(mensagemDoErro(falha));
    });
  }

  function salvar(post: Post) {
    if (post.salvo) return; // desfazer é na aba Salvos do perfil
    trocarPost(post.id, (p) => definirSalvo(p, true));
    api.salvarRefeicao(post.id).catch((falha: unknown) => {
      trocarPost(post.id, (p) => definirSalvo(p, false)); // desfaz a troca otimista
      setErro(mensagemDoErro(falha));
    });
  }

  const folha: ReactNode = createElement(FolhaComentarios, {
    post: comentando,
    aoFechar: () => setComentando(null),
    aoMudarContagem: (postId: string, delta: number) =>
      trocarPost(postId, (p) => ({ ...p, comentarios: Math.max(0, p.comentarios + delta) })),
  });

  return {
    feed,
    erro,
    limparErro: () => setErro(null),
    carregando,
    carregarMais,
    recarregar,
    curtir,
    salvar,
    abrirComentarios: setComentando,
    folha,
  };
}
