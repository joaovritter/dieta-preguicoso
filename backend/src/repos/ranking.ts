import { pontuacaoDaSemana, posicaoNoRanking } from '../domain/ranking.js';
import { progressoDoDia } from '../domain/social.js';
import { dataLocal, intervaloDoDia, somarDias } from '../domain/tempo.js';
import { caloriasPorDia } from './registros.js';
import { membrosDoGrupo } from './social.js';

/**
 * Posição de `eu` nos últimos 7 dias do grupo. A janela usa o fuso de quem pede (todo mundo
 * é comparado nos mesmos dias do calendário dele); a meta de cada membro é a dele.
 */
export async function minhaPosicaoSemana(
  grupoId: string,
  eu: { id: string; timezone: string },
): Promise<number | null> {
  const membros = await membrosDoGrupo(grupoId);
  if (membros.length <= 1) return null;

  const hoje = dataLocal(new Date(), eu.timezone);
  const dias = Array.from({ length: 7 }, (_, i) => somarDias(hoje, i - 6));
  const inicio = intervaloDoDia(dias[0]!, eu.timezone).inicio;
  const fim = intervaloDoDia(hoje, eu.timezone).fim;

  const pontuacoes = await Promise.all(
    membros.map(async (m) => {
      const totais = await caloriasPorDia(m.id, inicio, fim, eu.timezone);
      const progresso = dias.map((dia) => {
        const t = totais.get(dia);
        return progressoDoDia(dia, t?.calorias ?? 0, m.meta_calorias, t?.quantidade ?? 0);
      });
      return pontuacaoDaSemana(m.id, progresso);
    }),
  );

  return posicaoNoRanking(pontuacoes, eu.id);
}
