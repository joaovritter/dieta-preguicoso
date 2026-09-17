export const LIMIAR_DELTA = 6;
export const TOPO = 40;

/** `delta` é a distância desde a última rolagem que mudou a decisão (positivo = descendo). */
export function decidirCompacta(atual: boolean, delta: number, y: number): boolean {
  if (y <= TOPO) return false;
  if (delta > LIMIAR_DELTA) return true;
  if (delta < -LIMIAR_DELTA) return false;
  return atual;
}
