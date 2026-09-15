import { readFile } from 'node:fs/promises';
import { env } from '../env.js';
import { AppError } from '../lib/erros.js';
import type { Alimento } from '../domain/tipos.js';
import { parsearAlimentos } from './parse.js';
import { INSTRUCAO, PEDE_DESCRICAO, PEDE_TRANSCRICAO } from './prompt.js';
import { normalizarMime, parsearAudio, parsearVisao, textoDaResposta } from './respostaGemini.js';
import type { ProvedorIA, ResultadoAudio, ResultadoVisao } from './tipos.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const TEMPO_LIMITE_MS = 90_000;

/**
 * O pedido inteiro (texto + arquivo em base64) viaja numa requisição só, e a API
 * corta em 20 MB. Base64 infla o arquivo em ~33%, então o limite real de arquivo
 * fica por volta de 14 MB.
 */
const MAX_ARQUIVO_BYTES = 14 * 1024 * 1024;

interface Parte {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

function falhar(e: unknown): never {
  if (e instanceof AppError) throw e;
  const detalhe = e instanceof Error ? e.message : String(e);
  console.error('[gemini]', detalhe);
  throw new AppError('IA_INDISPONIVEL', 'não consegui falar com a IA agora, tente de novo');
}

async function gerar(instrucao: string, partes: Parte[]): Promise<string> {
  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}/models/${env.modeloGemini}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': env.geminiApiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instrucao }] },
        contents: [{ role: 'user', parts: partes }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
      }),
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    });
  } catch (e) {
    return falhar(e);
  }

  if (!resposta.ok) {
    const corpo = await resposta.text().catch(() => '');
    console.error('[gemini]', resposta.status, corpo.slice(0, 500));
    // 429 no plano gratuito é limite de requisições por minuto, e passa sozinho.
    if (resposta.status === 429) {
      throw new AppError('IA_INDISPONIVEL', 'a IA atingiu o limite de uso, tente de novo em alguns segundos');
    }
    throw new AppError('IA_INDISPONIVEL', 'não consegui falar com a IA agora, tente de novo');
  }

  try {
    return textoDaResposta(await resposta.json());
  } catch (e) {
    return falhar(e);
  }
}

async function arquivoEmBase64(caminho: string, rotulo: string): Promise<string> {
  const dados = await readFile(caminho);
  if (dados.byteLength > MAX_ARQUIVO_BYTES) {
    throw new AppError('ARQUIVO_INVALIDO', `${rotulo} grande demais para a IA (limite de 14 MB)`);
  }
  return dados.toString('base64');
}

async function interpretarTexto(texto: string): Promise<Alimento[]> {
  return parsearAlimentos(
    await gerar(INSTRUCAO, [{ text: `<entrada_usuario>${texto}</entrada_usuario>` }]),
  );
}

async function interpretarImagem(base64: string, mimetype: string): Promise<ResultadoVisao> {
  const bruto = await gerar(INSTRUCAO + PEDE_DESCRICAO, [
    { text: 'Identifique os alimentos desta refeição e estime as porções.' },
    { inlineData: { mimeType: normalizarMime(mimetype), data: base64 } },
  ]);
  return parsearVisao(bruto);
}

/** Uma chamada só: o Gemini ouve o áudio e devolve transcrição e alimentos juntos. */
async function interpretarAudio(caminho: string, mimetype: string): Promise<ResultadoAudio> {
  const base64 = await arquivoEmBase64(caminho, 'áudio');
  const bruto = await gerar(INSTRUCAO + PEDE_TRANSCRICAO, [
    { text: 'Transcreva o áudio e identifique os alimentos que a pessoa disse ter comido.' },
    { inlineData: { mimeType: normalizarMime(mimetype), data: base64 } },
  ]);
  return parsearAudio(bruto);
}

export const provedorGemini: ProvedorIA = {
  interpretarTexto,
  interpretarImagem,
  interpretarAudio,
};
