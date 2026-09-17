import { useCallback, useState } from 'react';
import { CHAVE_PRESETS, ajustarPreset, lerPresets } from './presetsAgua';

function lerDoAparelho(): number[] {
  try {
    return lerPresets(localStorage.getItem(CHAVE_PRESETS));
  } catch {
    return lerPresets(null);
  }
}

export function usePresetsAgua() {
  const [presets, setPresets] = useState<number[]>(lerDoAparelho);

  const ajustar = useCallback((indice: number, delta: number) => {
    setPresets((atual) => {
      const novos = ajustarPreset(atual, indice, delta);
      try {
        localStorage.setItem(CHAVE_PRESETS, JSON.stringify(novos));
      } catch {
        // aba privada/armazenamento bloqueado: vale só nesta sessão
      }
      return novos;
    });
  }, []);

  return { presets, ajustar };
}
