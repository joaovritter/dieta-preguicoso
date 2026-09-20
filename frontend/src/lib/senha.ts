/** Mesmas regras do backend (8–200), checadas antes de gastar uma tentativa do limite. */
export function validarNovaSenha(nova: string, confirmacao: string): string | null {
  if (nova.length < 8) return 'a senha nova precisa de pelo menos 8 caracteres';
  if (nova.length > 200) return 'a senha nova pode ter no máximo 200 caracteres';
  if (nova !== confirmacao) return 'as senhas não batem';
  return null;
}
