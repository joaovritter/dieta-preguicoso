/** Folga para o relógio do aparelho levemente adiantado em relação ao servidor. */
export const FOLGA_FUTURO_MS = 5 * 60 * 1000;

/** Registro retroativo: qualquer instante até agora (com folga) vale; futuro não. */
export function criadoEmValido(iso: string, agora: Date): boolean {
  return new Date(iso).getTime() <= agora.getTime() + FOLGA_FUTURO_MS;
}
