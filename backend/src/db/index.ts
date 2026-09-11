import pg from 'pg';
import { env } from '../env.js';

// NUMERIC volta como string no driver por padrão, para não perder precisão.
// Aqui todos os valores são nutricionais e cabem folgado num double, então
// converter na borda evita `Number(...)` espalhado por todo repositório.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (v) => Number(v));
pg.types.setTypeParser(pg.types.builtins.INT8, (v) => Number(v));

export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
});

export async function consultar<T extends pg.QueryResultRow>(
  sql: string,
  params: readonly unknown[] = [],
): Promise<T[]> {
  const r = await pool.query<T>(sql, params as unknown[]);
  return r.rows;
}

export async function consultarUm<T extends pg.QueryResultRow>(
  sql: string,
  params: readonly unknown[] = [],
): Promise<T | null> {
  const linhas = await consultar<T>(sql, params);
  return linhas[0] ?? null;
}
