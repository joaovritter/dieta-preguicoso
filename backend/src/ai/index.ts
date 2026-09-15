import { env } from '../env.js';
import { provedorGemini } from './gemini.js';
import { provedorOpenAI } from './openai.js';
import type { ProvedorIA } from './tipos.js';

/**
 * A IA usada pelo app, escolhida por `IA_PROVEDOR` no .env. O resto do código fala
 * só com esta interface — trocar de provedor não encosta em rota nem em repositório.
 */
export const ia: ProvedorIA = env.provedorIA === 'gemini' ? provedorGemini : provedorOpenAI;

export type { ProvedorIA, ResultadoAudio, ResultadoVisao } from './tipos.js';
