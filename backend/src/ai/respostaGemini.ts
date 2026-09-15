import { AppError } from '../lib/erros.js';
import { extrairJson, parsearAlimentos } from './parse.js';
import type { ResultadoAudio, ResultadoVisao } from './tipos.js';

/**
 * Leitura da resposta do Gemini: envelope, JSON e tipos de arquivo. Puro de
 * propósito — é o que dá para testar sem tocar na rede.
 */
interface RespostaGemini {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

/**
 * O navegador rotula áudio gravado em webm ora como `audio/webm`, ora como
 * `video/webm`, e às vezes anexa o codec. A API quer o tipo limpo.
 */
export function normalizarMime(mimetype: string): string {
  const limpo = mimetype.split(';')[0]?.trim().toLowerCase() ?? '';
  if (limpo === 'video/webm') return 'audio/webm';
  if (limpo === 'audio/x-m4a' || limpo === 'audio/m4a') return 'audio/mp4';
  if (limpo === 'audio/x-wav') return 'audio/wav';
  return limpo;
}

/** Tira o texto de dentro do envelope da resposta. */
export function textoDaResposta(corpo: unknown): string {
  const partes = (corpo as RespostaGemini)?.candidates?.[0]?.content?.parts;
  const texto = partes?.map((p) => p.text ?? '').join('') ?? '';
  if (texto.trim() === '') {
    throw new AppError('IA_RESPOSTA_INVALIDA', 'a IA não respondeu nada. mande de novo');
  }
  return texto;
}

/** Lê uma chave de texto opcional do JSON da IA, sem derrubar o registro se faltar. */
function textoOpcional(bruto: string, chave: string): string {
  try {
    const obj = extrairJson(bruto) as Record<string, unknown>;
    const valor = obj[chave];
    return typeof valor === 'string' ? valor.trim() : '';
  } catch {
    return '';
  }
}

export function parsearVisao(bruto: string): ResultadoVisao {
  const alimentos = parsearAlimentos(bruto);
  const descricao = textoOpcional(bruto, 'descricao');
  return {
    alimentos,
    descricao:
      descricao || alimentos.map((a) => a.nome).join(', ') || 'foto sem alimento identificado',
  };
}

export function parsearAudio(bruto: string): ResultadoAudio {
  return { alimentos: parsearAlimentos(bruto), transcricao: textoOpcional(bruto, 'transcricao') };
}

