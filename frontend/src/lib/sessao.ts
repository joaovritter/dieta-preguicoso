/** Resposta que significa "essa sessão acabou": token inválido ou conta desativada. */
export function encerraSessao(status: number, codigo: string, semAuth: boolean): boolean {
  if (semAuth) return false;
  return status === 401 || codigo === 'CONTA_DESATIVADA';
}
