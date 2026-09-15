/**
 * Decide o que fazer quando o Gemini responde com erro. Fica separado de
 * `gemini.ts` para poder ser testado sem rede.
 */

/** Esperas entre as tentativas no mesmo modelo, em ms. */
export const ESPERAS_MS = [1_000, 3_000];

export type Acao = 'repetir' | 'proximo-modelo' | 'desistir';

/**
 * 429 (limite por minuto) e 5xx (sobrecarga) passam sozinhos: vale repetir no
 * mesmo modelo. Esgotadas as tentativas, cai para o próximo modelo da lista —
 * assim como o 404, que significa modelo indisponível nesta conta. Os demais
 * (400, 401, 403) são erro nosso e repetir não muda nada.
 */
export function decidir(status: number, tentativa: number): Acao {
  if (status === 429 || status >= 500) {
    return tentativa < ESPERAS_MS.length ? 'repetir' : 'proximo-modelo';
  }
  if (status === 404) return 'proximo-modelo';
  return 'desistir';
}

export function mensagemErro(status: number): string {
  if (status === 429) return 'a IA atingiu o limite de uso, tente de novo em alguns segundos';
  if (status >= 500) return 'a IA está sobrecarregada agora, tente de novo em instantes';
  return 'não consegui falar com a IA agora, tente de novo';
}
