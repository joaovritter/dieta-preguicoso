/** E-mail passado na linha de comando, normalizado; null se faltar, sobrar ou vier torto. */
export function emailDosArgumentos(args: string[]): string | null {
  const valores = args.filter((a) => a !== '--').map((a) => a.trim().toLowerCase());
  if (valores.length !== 1) return null;
  const email = valores[0]!;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
