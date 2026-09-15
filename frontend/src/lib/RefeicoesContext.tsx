import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api, mensagemDoErro } from './api';
import type { Refeicao } from './types';
import { useAuth } from '../auth/useAuth';

export interface ContextoRefeicoes {
  refeicoes: Refeicao[];
  erro: string | null;
  recarregar: () => Promise<void>;
  limparErro: () => void;
}

export const RefeicoesContext = createContext<ContextoRefeicoes | null>(null);

export function RefeicoesProvider({ children }: { children: ReactNode }) {
  const { perfil } = useAuth();
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    try {
      const { refeicoes: lista } = await api.refeicoes();
      setRefeicoes(lista);
      setErro(null);
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    }
  }, []);

  useEffect(() => {
    if (perfil === null) {
      setRefeicoes([]);
      setErro(null);
      return;
    }
    void recarregar();
  }, [perfil, recarregar]);

  const valor = useMemo<ContextoRefeicoes>(
    () => ({ refeicoes, erro, recarregar, limparErro: () => setErro(null) }),
    [refeicoes, erro, recarregar],
  );

  return <RefeicoesContext.Provider value={valor}>{children}</RefeicoesContext.Provider>;
}

export function useRefeicoes(): ContextoRefeicoes {
  const ctx = useContext(RefeicoesContext);
  if (ctx === null) throw new Error('useRefeicoes precisa estar dentro de <RefeicoesProvider>');
  return ctx;
}
