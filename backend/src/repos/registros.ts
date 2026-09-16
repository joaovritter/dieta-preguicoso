import { consultar, consultarUm } from '../db/index.js';
import { somarTotais } from '../domain/nutricao.js';
import { paraPerfilPublico } from '../domain/social.js';
import type {
  Alimento,
  Objetivo,
  Post,
  Registro,
  TipoEntrada,
} from '../domain/tipos.js';

interface LinhaRegistro {
  id: string;
  tipo_entrada: TipoEntrada;
  refeicao_id: string;
  refeicao_nome: string;
  descricao_bruta: string;
  midia_url: string | null;
  alimentos_detectados: Alimento[];
  calorias_total: number;
  carboidrato_total_g: number;
  proteina_total_g: number;
  gordura_total_g: number;
  criado_em: Date;
}

const COLUNAS = `r.id, r.tipo_entrada, r.refeicao_id, ref.nome AS refeicao_nome,
  r.descricao_bruta, r.midia_url, r.alimentos_detectados, r.calorias_total,
  r.carboidrato_total_g, r.proteina_total_g, r.gordura_total_g, r.criado_em`;

const DE = `FROM registros_alimentares r JOIN refeicoes_usuario ref ON ref.id = r.refeicao_id`;

function paraRegistro(l: LinhaRegistro): Registro {
  return {
    id: l.id,
    tipo_entrada: l.tipo_entrada,
    refeicao_id: l.refeicao_id,
    refeicao_nome: l.refeicao_nome,
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

/**
 * `RETURNING` do INSERT/UPDATE não alcança a tabela do JOIN (o nome da refeição),
 * então essas escritas devolvem só o `id` e o registro completo vem daqui.
 */
async function porId(id: string): Promise<Registro> {
  const linha = await consultarUm<LinhaRegistro>(`SELECT ${COLUNAS} ${DE} WHERE r.id = $1`, [id]);
  if (!linha) throw new Error(`registro ${id} sumiu logo após ser gravado`);
  return paraRegistro(linha);
}

export interface NovoRegistro {
  userId: string;
  tipo_entrada: TipoEntrada;
  refeicao_id: string;
  descricao_bruta: string;
  midia_url: string | null;
  alimentos: Alimento[];
  criado_em: Date;
}

export async function criarRegistro(n: NovoRegistro): Promise<Registro> {
  const t = somarTotais(n.alimentos);
  const linha = await consultarUm<{ id: string }>(
    `INSERT INTO registros_alimentares
       (user_id, tipo_entrada, refeicao_id, descricao_bruta, midia_url, alimentos_detectados,
        calorias_total, carboidrato_total_g, proteina_total_g, gordura_total_g, criado_em)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11)
     RETURNING id`,
    [
      n.userId,
      n.tipo_entrada,
      n.refeicao_id,
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
  return porId(linha.id);
}

export async function listarNoIntervalo(
  userId: string,
  inicio: Date,
  fim: Date,
): Promise<Registro[]> {
  const linhas = await consultar<LinhaRegistro>(
    `SELECT ${COLUNAS} ${DE}
     WHERE r.user_id = $1 AND r.criado_em >= $2 AND r.criado_em < $3
     ORDER BY r.criado_em ASC`,
    [userId, inicio, fim],
  );
  return linhas.map(paraRegistro);
}

export async function buscarRegistro(userId: string, id: string): Promise<Registro | null> {
  const linha = await consultarUm<LinhaRegistro>(
    `SELECT ${COLUNAS} ${DE} WHERE r.id = $1 AND r.user_id = $2`,
    [id, userId],
  );
  return linha ? paraRegistro(linha) : null;
}

export async function atualizarRegistro(
  userId: string,
  id: string,
  campos: { refeicao_id?: string; alimentos?: Alimento[] },
): Promise<Registro | null> {
  const atual = await buscarRegistro(userId, id);
  if (!atual) return null;

  const alimentos = campos.alimentos ?? atual.alimentos_detectados;
  const refeicaoId = campos.refeicao_id ?? atual.refeicao_id;
  const t = somarTotais(alimentos);

  const linha = await consultarUm<{ id: string }>(
    `UPDATE registros_alimentares
     SET refeicao_id = $3, alimentos_detectados = $4::jsonb, calorias_total = $5,
         carboidrato_total_g = $6, proteina_total_g = $7, gordura_total_g = $8
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [id, userId, refeicaoId, JSON.stringify(alimentos), t.calorias, t.carboidrato_g, t.proteina_g, t.gordura_g],
  );
  return linha ? porId(linha.id) : null;
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

interface LinhaPost extends LinhaRegistro {
  autor_id: string;
  autor_nome: string;
  autor_tag: string;
  autor_objetivo: Objetivo;
}

/**
 * Refeições de um conjunto de pessoas, mais recentes primeiro — é o feed.
 * `antes` pagina: passe o `criado_em` do último post da página anterior.
 */
export async function feedDeUsuarios(
  userIds: string[],
  antes: Date | null,
  limite: number,
): Promise<Post[]> {
  if (userIds.length === 0) return [];

  const linhas = await consultar<LinhaPost>(
    `SELECT ${COLUNAS},
            u.id AS autor_id, u.nome AS autor_nome, u.tag AS autor_tag,
            u.objetivo AS autor_objetivo
     ${DE}
     JOIN users u ON u.id = r.user_id
     WHERE r.user_id = ANY($1::uuid[])
       AND ($2::timestamptz IS NULL OR r.criado_em < $2)
     ORDER BY r.criado_em DESC
     LIMIT $3`,
    [userIds, antes, limite],
  );

  return linhas.map((l) => ({
    ...paraRegistro(l),
    autor: paraPerfilPublico({
      id: l.autor_id,
      nome: l.autor_nome,
      tag: l.autor_tag,
      objetivo: l.autor_objetivo,
    }),
  }));
}

export interface TotalDoDia {
  calorias: number;
  quantidade: number;
}

/**
 * Calorias somadas por dia do calendário da pessoa, num intervalo. Uma consulta só:
 * o agrupamento por dia local acontece no banco, com o fuso do dono dos registros.
 */
export async function caloriasPorDia(
  userId: string,
  inicio: Date,
  fim: Date,
  timezone: string,
): Promise<Map<string, TotalDoDia>> {
  const linhas = await consultar<{ data: string; calorias: number; quantidade: number }>(
    `SELECT to_char(criado_em AT TIME ZONE $4, 'YYYY-MM-DD') AS data,
            sum(calorias_total) AS calorias,
            count(*)::int AS quantidade
     FROM registros_alimentares
     WHERE user_id = $1 AND criado_em >= $2 AND criado_em < $3
     GROUP BY 1`,
    [userId, inicio, fim, timezone],
  );

  return new Map(
    linhas.map((l) => [l.data, { calorias: Number(l.calorias), quantidade: l.quantidade }]),
  );
}
