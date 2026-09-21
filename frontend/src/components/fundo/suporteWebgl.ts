type FabricaCanvas = () => { getContext(tipo: string): unknown };

const canvasDoDocumento: FabricaCanvas = () => {
  if (typeof document === 'undefined') throw new Error('sem document');
  return document.createElement('canvas');
};

export function temWebgl(criarCanvas: FabricaCanvas = canvasDoDocumento): boolean {
  try {
    const canvas = criarCanvas();
    return canvas.getContext('webgl2') != null || canvas.getContext('webgl') != null;
  } catch {
    return false;
  }
}

export function deveAnimarFundo(temWebgl: boolean, reduzMovimento: boolean): boolean {
  return temWebgl && !reduzMovimento;
}
