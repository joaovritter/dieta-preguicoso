import { progressoDoDia } from '../domain/social.js';
import { dataLocal, diasDoMes, intervaloDoDia, intervaloDoMes } from '../domain/tempo.js';
import type { ProgressoDia } from '../domain/tipos.js';
import { caloriasPorDia } from './registros.js';

/** O mínimo que precisamos de alguém para calcular o progresso dessa pessoa. */
export interface DonoDoProgresso {
  id: string;
  meta_calorias: number;
  timezone: string;
}

export async function progressoNoDia(
  usuario: DonoDoProgresso,
  data?: string,
): Promise<ProgressoDia> {
  const dia = data ?? dataLocal(new Date(), usuario.timezone);
  const { inicio, fim } = intervaloDoDia(dia, usuario.timezone);
  const totais = await caloriasPorDia(usuario.id, inicio, fim, usuario.timezone);
  const total = totais.get(dia);
  return progressoDoDia(dia, total?.calorias ?? 0, usuario.meta_calorias, total?.quantidade ?? 0);
}

/** Um item por dia do mês, inclusive os dias sem registro nenhum. */
export async function progressoNoMes(
  usuario: DonoDoProgresso,
  mes: string,
): Promise<ProgressoDia[]> {
  const { inicio, fim } = intervaloDoMes(mes, usuario.timezone);
  const totais = await caloriasPorDia(usuario.id, inicio, fim, usuario.timezone);
  return diasDoMes(mes).map((dia) => {
    const total = totais.get(dia);
    return progressoDoDia(dia, total?.calorias ?? 0, usuario.meta_calorias, total?.quantidade ?? 0);
  });
}
