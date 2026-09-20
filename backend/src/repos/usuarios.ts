import { randomInt } from 'node:crypto';
import { consultar, consultarUm, pool } from '../db/index.js';
import { AppError } from '../lib/erros.js';
import type { Perfil } from '../domain/tipos.js';
import { semearRefeicoes } from './refeicoes.js';

interface LinhaUsuario {
  id: string;
  email: string;
  password_hash: string;
  nome: string;
  tag: string;
  sexo: 'M' | 'F' | null;
  idade: number | null;
  peso_kg: number | null;
  altura_cm: number | null;
  objetivo: Perfil['objetivo'];
  meta_calorias: number;
  meta_carboidrato_g: number;
  meta_proteina_g: number;
  meta_gordura_g: number;
  meta_agua_ml: number;
  metas_automaticas: boolean;
  modo_preguicoso: boolean;
  timezone: string;
  created_at: Date;
}

const COLUNAS = `id, email, password_hash, nome, tag, sexo, idade, peso_kg, altura_cm, objetivo,
  meta_calorias, meta_carboidrato_g, meta_proteina_g, meta_gordura_g, meta_agua_ml,
  metas_automaticas, modo_preguicoso, timezone, created_at`;

export function paraPerfil(l: LinhaUsuario): Perfil {
  return {
    id: l.id,
    email: l.email,
    nome: l.nome,
    tag: l.tag,
    sexo: l.sexo,
    idade: l.idade,
    peso_kg: l.peso_kg,
    altura_cm: l.altura_cm,
    objetivo: l.objetivo,
    meta_calorias: l.meta_calorias,
    meta_carboidrato_g: l.meta_carboidrato_g,
    meta_proteina_g: l.meta_proteina_g,
    meta_gordura_g: l.meta_gordura_g,
    meta_agua_ml: l.meta_agua_ml,
    metas_automaticas: l.metas_automaticas,
    modo_preguicoso: l.modo_preguicoso,
    timezone: l.timezone,
    criado_em: l.created_at.toISOString(),
  };
}

export async function buscarPorEmail(email: string): Promise<LinhaUsuario | null> {
  return consultarUm<LinhaUsuario>(
    `SELECT ${COLUNAS} FROM users WHERE lower(email) = lower($1)`,
    [email],
  );
}

export async function buscarPorId(id: string): Promise<LinhaUsuario | null> {
  return consultarUm<LinhaUsuario>(`SELECT ${COLUNAS} FROM users WHERE id = $1`, [id]);
}

export async function contarUsuarios(): Promise<number> {
  const linhas = await consultar<{ total: number }>('SELECT count(*)::int AS total FROM users');
  return linhas[0]?.total ?? 0;
}

/**
 * Sorteia uma tag de 4 dígitos livre para esse nome (é o par nome+tag que precisa ser
 * único, como no Discord). Devolve a `preferida` quando ela ainda estiver disponível.
 */
export async function tagLivrePara(nome: string, preferida?: string): Promise<string> {
  const usadas = new Set(
    (
      await consultar<{ tag: string }>('SELECT tag FROM users WHERE lower(nome) = lower($1)', [
        nome,
      ])
    ).map((l) => l.tag),
  );

  if (preferida !== undefined && !usadas.has(preferida)) return preferida;
  if (usadas.size >= 10000) {
    throw new AppError('VALIDACAO', 'esse nome já tem 10 mil pessoas, escolha outro');
  }

  for (;;) {
    const candidata = String(randomInt(0, 10000)).padStart(4, '0');
    if (!usadas.has(candidata)) return candidata;
  }
}

export async function buscarPorNomeTag(nome: string, tag: string): Promise<LinhaUsuario | null> {
  return consultarUm<LinhaUsuario>(
    `SELECT ${COLUNAS} FROM users WHERE lower(nome) = lower($1) AND tag = $2`,
    [nome, tag],
  );
}

/** Conta e refeições nascem juntas na mesma transação, ou nenhuma das duas nasce. */
export async function criarUsuario(
  email: string,
  passwordHash: string,
  nome: string,
  timezone: string,
): Promise<LinhaUsuario> {
  const limpo = nome.trim();
  const tag = await tagLivrePara(limpo);

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await cliente.query<LinhaUsuario>(
      `INSERT INTO users (email, password_hash, nome, tag, timezone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${COLUNAS}`,
      [email.trim().toLowerCase(), passwordHash, limpo, tag, timezone],
    );
    const linha = resultado.rows[0];
    if (!linha) throw new Error('INSERT em users não devolveu linha');

    await semearRefeicoes(cliente, linha.id);

    await cliente.query('COMMIT');
    return linha;
  } catch (e) {
    await cliente.query('ROLLBACK');
    throw e;
  } finally {
    cliente.release();
  }
}

/** Campos do perfil que o usuário pode alterar. `undefined` significa "não mexe". */
export type CamposAtualizaveis = Partial<{
  nome: string;
  sexo: 'M' | 'F' | null;
  idade: number | null;
  peso_kg: number | null;
  altura_cm: number | null;
  objetivo: Perfil['objetivo'];
  meta_calorias: number;
  meta_carboidrato_g: number;
  meta_proteina_g: number;
  meta_gordura_g: number;
  meta_agua_ml: number;
  metas_automaticas: boolean;
  modo_preguicoso: boolean;
  timezone: string;
}>;

/**
 * Whitelist de colunas. Os nomes entram interpolados no SQL (não dá pra parametrizar
 * identificador), então nunca confie só na validação da rota para filtrá-los.
 */
const COLUNAS_ATUALIZAVEIS = [
  'nome',
  'sexo',
  'idade',
  'peso_kg',
  'altura_cm',
  'objetivo',
  'meta_calorias',
  'meta_carboidrato_g',
  'meta_proteina_g',
  'meta_gordura_g',
  'meta_agua_ml',
  'metas_automaticas',
  'modo_preguicoso',
  'timezone',
] as const;

export async function atualizarUsuario(
  id: string,
  campos: CamposAtualizaveis,
): Promise<LinhaUsuario> {
  // Trocar de nome pode esbarrar em alguém que já usa esse nome com a mesma tag:
  // nesse caso o servidor sorteia outra tag em vez de recusar a troca.
  if (campos.nome !== undefined) {
    const atual = await buscarPorId(id);
    if (atual && atual.nome.toLowerCase() !== campos.nome.toLowerCase()) {
      const tag = await tagLivrePara(campos.nome, atual.tag);
      if (tag !== atual.tag) {
        await consultar('UPDATE users SET tag = $2 WHERE id = $1', [id, tag]);
      }
    }
  }

  const nomes = COLUNAS_ATUALIZAVEIS.filter(
    (k) => campos[k as keyof CamposAtualizaveis] !== undefined,
  );

  if (nomes.length === 0) {
    const atual = await buscarPorId(id);
    if (!atual) throw new Error('usuário não encontrado');
    return atual;
  }

  const atribuicoes = nomes.map((nome, i) => `${nome} = $${i + 2}`).join(', ');
  const valores = nomes.map((nome) => campos[nome as keyof CamposAtualizaveis]);

  const linha = await consultarUm<LinhaUsuario>(
    `UPDATE users SET ${atribuicoes} WHERE id = $1 RETURNING ${COLUNAS}`,
    [id, ...valores],
  );
  if (!linha) throw new Error('usuário não encontrado');
  return linha;
}

export async function atualizarSenha(id: string, passwordHash: string): Promise<void> {
  await consultar('UPDATE users SET password_hash = $2 WHERE id = $1', [id, passwordHash]);
}
