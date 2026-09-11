import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './index.js';

/**
 * Migrador mínimo: aplica em ordem alfabética todo `.sql` da pasta `migrations`
 * que ainda não está registrado, cada um dentro de uma transação.
 * Migration já aplicada é imutável — para corrigir algo, crie a próxima.
 */
async function migrar(): Promise<void> {
  const aqui = dirname(fileURLToPath(import.meta.url));
  const pasta = join(aqui, 'migrations');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      nome        TEXT PRIMARY KEY,
      aplicada_em TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const aplicadas = new Set(
    (await pool.query<{ nome: string }>('SELECT nome FROM _migrations')).rows.map((r) => r.nome),
  );

  const arquivos = (await readdir(pasta)).filter((f) => f.endsWith('.sql')).sort();
  let novas = 0;

  for (const arquivo of arquivos) {
    if (aplicadas.has(arquivo)) continue;
    const sql = await readFile(join(pasta, arquivo), 'utf8');
    const cliente = await pool.connect();
    try {
      await cliente.query('BEGIN');
      await cliente.query(sql);
      await cliente.query('INSERT INTO _migrations (nome) VALUES ($1)', [arquivo]);
      await cliente.query('COMMIT');
      console.log(`[migrate] aplicada: ${arquivo}`);
      novas += 1;
    } catch (e) {
      await cliente.query('ROLLBACK');
      throw new Error(`falha na migration ${arquivo}: ${(e as Error).message}`, { cause: e });
    } finally {
      cliente.release();
    }
  }

  console.log(novas === 0 ? '[migrate] nada a aplicar' : `[migrate] ${novas} migration(s) aplicada(s)`);
}

migrar()
  .then(() => pool.end())
  .catch(async (e: unknown) => {
    console.error('[migrate]', e);
    await pool.end();
    process.exit(1);
  });
