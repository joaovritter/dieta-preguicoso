export const PRESETS_PADRAO = [200, 300, 500];
export const CHAVE_PRESETS = 'dieta.agua.presets';

const MINIMO = 50;
const MAXIMO = 2000;

function valido(valor: unknown): valor is number {
  return (
    typeof valor === 'number' &&
    Number.isInteger(valor) &&
    valor >= MINIMO &&
    valor <= MAXIMO &&
    valor % 50 === 0
  );
}

export function lerPresets(bruto: string | null): number[] {
  if (bruto === null) return [...PRESETS_PADRAO];
  try {
    const lido: unknown = JSON.parse(bruto);
    if (Array.isArray(lido) && lido.length === 3 && lido.every(valido)) return lido;
  } catch {
    // JSON quebrado cai no padrão
  }
  return [...PRESETS_PADRAO];
}

export function ajustarPreset(presets: number[], indice: number, delta: number): number[] {
  return presets.map((ml, i) => (i === indice ? Math.min(MAXIMO, Math.max(MINIMO, ml + delta)) : ml));
}
