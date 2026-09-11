import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import type { ContextoAuth } from './AuthContext';

export function useAuth(): ContextoAuth {
  const ctx = useContext(AuthContext);
  if (ctx === null) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
