import { consultar, consultarUm } from '../db/index.js';
import { FAIXAS_PADRAO, type FaixaRefeicao, type Perfil } from '../domain/tipos.js';

interface LinhaUsuario {
  id: string;
  email: string;
  password_hash: string;
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
  faixas_refeicao: FaixaRefeicao[] | null;
  timezone: string;
  created_at: Date;
}

const COLUNAS = `id, email, password_hash, nome, sexo, idade, peso_kg, altura_cm, objetivo,
  meta_calorias, meta_carboidrato_g, meta_proteina_g, meta_gordura_g, meta_agua_ml,
  metas_automaticas, modo_preguicoso, faixas_refeicao, timezone, created_at`;

export function paraPerfil(l: LinhaUsuario): Perfil {
  return {
    id: l.id,
    email: l.email,
    nome: l.nome,
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
    faixas_refeicao: l.faixas_refeicao?.length ? l.faixas_refeicao : FAIXAS_PADRAO,
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

export async function criarUsuario(
  email: string,
  passwordHash: string,
  nome: string,
  timezone: string,
): Promise<LinhaUsuario> {
  const linha = await consultarUm<LinhaUsuario>(
    `INSERT INTO users (email, password_hash, nome, timezone)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUNAS}`,
    [email.trim().toLowerCase(), passwordHash, nome.trim(), timezone],
  );
  if (!linha) throw new Error('INSERT em users não devolveu linha');
  return linha;
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
  faixas_refeicao: FaixaRefeicao[];
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
  'faixas_refeicao',
  'timezone',
] as const;

export async function atualizarUsuario(
  id: string,
  campos: CamposAtualizaveis,
): Promise<LinhaUsuario> {
  const nomes = COLUNAS_ATUALIZAVEIS.filter(
    (k) => campos[k as keyof CamposAtualizaveis] !== undefined,
  );

  if (nomes.length === 0) {
    const atual = await buscarPorId(id);
    if (!atual) throw new Error('usuário não encontrado');
    return atual;
  }

  const atribuicoes = nomes.map((nome, i) => `${nome} = $${i + 2}`).join(', ');
  const valores = nomes.map((nome) => {
    const v = campos[nome as keyof CamposAtualizaveis];
    return nome === 'faixas_refeicao' ? JSON.stringify(v) : v;
  });

  const linha = await consultarUm<LinhaUsuario>(
    `UPDATE users SET ${atribuicoes} WHERE id = $1 RETURNING ${COLUNAS}`,
    [id, ...valores],
  );
  if (!linha) throw new Error('usuário não encontrado');
  return linha;
}
