import { createReadStream } from 'node:fs';
import OpenAI from 'openai';
import { env } from '../env.js';
import { AppError } from '../lib/erros.js';
import type { Alimento } from '../domain/tipos.js';
import { logFalha, logSucesso, type Contexto, type Entrada } from './log.js';
import { extrairJson, parsearAlimentos } from './parse.js';
import { INSTRUCAO, PEDE_DESCRICAO } from './prompt.js';
import { classificarExcecao, falha } from './retentativa.js';
import type { ProvedorIA, ResultadoAudio, ResultadoVisao } from './tipos.js';

// Criado só quando é usado: com IA_PROVEDOR=gemini não existe chave da OpenAI para dar.
let clienteCache: OpenAI | null = null;
function cliente(): OpenAI {
  clienteCache ??= new OpenAI({ apiKey: env.openaiApiKey, maxRetries: 2, timeout: 60_000 });
  return clienteCache;
}

function contexto(entrada: Entrada, modelo: string, inicioMs: number): Contexto {
  // O SDK já repete sozinho (maxRetries), então aqui a contagem é sempre 1 chamada nossa.
  return { entrada, modelo, inicioMs, tentativas: 1 };
}

/** Registra a falha e a traduz para o erro de domínio que a rota devolve. */
function erroIA(ctx: Contexto, e: unknown): never {
  const detalhe = e instanceof Error ? e.message : String(e);
  // AppError aqui é resposta vazia ou fora do formato — já classificada antes de subir.
  const f = e instanceof AppError ? falha('resposta_invalida') : classificarExcecao(e);
  logFalha(ctx, f.motivo, detalhe);
  throw new AppError(f.codigo, f.mensagem);
}

function conteudoOuFalha(texto: string | null | undefined): string {
  if (!texto || texto.trim() === '') {
    throw new AppError('IA_RESPOSTA_INVALIDA', 'a IA devolveu resposta vazia');
  }
  return texto;
}

/** Interpreta uma descrição em texto livre do que foi comido. */
async function interpretarTexto(texto: string): Promise<Alimento[]> {
  const ctx = contexto('texto', env.modeloTexto, Date.now());
  try {
    const r = await cliente().chat.completions.create({
      model: env.modeloTexto,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        { role: 'system', content: INSTRUCAO },
        { role: 'user', content: `<entrada_usuario>${texto}</entrada_usuario>` },
      ],
    });
    const alimentos = parsearAlimentos(conteudoOuFalha(r.choices[0]?.message.content));
    logSucesso(ctx, alimentos.length);
    return alimentos;
  } catch (e) {
    return erroIA(ctx, e);
  }
}

/** Interpreta a foto de um prato ou de um alimento avulso. */
async function interpretarImagem(base64: string, mimetype: string): Promise<ResultadoVisao> {
  const ctx = contexto('foto', env.modeloVisao, Date.now());
  try {
    const r = await cliente().chat.completions.create({
      model: env.modeloVisao,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: INSTRUCAO + PEDE_DESCRICAO,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Identifique os alimentos desta refeição e estime as porções.' },
            { type: 'image_url', image_url: { url: `data:${mimetype};base64,${base64}`, detail: 'low' } },
          ],
        },
      ],
    });

    const bruto = conteudoOuFalha(r.choices[0]?.message.content);
    const alimentos = parsearAlimentos(bruto);

    let descricao = '';
    try {
      const obj = extrairJson(bruto) as { descricao?: unknown };
      if (typeof obj.descricao === 'string') descricao = obj.descricao.trim();
    } catch {
      // Descrição é enfeite; se não vier, monta a partir dos nomes dos alimentos.
    }
    if (descricao === '') {
      descricao = alimentos.map((a) => a.nome).join(', ') || 'foto sem alimento identificado';
    }

    logSucesso(ctx, alimentos.length);
    return { alimentos, descricao };
  } catch (e) {
    return erroIA(ctx, e);
  }
}

/** Transcreve um áudio já gravado em disco. */
async function transcreverAudio(caminho: string, ctx: Contexto): Promise<string> {
  try {
    const r = await cliente().audio.transcriptions.create({
      model: env.modeloAudio,
      file: createReadStream(caminho),
      language: 'pt',
    });
    return conteudoOuFalha(r.text).trim();
  } catch (e) {
    return erroIA(ctx, e);
  }
}

/**
 * Whisper transcreve, o chat interpreta: dois passos, porque o modelo de texto
 * não ouve. O log sai uma vez só, como `audio`, para não parecer registro duplo.
 */
async function interpretarAudio(caminho: string, _mimetype: string): Promise<ResultadoAudio> {
  const ctx = contexto('audio', `${env.modeloAudio}+${env.modeloTexto}`, Date.now());
  const transcricao = await transcreverAudio(caminho, ctx);
  if (transcricao === '') {
    logSucesso(ctx, 0);
    return { transcricao, alimentos: [] };
  }

  const r = await cliente()
    .chat.completions.create({
      model: env.modeloTexto,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        { role: 'system', content: INSTRUCAO },
        { role: 'user', content: `<entrada_usuario>${transcricao}</entrada_usuario>` },
      ],
    })
    .catch((e: unknown) => erroIA(ctx, e));

  let alimentos: Alimento[];
  try {
    alimentos = parsearAlimentos(conteudoOuFalha(r.choices[0]?.message.content));
  } catch (e) {
    return erroIA(ctx, e);
  }

  logSucesso(ctx, alimentos.length);
  return { transcricao, alimentos };
}

export const provedorOpenAI: ProvedorIA = {
  interpretarTexto,
  interpretarImagem,
  interpretarAudio,
};
