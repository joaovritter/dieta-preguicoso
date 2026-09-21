import { consultar, consultarUm } from '../db/index.js';
import type { Alimento, RefeicaoSalva } from '../domain/tipos.js';

interface LinhaSalva {
  id: string;
  nome: string;
  alimentos: Alimento[];
  calorias_total: number;
  carboidrato_total_g: number;
  proteina_total_g: number;
  gordura_total_g: number;
  origem_registro_id: string | null;
  origem_autor_id: string | null;
  origem_autor_nome: string | null;
  criado_em: Date;
}

const COLUNAS = `id, nome, alimentos, calorias_total, carboidrato_total_g, proteina_total_g,
  gordura_total_g, origem_registro_id, origem_autor_id, origem_autor_nome, criado_em`;

function paraSalva(l: LinhaSalva): RefeicaoSalva {
  return { ...l, alimentos: l.alimentos ?? [], criado_em: l.criado_em.toISOString() };
}

/**
 * Copia um registro para as refeições salvas de `userId`. O acesso ao registro já foi
 * conferido pela rota. Autor só é gravado quando o registro é de outra pessoa.
 * `null` = o registro sumiu entre a checagem e a cópia.
 */
export async function salvarRegistro(
  registroId: string,
  userId: string,
): Promise<RefeicaoSalva | null> {
  const linha = await consultarUm<LinhaSalva>(
    `INSERT INTO refeicoes_salvas
       (user_id, nome, alimentos, calorias_total, carboidrato_total_g, proteina_total_g,
        gordura_total_g, origem_registro_id, origem_autor_id, origem_autor_nome)
     SELECT $2::uuid, ref.nome, r.alimentos_detectados, r.calorias_total, r.carboidrato_total_g,
            r.proteina_total_g, r.gordura_total_g, r.id,
            CASE WHEN r.user_id = $2 THEN NULL ELSE u.id END,
            CASE WHEN r.user_id = $2 THEN NULL ELSE u.nome END
     FROM registros_alimentares r
     JOIN refeicoes_usuario ref ON ref.id = r.refeicao_id
     JOIN users u ON u.id = r.user_id
     WHERE r.id = $1
     RETURNING ${COLUNAS}`,
    [registroId, userId],
  );
  return linha ? paraSalva(linha) : null;
}

/** Salvos do usuário, mais recentes primeiro. `antes` pagina pelo `criado_em` do último item. */
export async function listarSalvos(
  userId: string,
  antes: Date | null,
  limite: number,
): Promise<RefeicaoSalva[]> {
  const linhas = await consultar<LinhaSalva>(
    `SELECT ${COLUNAS} FROM refeicoes_salvas
     WHERE user_id = $1 AND ($2::timestamptz IS NULL OR criado_em < $2)
     ORDER BY criado_em DESC
     LIMIT $3`,
    [userId, antes, limite],
  );
  return linhas.map(paraSalva);
}

/** Apaga só se for do usuário. `false` = nada apagado. */
export async function apagarSalvo(id: string, userId: string): Promise<boolean> {
  const linhas = await consultar<{ id: string }>(
    'DELETE FROM refeicoes_salvas WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId],
  );
  return linhas.length > 0;
}
