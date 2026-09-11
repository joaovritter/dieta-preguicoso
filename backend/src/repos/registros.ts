import { consultar, consultarUm } from '../db/index.js';
import { somarTotais } from '../domain/nutricao.js';
import type { Alimento, Refeicao, Registro, TipoEntrada } from '../domain/tipos.js';

interface LinhaRegistro {
  id: string;
  tipo_entrada: TipoEntrada;
  refeicao: Refeicao;
  descricao_bruta: string;
  midia_url: string | null;
  alimentos_detectados: Alimento[];
  calorias_total: number;
  carboidrato_total_g: number;
  proteina_total_g: number;
  gordura_total_g: number;
  criado_em: Date;
}

const COLUNAS = `id, tipo_entrada, refeicao, descricao_bruta, midia_url, alimentos_detectados,
  calorias_total, carboidrato_total_g, proteina_total_g, gordura_total_g, criado_em`;

function paraRegistro(l: LinhaRegistro): Registro {
  return {
    id: l.id,
    tipo_entrada: l.tipo_entrada,
    refeicao: l.refeicao,
    descricao_bruta: l.descricao_bruta,
    midia_url: l.midia_url,
    alimentos_detectados: l.alimentos_detectados ?? [],
    calorias_total: l.calorias_total,
    carboidrato_total_g: l.carboidrato_total_g,
    proteina_total_g: l.proteina_total_g,
    gordura_total_g: l.gordura_total_g,
    criado_em: l.criado_em.toISOString(),
  };
}

export interface NovoRegistro {
  userId: string;
  tipo_entrada: TipoEntrada;
  refeicao: Refeicao;
  descricao_bruta: string;
  midia_url: string | null;
  alimentos: Alimento[];
  criado_em: Date;
}

export async function criarRegistro(n: NovoRegistro): Promise<Registro> {
  const t = somarTotais(n.alimentos);
  const linha = await consultarUm<LinhaRegistro>(
    `INSERT INTO registros_alimentares
       (user_id, tipo_entrada, refeicao, descricao_bruta, midia_url, alimentos_detectados,
        calorias_total, carboidrato_total_g, proteina_total_g, gordura_total_g, criado_em)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11)
     RETURNING ${COLUNAS}`,
    [
      n.userId,
      n.tipo_entrada,
      n.refeicao,
      n.descricao_bruta,
      n.midia_url,
      JSON.stringify(n.alimentos),
      t.calorias,
      t.carboidrato_g,
      t.proteina_g,
      t.gordura_g,
      n.criado_em,
    ],
  );
  if (!linha) throw new Error('INSERT em registros_alimentares não devolveu linha');
  return paraRegistro(linha);
}

export async function listarNoIntervalo(
  userId: string,
  inicio: Date,
  fim: Date,
): Promise<Registro[]> {
  const linhas = await consultar<LinhaRegistro>(
    `SELECT ${COLUNAS} FROM registros_alimentares
     WHERE user_id = $1 AND criado_em >= $2 AND criado_em < $3
     ORDER BY criado_em ASC`,
    [userId, inicio, fim],
  );
  return linhas.map(paraRegistro);
}

export async function buscarRegistro(userId: string, id: string): Promise<Registro | null> {
  const linha = await consultarUm<LinhaRegistro>(
    `SELECT ${COLUNAS} FROM registros_alimentares WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return linha ? paraRegistro(linha) : null;
}

export async function atualizarRegistro(
  userId: string,
  id: string,
  campos: { refeicao?: Refeicao; alimentos?: Alimento[] },
): Promise<Registro | null> {
  const atual = await buscarRegistro(userId, id);
  if (!atual) return null;

  const alimentos = campos.alimentos ?? atual.alimentos_detectados;
  const refeicao = campos.refeicao ?? atual.refeicao;
  const t = somarTotais(alimentos);

  const linha = await consultarUm<LinhaRegistro>(
    `UPDATE registros_alimentares
     SET refeicao = $3, alimentos_detectados = $4::jsonb, calorias_total = $5,
         carboidrato_total_g = $6, proteina_total_g = $7, gordura_total_g = $8
     WHERE id = $1 AND user_id = $2
     RETURNING ${COLUNAS}`,
    [id, userId, refeicao, JSON.stringify(alimentos), t.calorias, t.carboidrato_g, t.proteina_g, t.gordura_g],
  );
  return linha ? paraRegistro(linha) : null;
}

export async function apagarRegistro(userId: string, id: string): Promise<boolean> {
  const linhas = await consultar<{ id: string }>(
    'DELETE FROM registros_alimentares WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId],
  );
  return linhas.length > 0;
}

/** Mídias fora da janela de retenção, para o job de limpeza. */
export async function midiasAntigas(antesDe: Date): Promise<string[]> {
  const linhas = await consultar<{ midia_url: string }>(
    `SELECT midia_url FROM registros_alimentares
     WHERE midia_url IS NOT NULL AND criado_em < $1`,
    [antesDe],
  );
  return linhas.map((l) => l.midia_url);
}

export async function limparMidiasAntigas(antesDe: Date): Promise<void> {
  await consultar(
    'UPDATE registros_alimentares SET midia_url = NULL WHERE midia_url IS NOT NULL AND criado_em < $1',
    [antesDe],
  );
}
