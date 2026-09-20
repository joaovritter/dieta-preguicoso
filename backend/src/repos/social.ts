import { randomInt } from 'node:crypto';
import { consultar, consultarUm } from '../db/index.js';
import type { Grupo, Objetivo } from '../domain/tipos.js';

/** O que precisamos de alguém para mostrar perfil + progresso do dia dessa pessoa. */
export interface UsuarioSocial {
  id: string;
  nome: string;
  tag: string;
  objetivo: Objetivo;
  meta_calorias: number;
  timezone: string;
}

const COLUNAS_SOCIAIS = 'u.id, u.nome, u.tag, u.objetivo, u.meta_calorias, u.timezone';

export async function buscarUsuarioSocial(id: string): Promise<UsuarioSocial | null> {
  return consultarUm<UsuarioSocial>(
    `SELECT ${COLUNAS_SOCIAIS} FROM users u WHERE u.id = $1 AND u.desativada_em IS NULL`,
    [id],
  );
}

// ---------------------------------------------------------------- amizades

export interface LinhaPedido {
  id: string;
  solicitante_id: string;
  destinatario_id: string;
  status: 'pendente' | 'aceita';
  criado_em: Date;
}

/** Qualquer relação entre duas pessoas, em qualquer direção (pedido pendente ou amizade). */
export async function relacaoEntre(a: string, b: string): Promise<LinhaPedido | null> {
  return consultarUm<LinhaPedido>(
    `SELECT id, solicitante_id, destinatario_id, status, criado_em FROM amizades
     WHERE (solicitante_id = $1 AND destinatario_id = $2)
        OR (solicitante_id = $2 AND destinatario_id = $1)`,
    [a, b],
  );
}

export async function saoAmigos(a: string, b: string): Promise<boolean> {
  const linha = await relacaoEntre(a, b);
  return linha?.status === 'aceita';
}

export async function listarAmigos(userId: string): Promise<UsuarioSocial[]> {
  return consultar<UsuarioSocial>(
    `SELECT ${COLUNAS_SOCIAIS} FROM amizades a
     JOIN users u ON u.id = CASE WHEN a.solicitante_id = $1 THEN a.destinatario_id
                                 ELSE a.solicitante_id END
     WHERE a.status = 'aceita' AND $1 IN (a.solicitante_id, a.destinatario_id)
       AND u.desativada_em IS NULL
     ORDER BY lower(u.nome), u.tag`,
    [userId],
  );
}

export interface PedidoComPerfil extends UsuarioSocial {
  pedido_id: string;
  pedido_criado_em: Date;
}

/** Pedidos pendentes: `recebidos` por mim, `enviados` por mim. */
export async function listarPedidos(
  userId: string,
): Promise<{ recebidos: PedidoComPerfil[]; enviados: PedidoComPerfil[] }> {
  const [recebidos, enviados] = await Promise.all([
    consultar<PedidoComPerfil>(
      `SELECT ${COLUNAS_SOCIAIS}, a.id AS pedido_id, a.criado_em AS pedido_criado_em
       FROM amizades a JOIN users u ON u.id = a.solicitante_id
       WHERE a.destinatario_id = $1 AND a.status = 'pendente' AND u.desativada_em IS NULL
       ORDER BY a.criado_em DESC`,
      [userId],
    ),
    consultar<PedidoComPerfil>(
      `SELECT ${COLUNAS_SOCIAIS}, a.id AS pedido_id, a.criado_em AS pedido_criado_em
       FROM amizades a JOIN users u ON u.id = a.destinatario_id
       WHERE a.solicitante_id = $1 AND a.status = 'pendente' AND u.desativada_em IS NULL
       ORDER BY a.criado_em DESC`,
      [userId],
    ),
  ]);
  return { recebidos, enviados };
}

export async function criarPedido(de: string, para: string): Promise<LinhaPedido> {
  const linha = await consultarUm<LinhaPedido>(
    `INSERT INTO amizades (solicitante_id, destinatario_id)
     VALUES ($1, $2)
     RETURNING id, solicitante_id, destinatario_id, status, criado_em`,
    [de, para],
  );
  if (!linha) throw new Error('INSERT em amizades não devolveu linha');
  return linha;
}

/** Aceita um pedido pendente. Só o destinatário consegue. */
export async function aceitarPedido(id: string, destinatarioId: string): Promise<LinhaPedido | null> {
  return consultarUm<LinhaPedido>(
    `UPDATE amizades SET status = 'aceita', respondido_em = now()
     WHERE id = $1 AND destinatario_id = $2 AND status = 'pendente'
     RETURNING id, solicitante_id, destinatario_id, status, criado_em`,
    [id, destinatarioId],
  );
}

/** Recusa (destinatário) ou cancela (solicitante) um pedido pendente. */
export async function apagarPedido(id: string, userId: string): Promise<boolean> {
  const linhas = await consultar<{ id: string }>(
    `DELETE FROM amizades
     WHERE id = $1 AND status = 'pendente' AND $2 IN (solicitante_id, destinatario_id)
     RETURNING id`,
    [id, userId],
  );
  return linhas.length > 0;
}

export async function desfazerAmizade(userId: string, outroId: string): Promise<boolean> {
  const linhas = await consultar<{ id: string }>(
    `DELETE FROM amizades
     WHERE status = 'aceita'
       AND ((solicitante_id = $1 AND destinatario_id = $2)
         OR (solicitante_id = $2 AND destinatario_id = $1))
     RETURNING id`,
    [userId, outroId],
  );
  return linhas.length > 0;
}

// ------------------------------------------------------------------ grupos

export interface LinhaGrupo {
  id: string;
  nome: string;
  codigo_convite: string;
  criador_id: string;
  criado_em: Date;
  quantidade_membros: number;
}

const SELECT_GRUPO = `SELECT g.id, g.nome, g.codigo_convite, g.criador_id, g.criado_em,
    (SELECT count(*)::int FROM grupo_membros m
       JOIN users mu ON mu.id = m.user_id
      WHERE m.grupo_id = g.id AND mu.desativada_em IS NULL) AS quantidade_membros
  FROM grupos g`;

export function paraGrupo(l: LinhaGrupo, userId: string, minhaPosicao: number | null): Grupo {
  return {
    id: l.id,
    nome: l.nome,
    codigo_convite: l.codigo_convite,
    quantidade_membros: l.quantidade_membros,
    sou_criador: l.criador_id === userId,
    criado_em: l.criado_em.toISOString(),
    minha_posicao_semana: minhaPosicao,
  };
}

// Sem vogais nem caracteres que se confundem (0/O, 1/I): o código é lido em voz alta.
const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function sortearCodigo(): string {
  let codigo = '';
  for (let i = 0; i < 6; i += 1) {
    codigo += ALFABETO_CODIGO[randomInt(0, ALFABETO_CODIGO.length)];
  }
  return codigo;
}

export async function criarGrupo(nome: string, criadorId: string): Promise<LinhaGrupo> {
  // O código é aleatório: repetir é raríssimo, mas o índice único é quem decide.
  for (let tentativa = 0; tentativa < 5; tentativa += 1) {
    const codigo = sortearCodigo();
    if (await buscarGrupoPorCodigo(codigo)) continue;

    const criado = await consultarUm<{ id: string }>(
      'INSERT INTO grupos (nome, codigo_convite, criador_id) VALUES ($1, $2, $3) RETURNING id',
      [nome, codigo, criadorId],
    );
    if (!criado) throw new Error('INSERT em grupos não devolveu linha');

    await entrarNoGrupo(criado.id, criadorId);
    const linha = await buscarGrupo(criado.id);
    if (!linha) throw new Error('grupo recém-criado não encontrado');
    return linha;
  }
  throw new Error('não consegui sortear um código de convite livre');
}

export async function buscarGrupo(id: string): Promise<LinhaGrupo | null> {
  return consultarUm<LinhaGrupo>(`${SELECT_GRUPO} WHERE g.id = $1`, [id]);
}

export async function buscarGrupoPorCodigo(codigo: string): Promise<LinhaGrupo | null> {
  return consultarUm<LinhaGrupo>(`${SELECT_GRUPO} WHERE upper(g.codigo_convite) = upper($1)`, [
    codigo,
  ]);
}

export async function listarGruposDoUsuario(userId: string): Promise<LinhaGrupo[]> {
  return consultar<LinhaGrupo>(
    `${SELECT_GRUPO}
     JOIN grupo_membros meu ON meu.grupo_id = g.id AND meu.user_id = $1
     ORDER BY lower(g.nome)`,
    [userId],
  );
}

export async function ehMembro(grupoId: string, userId: string): Promise<boolean> {
  const linha = await consultarUm<{ user_id: string }>(
    'SELECT user_id FROM grupo_membros WHERE grupo_id = $1 AND user_id = $2',
    [grupoId, userId],
  );
  return linha !== null;
}

export async function entrarNoGrupo(grupoId: string, userId: string): Promise<void> {
  await consultar(
    `INSERT INTO grupo_membros (grupo_id, user_id) VALUES ($1, $2)
     ON CONFLICT (grupo_id, user_id) DO NOTHING`,
    [grupoId, userId],
  );
}

/** Sai do grupo. Se ninguém mais ficou, o grupo some junto. */
export async function sairDoGrupo(grupoId: string, userId: string): Promise<void> {
  await consultar('DELETE FROM grupo_membros WHERE grupo_id = $1 AND user_id = $2', [
    grupoId,
    userId,
  ]);
  await consultar(
    `DELETE FROM grupos g
     WHERE g.id = $1 AND NOT EXISTS (SELECT 1 FROM grupo_membros m WHERE m.grupo_id = g.id)`,
    [grupoId],
  );
}

export async function membrosDoGrupo(grupoId: string): Promise<UsuarioSocial[]> {
  return consultar<UsuarioSocial>(
    `SELECT ${COLUNAS_SOCIAIS} FROM grupo_membros m
     JOIN users u ON u.id = m.user_id
     WHERE m.grupo_id = $1 AND u.desativada_em IS NULL
     ORDER BY lower(u.nome), u.tag`,
    [grupoId],
  );
}

export async function dividemGrupo(a: string, b: string): Promise<boolean> {
  const linha = await consultarUm<{ grupo_id: string }>(
    `SELECT ma.grupo_id FROM grupo_membros ma
     JOIN grupo_membros mb ON mb.grupo_id = ma.grupo_id AND mb.user_id = $2
     WHERE ma.user_id = $1
     LIMIT 1`,
    [a, b],
  );
  return linha !== null;
}

/** Todo mundo cujo progresso a pessoa enxerga, menos ela mesma: amigos aceitos e colegas de grupo ativos. */
export async function idsVisiveis(userId: string): Promise<string[]> {
  const linhas = await consultar<{ id: string }>(
    `SELECT v.id FROM (
       SELECT CASE WHEN a.solicitante_id = $1 THEN a.destinatario_id ELSE a.solicitante_id END AS id
       FROM amizades a
       WHERE a.status = 'aceita' AND $1 IN (a.solicitante_id, a.destinatario_id)
       UNION
       SELECT outro.user_id AS id
       FROM grupo_membros meu
       JOIN grupo_membros outro ON outro.grupo_id = meu.grupo_id AND outro.user_id <> $1
       WHERE meu.user_id = $1
     ) v
     JOIN users u ON u.id = v.id
     WHERE u.desativada_em IS NULL`,
    [userId],
  );
  return linhas.map((l) => l.id);
}

async function estaAtiva(userId: string): Promise<boolean> {
  const linha = await consultarUm<{ id: string }>(
    'SELECT id FROM users WHERE id = $1 AND desativada_em IS NULL',
    [userId],
  );
  return linha !== null;
}

/**
 * Regra de privacidade da rede: só vê o progresso de alguém quem é a própria pessoa,
 * amigo dela ou divide um grupo com ela.
 */
export async function podeVer(observadorId: string, alvoId: string): Promise<boolean> {
  if (observadorId === alvoId) return true;
  if (!(await estaAtiva(alvoId))) return false;
  if (await saoAmigos(observadorId, alvoId)) return true;
  return dividemGrupo(observadorId, alvoId);
}
