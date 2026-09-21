import { consultar, consultarUm } from '../db/index.js';

export interface RegistroAgua {
  id: string;
  quantidade_ml: number;
  criado_em: string;
}

interface LinhaAgua {
  id: string;
  quantidade_ml: number;
  criado_em: Date;
}

export async function criarAgua(userId: string, quantidadeMl: number): Promise<RegistroAgua> {
  const linha = await consultarUm<LinhaAgua>(
    `INSERT INTO registros_agua (user_id, quantidade_ml)
     VALUES ($1, $2)
     RETURNING id, quantidade_ml, criado_em`,
    [userId, quantidadeMl],
  );
  if (!linha) throw new Error('INSERT em registros_agua não devolveu linha');
  return { ...linha, criado_em: linha.criado_em.toISOString() };
}

export async function totalAguaNoIntervalo(
  userId: string,
  inicio: Date,
  fim: Date,
): Promise<number> {
  const linhas = await consultar<{ total: number }>(
    `SELECT COALESCE(sum(quantidade_ml), 0)::int AS total FROM registros_agua
     WHERE user_id = $1 AND criado_em >= $2 AND criado_em < $3`,
    [userId, inicio, fim],
  );
  return linhas[0]?.total ?? 0;
}

export async function listarAguaNoIntervalo(
  userId: string,
  inicio: Date,
  fim: Date,
): Promise<RegistroAgua[]> {
  const linhas = await consultar<LinhaAgua>(
    `SELECT id, quantidade_ml, criado_em FROM registros_agua
     WHERE user_id = $1 AND criado_em >= $2 AND criado_em < $3
     ORDER BY criado_em DESC`,
    [userId, inicio, fim],
  );
  return linhas.map((l) => ({ ...l, criado_em: l.criado_em.toISOString() }));
}

export async function apagarAgua(userId: string, id: string): Promise<boolean> {
  const linhas = await consultar<{ id: string }>(
    'DELETE FROM registros_agua WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId],
  );
  return linhas.length > 0;
}
