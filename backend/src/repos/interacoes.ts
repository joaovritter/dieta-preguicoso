import { consultar, consultarUm } from '../db/index.js';
import { paraPerfilPublico } from '../domain/social.js';
import { SQL_TOTAL_AMIGOS, SQL_TOTAL_POSTS } from './social.js';
import type { Comentario, Objetivo } from '../domain/tipos.js';

export async function donoDoRegistro(registroId: string): Promise<string | null> {
  const linha = await consultarUm<{ user_id: string }>(
    `SELECT r.user_id FROM registros_alimentares r
     JOIN users u ON u.id = r.user_id
     WHERE r.id = $1 AND u.desativada_em IS NULL`,
    [registroId],
  );
  return linha?.user_id ?? null;
}

export async function curtir(registroId: string, userId: string): Promise<void> {
  await consultar(
    `INSERT INTO curtidas (registro_id, user_id) VALUES ($1, $2)
     ON CONFLICT (registro_id, user_id) DO NOTHING`,
    [registroId, userId],
  );
}

export async function descurtir(registroId: string, userId: string): Promise<void> {
  await consultar('DELETE FROM curtidas WHERE registro_id = $1 AND user_id = $2', [
    registroId,
    userId,
  ]);
}

interface LinhaComentario {
  id: string;
  texto: string;
  criado_em: Date;
  autor_id: string;
  autor_nome: string;
  autor_tag: string;
  autor_objetivo: Objetivo;
  autor_foto_url: string | null;
  autor_total_posts: number;
  autor_total_amigos: number;
  dono_post_id: string;
}

const SELECT_COMENTARIO = `SELECT cm.id, cm.texto, cm.criado_em,
    u.id AS autor_id, u.nome AS autor_nome, u.tag AS autor_tag, u.objetivo AS autor_objetivo,
    u.foto_url AS autor_foto_url,
    ${SQL_TOTAL_POSTS} AS autor_total_posts, ${SQL_TOTAL_AMIGOS} AS autor_total_amigos,
    r.user_id AS dono_post_id
  FROM comentarios cm
  JOIN users u ON u.id = cm.user_id
  JOIN registros_alimentares r ON r.id = cm.registro_id`;

function paraComentario(l: LinhaComentario, observadorId: string): Comentario {
  return {
    id: l.id,
    autor: paraPerfilPublico({
      id: l.autor_id,
      nome: l.autor_nome,
      tag: l.autor_tag,
      objetivo: l.autor_objetivo,
      foto_url: l.autor_foto_url,
      total_posts: l.autor_total_posts,
      total_amigos: l.autor_total_amigos,
    }),
    texto: l.texto,
    criado_em: l.criado_em.toISOString(),
    posso_apagar: l.autor_id === observadorId || l.dono_post_id === observadorId,
  };
}

export async function listarComentarios(
  registroId: string,
  observadorId: string,
): Promise<Comentario[]> {
  const linhas = await consultar<LinhaComentario>(
    `${SELECT_COMENTARIO} WHERE cm.registro_id = $1 AND u.desativada_em IS NULL ORDER BY cm.criado_em ASC`,
    [registroId],
  );
  return linhas.map((l) => paraComentario(l, observadorId));
}

export async function criarComentario(
  registroId: string,
  userId: string,
  texto: string,
): Promise<Comentario> {
  const criado = await consultarUm<{ id: string }>(
    'INSERT INTO comentarios (registro_id, user_id, texto) VALUES ($1, $2, $3) RETURNING id',
    [registroId, userId, texto],
  );
  if (!criado) throw new Error('INSERT em comentarios não devolveu linha');
  const linha = await consultarUm<LinhaComentario>(`${SELECT_COMENTARIO} WHERE cm.id = $1`, [
    criado.id,
  ]);
  if (!linha) throw new Error(`comentário ${criado.id} sumiu logo após ser gravado`);
  return paraComentario(linha, userId);
}

/** Apaga se quem pede é o autor do comentário ou o dono do post. `false` = nada apagado. */
export async function apagarComentario(comentarioId: string, userId: string): Promise<boolean> {
  const linhas = await consultar<{ id: string }>(
    `DELETE FROM comentarios cm
     USING registros_alimentares r
     WHERE cm.id = $1 AND r.id = cm.registro_id AND $2 IN (cm.user_id, r.user_id)
     RETURNING cm.id`,
    [comentarioId, userId],
  );
  return linhas.length > 0;
}
