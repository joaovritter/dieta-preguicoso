import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api, gravarToken, lerToken, registrarLogout } from '../lib/api';
import type { Perfil } from '../lib/types';

export interface ContextoAuth {
  perfil: Perfil | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (email: string, senha: string, nome: string) => Promise<void>;
  sair: () => void;
  definirPerfil: (perfil: Perfil) => void;
}

export const AuthContext = createContext<ContextoAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);

  const sair = useCallback(() => {
    gravarToken(null);
    setPerfil(null);
    setCarregando(false);
  }, []);

  // Qualquer 401 vindo do cliente HTTP derruba a sessão.
  useEffect(() => {
    registrarLogout(sair);
  }, [sair]);

  useEffect(() => {
    if (lerToken() === null) {
      setCarregando(false);
      return;
    }
    let ativo = true;
    api
      .perfil()
      .then((p) => {
        if (ativo) setPerfil(p);
      })
      .catch(() => {
        gravarToken(null);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  const entrar = useCallback(async (email: string, senha: string) => {
    const { token, perfil: p } = await api.entrar(email, senha);
    gravarToken(token);
    setPerfil(p);
  }, []);

  const cadastrar = useCallback(async (email: string, senha: string, nome: string) => {
    const { token, perfil: p } = await api.registrar(email, senha, nome);
    gravarToken(token);
    setPerfil(p);
  }, []);

  const valor = useMemo<ContextoAuth>(
    () => ({ perfil, carregando, entrar, cadastrar, sair, definirPerfil: setPerfil }),
    [perfil, carregando, entrar, cadastrar, sair],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
