import { deISO, paraISO } from '../lib/format';

/**
 * Instante para um registro lançado pelo calendário: o dia escolhido com a hora atual
 * do aparelho (a refeição sugerida segue a hora; a pessoa troca no chip se quiser).
 * Hoje ou nenhum dia → undefined, e a API usa o instante do servidor.
 */
export function criadoEmParaDia(data: string | null, agora: Date): string | undefined {
  if (data === null || data === paraISO(agora)) return undefined;
  const dia = deISO(data);
  dia.setHours(agora.getHours(), agora.getMinutes(), agora.getSeconds(), 0);
  return dia.toISOString();
}
