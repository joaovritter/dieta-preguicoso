import type { Alimento } from '../domain/tipos.js';

export interface ResultadoVisao {
  alimentos: Alimento[];
  descricao: string;
}

export interface ResultadoAudio {
  /** O que a pessoa falou. Vira a `descricao_bruta` do registro. */
  transcricao: string;
  alimentos: Alimento[];
}

/**
 * O que o app precisa de uma IA. Cada provedor resolve do seu jeito — a OpenAI
 * transcreve o áudio num passo e interpreta noutro; o Gemini faz tudo numa chamada.
 */
export interface ProvedorIA {
  interpretarTexto(texto: string): Promise<Alimento[]>;
  interpretarImagem(base64: string, mimetype: string): Promise<ResultadoVisao>;
  interpretarAudio(caminho: string, mimetype: string): Promise<ResultadoAudio>;
}
