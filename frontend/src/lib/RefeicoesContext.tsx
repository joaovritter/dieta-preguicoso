import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from './api';
import type { Refeicao } from './types';
import { useAuth } from '../auth/useAuth';

export interface ContextoRefeicoes {
  refeicoes: Refeicao[];
  recarregar: () => Promise<void>;
}

export const RefeicoesContext = createContext<ContextoRefeicoes | null>(null);

export function RefeicoesProvider({ children }: { children: ReactNode }) {
  const { perfil } = useAuth();
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([]);

  const recarregar = useCallback(async () => {
    const { refeicoes: lista } = await api.refeicoes();
    setRefeicoes(lista);
  }, []);

  useEffect(() => {
    if (perfil === null) {
      setRefeicoes([]);
      return;
    }
    let ativo = true;
    api
      .refeicoes()
      .then(({ refeicoes: lista }) => {
        if (ativo) setRefeicoes(lista);
      })
      .catch(() => {
        // Deixa a lista vazia; quem consome renderiza sem opções em vez de travar a tela.
      });
    return () => {
      ativo = false;
    };
  }, [perfil]);

  const valor = useMemo<ContextoRefeicoes>(() => ({ refeicoes, recarregar }), [refeicoes, recarregar]);

  return <RefeicoesContext.Provider value={valor}>{children}</RefeicoesContext.Provider>;
}

export function useRefeicoes(): ContextoRefeicoes {
  const ctx = useContext(RefeicoesContext);
  if (ctx === null) throw new Error('useRefeicoes precisa estar dentro de <RefeicoesProvider>');
  return ctx;
}
