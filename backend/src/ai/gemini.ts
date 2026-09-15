import { readFile } from 'node:fs/promises';
import { env } from '../env.js';
import { AppError } from '../lib/erros.js';
import type { Alimento } from '../domain/tipos.js';
import { logFalha, logSucesso, type Contexto, type Entrada } from './log.js';
import { parsearAlimentos } from './parse.js';
import { INSTRUCAO, PEDE_DESCRICAO, PEDE_TRANSCRICAO } from './prompt.js';
import { normalizarMime, parsearAudio, parsearVisao, textoDaResposta } from './respostaGemini.js';
import {
  classificarExcecao,
  classificarStatus,
  decidir,
  ESPERAS_MS,
  falha,
  type Falha,
} from './retentativa.js';
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

type Tentativa = { texto: string } | { falha: Falha; detalhe: string };

function dormir(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function detalhe(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function pedir(modelo: string, instrucao: string, partes: Parte[]): Promise<Response> {
  return fetch(`${BASE}/models/${modelo}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': env.geminiApiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: instrucao }] },
      contents: [{ role: 'user', parts: partes }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    }),
    signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
  });
}

/** Uma ida à API: devolve o texto da resposta ou a falha já classificada. */
async function tentar(modelo: string, instrucao: string, partes: Parte[]): Promise<Tentativa> {
  let resposta: Response;
  try {
    resposta = await pedir(modelo, instrucao, partes);
  } catch (e) {
    return { falha: classificarExcecao(e), detalhe: detalhe(e) };
  }

  if (!resposta.ok) {
    const corpo = await resposta.text().catch(() => '');
    return { falha: classificarStatus(resposta.status), detalhe: `${resposta.status} ${corpo}` };
  }

  try {
    return { texto: textoDaResposta(await resposta.json()) };
  } catch (e) {
    return { falha: falha('resposta_invalida'), detalhe: detalhe(e) };
  }
}

/**
 * Percorre `GEMINI_MODEL` na ordem em que está escrito, com até três tentativas
 * por modelo quando o erro é passageiro, e registra uma linha de log com o
 * resultado — seja ele qual for.
 */
async function interpretar<T>(
  entrada: Entrada,
  instrucao: string,
  partes: Parte[],
  converter: (bruto: string) => T,
  contar: (valor: T) => number,
): Promise<T> {
  const inicioMs = Date.now();
  let tentativas = 0;
  let modeloAtual = '(nenhum)';
  let ultima: { falha: Falha; detalhe: string } = {
    falha: falha('desconhecido'),
    detalhe: 'nenhum modelo configurado em GEMINI_MODEL',
  };

  for (const modelo of env.modelosGemini) {
    modeloAtual = modelo;

    for (let tentativa = 0; ; tentativa++) {
      tentativas++;
      const r = await tentar(modelo, instrucao, partes);
      const ctx: Contexto = { entrada, modelo, inicioMs, tentativas };

      if ('texto' in r) {
        try {
          const valor = converter(r.texto);
          logSucesso(ctx, contar(valor));
          return valor;
        } catch (e) {
          // A IA respondeu, mas fora do formato combinado: não adianta repetir.
          const f = falha('resposta_invalida');
          logFalha(ctx, f.motivo, detalhe(e));
          throw new AppError(f.codigo, f.mensagem);
        }
      }

      ultima = r;
      const acao = decidir(r.falha.motivo, tentativa);
      if (acao === 'desistir') {
        logFalha(ctx, r.falha.motivo, r.detalhe);
        throw new AppError(r.falha.codigo, r.falha.mensagem);
      }
      if (acao === 'proximo-modelo') break;
      await dormir(ESPERAS_MS[tentativa] ?? 0);
    }
  }

  logFalha(
    { entrada, modelo: modeloAtual, inicioMs, tentativas },
    ultima.falha.motivo,
    ultima.detalhe,
  );
  throw new AppError(ultima.falha.codigo, ultima.falha.mensagem);
}

async function arquivoEmBase64(caminho: string, rotulo: string): Promise<string> {
  const dados = await readFile(caminho);
  if (dados.byteLength > MAX_ARQUIVO_BYTES) {
    throw new AppError('ARQUIVO_INVALIDO', `${rotulo} grande demais para a IA (limite de 14 MB)`);
  }
  return dados.toString('base64');
}

function interpretarTexto(texto: string): Promise<Alimento[]> {
  return interpretar(
    'texto',
    INSTRUCAO,
    [{ text: `<entrada_usuario>${texto}</entrada_usuario>` }],
    parsearAlimentos,
    (alimentos) => alimentos.length,
  );
}

function interpretarImagem(base64: string, mimetype: string): Promise<ResultadoVisao> {
  return interpretar(
    'foto',
    INSTRUCAO + PEDE_DESCRICAO,
    [
      { text: 'Identifique os alimentos desta refeição e estime as porções.' },
      { inlineData: { mimeType: normalizarMime(mimetype), data: base64 } },
    ],
    parsearVisao,
    (visao) => visao.alimentos.length,
  );
}

/** Uma chamada só: o Gemini ouve o áudio e devolve transcrição e alimentos juntos. */
async function interpretarAudio(caminho: string, mimetype: string): Promise<ResultadoAudio> {
  const base64 = await arquivoEmBase64(caminho, 'áudio');
  return interpretar(
    'audio',
    INSTRUCAO + PEDE_TRANSCRICAO,
    [
      { text: 'Transcreva o áudio e identifique os alimentos que a pessoa disse ter comido.' },
      { inlineData: { mimeType: normalizarMime(mimetype), data: base64 } },
    ],
    parsearAudio,
    (r) => r.alimentos.length,
  );
}

export const provedorGemini: ProvedorIA = {
  interpretarTexto,
  interpretarImagem,
  interpretarAudio,
};
