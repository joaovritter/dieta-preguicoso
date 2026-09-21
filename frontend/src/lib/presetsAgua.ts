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

/** Texto digitado no preset: arredonda para o múltiplo de 50 mais próximo e trava entre 50 e 2000. */
export function normalizarPreset(texto: string): number | null {
  const valor = Number(texto.replace(',', '.'));
  if (texto.trim() === '' || !Number.isFinite(valor)) return null;
  return Math.min(MAXIMO, Math.max(MINIMO, Math.round(valor / 50) * 50));
}

export const AVULSO_MINIMO = 1;
export const AVULSO_MAXIMO = 10000;

/** Quantidade avulsa ("outro"): inteiro entre 1 e 10000 (o limite do backend), senão null. */
export function lerAvulso(texto: string): number | null {
  if (!/^\d+$/.test(texto.trim())) return null;
  const valor = Number(texto);
  return valor >= AVULSO_MINIMO && valor <= AVULSO_MAXIMO ? valor : null;
}

/** Passo de apoio do "outro": parte de 0 se o texto for inválido e trava dentro dos limites. */
export function somarAvulso(texto: string, delta: number): number {
  return Math.min(AVULSO_MAXIMO, Math.max(AVULSO_MINIMO, (lerAvulso(texto) ?? 0) + delta));
}

export function ajustarPreset(presets: number[], indice: number, delta: number): number[] {
  return presets.map((ml, i) => (i === indice ? Math.min(MAXIMO, Math.max(MINIMO, ml + delta)) : ml));
}
