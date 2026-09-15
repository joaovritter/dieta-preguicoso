import type pg from 'pg';
import { consultar, consultarUm, pool } from '../db/index.js';
import { acomodar } from '../domain/refeicao.js';
import { AppError } from '../lib/erros.js';
import { REFEICOES_INICIAIS, type Refeicao } from '../domain/tipos.js';

const COLUNAS = 'id, nome, inicio, fim';

export async function listarRefeicoes(userId: string): Promise<Refeicao[]> {
  return consultar<Refeicao>(
    `SELECT ${COLUNAS} FROM refeicoes_usuario WHERE user_id = $1 ORDER BY inicio ASC`,
    [userId],
  );
}

export async function buscarRefeicao(userId: string, id: string): Promise<Refeicao | null> {
  return consultarUm<Refeicao>(
    `SELECT ${COLUNAS} FROM refeicoes_usuario WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
}

/** Conta nova: sem refeição nenhuma não dá para registrar comida. */
export async function semearRefeicoes(cliente: pg.PoolClient, userId: string): Promise<void> {
  for (const r of REFEICOES_INICIAIS) {
    await cliente.query(
      'INSERT INTO refeicoes_usuario (user_id, nome, inicio, fim) VALUES ($1, $2, $3, $4)',
      [userId, r.nome, r.inicio, r.fim],
    );
  }
}

/**
 * Criar e mover acontecem numa transação só: as vizinhas mudam junto, ou nada
 * muda. Meio caminho aqui significaria um dia com buraco ou sobreposição.
 */
export async function criarRefeicao(
  userId: string,
  dados: { nome: string; inicio: string; fim: string },
): Promise<Refeicao> {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const existentes = await listarNaTransacao(cliente, userId);
    const mudadas = acomodar(existentes, { inicio: dados.inicio, fim: dados.fim });
    await aplicarMudancas(cliente, userId, mudadas);

    const nova = await cliente.query<Refeicao>(
      `INSERT INTO refeicoes_usuario (user_id, nome, inicio, fim)
       VALUES ($1, $2, $3, $4) RETURNING ${COLUNAS}`,
      [userId, dados.nome, dados.inicio, dados.fim],
    );
    await cliente.query('COMMIT');
    return nova.rows[0]!;
  } catch (e) {
    await cliente.query('ROLLBACK');
    throw traduzirConflito(e);
  } finally {
    cliente.release();
  }
}

export async function atualizarRefeicao(
  userId: string,
  id: string,
  campos: { nome?: string; inicio?: string; fim?: string },
): Promise<Refeicao | null> {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const existentes = await listarNaTransacao(cliente, userId);
    const atual = existentes.find((r) => r.id === id);
    if (!atual) {
      await cliente.query('ROLLBACK');
      return null;
    }

    const inicio = campos.inicio ?? atual.inicio;
    const fim = campos.fim ?? atual.fim;
    if (inicio !== atual.inicio || fim !== atual.fim) {
      await aplicarMudancas(cliente, userId, acomodar(existentes, { inicio, fim }, id));
    }

    const linha = await cliente.query<Refeicao>(
      `UPDATE refeicoes_usuario SET nome = $3, inicio = $4, fim = $5
       WHERE id = $1 AND user_id = $2 RETURNING ${COLUNAS}`,
      [id, userId, campos.nome ?? atual.nome, inicio, fim],
    );
    await cliente.query('COMMIT');
    return linha.rows[0] ?? null;
  } catch (e) {
    await cliente.query('ROLLBACK');
    throw traduzirConflito(e);
  } finally {
    cliente.release();
  }
}

export async function apagarRefeicao(userId: string, id: string): Promise<boolean> {
  const emUso = await consultarUm<{ existe: boolean }>(
    'SELECT EXISTS (SELECT 1 FROM registros_alimentares WHERE refeicao_id = $1) AS existe',
    [id],
  );
  if (emUso?.existe) {
    throw new AppError(
      'REFEICAO_EM_USO',
      'essa refeição já tem comida registrada. renomeie em vez de apagar',
    );
  }
  const linhas = await consultar<{ id: string }>(
    'DELETE FROM refeicoes_usuario WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId],
  );
  return linhas.length > 0;
}

async function listarNaTransacao(cliente: pg.PoolClient, userId: string): Promise<Refeicao[]> {
  const r = await cliente.query<Refeicao>(
    `SELECT ${COLUNAS} FROM refeicoes_usuario WHERE user_id = $1 ORDER BY inicio ASC FOR UPDATE`,
    [userId],
  );
  return r.rows;
}

async function aplicarMudancas(
  cliente: pg.PoolClient,
  userId: string,
  mudadas: Refeicao[],
): Promise<void> {
  for (const m of mudadas) {
    await cliente.query(
      'UPDATE refeicoes_usuario SET inicio = $3, fim = $4 WHERE id = $1 AND user_id = $2',
      [m.id, userId, m.inicio, m.fim],
    );
  }
}

/** O índice único de nome vira mensagem de gente em vez de erro do Postgres. */
function traduzirConflito(e: unknown): unknown {
  if ((e as { code?: string }).code === '23505') {
    return new AppError('VALIDACAO', 'você já tem uma refeição com esse nome');
  }
  return e;
}
