export interface Retangulo {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Brilho parado: centro horizontal, colado no topo da pílula. */
export const BRILHO_REPOUSO = { x: 50, y: 0 };

const limitar = (valor: number) => Math.min(100, Math.max(0, valor));

export function posicaoRelativa(clientX: number, clientY: number, rect: Retangulo): { x: number; y: number } {
  if (rect.width <= 0 || rect.height <= 0) return { ...BRILHO_REPOUSO };
  return {
    x: limitar(((clientX - rect.left) / rect.width) * 100),
    y: limitar(((clientY - rect.top) / rect.height) * 100),
  };
}
