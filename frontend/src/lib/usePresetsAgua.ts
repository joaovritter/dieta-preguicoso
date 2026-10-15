import { useCallback, useEffect, useRef } from 'react';
import { api, mensagemDoErro } from './api';
import { CHAVE_PRESETS, PRESETS_PADRAO, ajustarPreset, lerPresets, presetsParaMigrar } from './presetsAgua';
import { useAuth } from '../auth/useAuth';

/** Botões rápidos de água: moram na conta (`perfil.presets_agua_ml`), então valem em qualquer aparelho. */
export function usePresetsAgua(aoFalhar?: (mensagem: string) => void) {
  const { perfil, definirPerfil } = useAuth();
  const presets = perfil?.presets_agua_ml ?? PRESETS_PADRAO;
  const perfilRef = useRef(perfil);
  perfilRef.current = perfil;
  const idDoPerfil = perfil?.id;

  // Versão antiga guardava os botões só no aparelho: sobe uma vez para a conta e limpa o aparelho.
  useEffect(() => {
    const atual = perfilRef.current;
    if (atual === null) return;
    let bruto: string | null;
    try {
      bruto = localStorage.getItem(CHAVE_PRESETS);
    } catch {
      return;
    }
    if (bruto === null) return;
    const limpar = () => {
      try {
        localStorage.removeItem(CHAVE_PRESETS);
      } catch {
        // sem acesso ao armazenamento: tenta de novo na próxima abertura
      }
    };
    const subir = presetsParaMigrar(lerPresets(bruto), atual.presets_agua_ml);
    if (subir === null) {
      limpar();
      return;
    }
    api.salvarPerfil({ presets_agua_ml: subir }).then(
      (novo) => {
        definirPerfil(novo);
        limpar();
      },
      () => {
        // mantém no aparelho para tentar de novo depois
      },
    );
  }, [idDoPerfil, definirPerfil]);

  const ajustar = useCallback(
    (indice: number, delta: number) => {
      const atual = perfilRef.current;
      if (atual === null) return;
      const anteriores = atual.presets_agua_ml;
      const novos = ajustarPreset(anteriores, indice, delta);
      definirPerfil({ ...atual, presets_agua_ml: novos }); // aparece na hora; desfaz se o servidor recusar
      api.salvarPerfil({ presets_agua_ml: novos }).catch((falha: unknown) => {
        const ultimo = perfilRef.current;
        if (ultimo !== null) definirPerfil({ ...ultimo, presets_agua_ml: anteriores });
        aoFalhar?.(mensagemDoErro(falha));
      });
    },
    [definirPerfil, aoFalhar],
  );

  return { presets, ajustar };
}
