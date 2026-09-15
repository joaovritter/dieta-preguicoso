import { createReadStream } from 'node:fs';
import OpenAI from 'openai';
import { env } from '../env.js';
import { AppError } from '../lib/erros.js';
import { extrairJson, parsearAlimentos } from './parse.js';
import { INSTRUCAO, PEDE_DESCRICAO } from './prompt.js';
import type { ProvedorIA, ResultadoAudio, ResultadoVisao } from './tipos.js';
import type { Alimento } from '../domain/tipos.js';

// Criado só quando é usado: com IA_PROVEDOR=gemini não existe chave da OpenAI para dar.
let clienteCache: OpenAI | null = null;
function cliente(): OpenAI {
  clienteCache ??= new OpenAI({ apiKey: env.openaiApiKey, maxRetries: 2, timeout: 60_000 });
  return clienteCache;
}

function erroDeRede(e: unknown): never {
  if (e instanceof AppError) throw e;
  const detalhe = e instanceof Error ? e.message : String(e);
  console.error('[openai]', detalhe);
  throw new AppError('IA_INDISPONIVEL', 'não consegui falar com a IA agora, tente de novo');
}

function conteudoOuFalha(texto: string | null | undefined): string {
  if (!texto || texto.trim() === '') {
    throw new AppError('IA_RESPOSTA_INVALIDA', 'a IA devolveu resposta vazia');
  }
  return texto;
}

/** Interpreta uma descrição em texto livre do que foi comido. */
export async function interpretarTexto(texto: string): Promise<Alimento[]> {
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
    return parsearAlimentos(conteudoOuFalha(r.choices[0]?.message.content));
  } catch (e) {
    return erroDeRede(e);
  }
}

/** Interpreta a foto de um prato ou de um alimento avulso. */
export async function interpretarImagem(
  base64: string,
  mimetype: string,
): Promise<ResultadoVisao> {
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

    return { alimentos, descricao };
  } catch (e) {
    return erroDeRede(e);
  }
}

/** Transcreve um áudio já gravado em disco. */
export async function transcreverAudio(caminho: string): Promise<string> {
  try {
    const r = await cliente().audio.transcriptions.create({
      model: env.modeloAudio,
      file: createReadStream(caminho),
      language: 'pt',
    });
    return conteudoOuFalha(r.text).trim();
  } catch (e) {
    return erroDeRede(e);
  }
}

/** Whisper transcreve, o chat interpreta: dois passos, porque o modelo de texto não ouve. */
async function interpretarAudio(caminho: string, _mimetype: string): Promise<ResultadoAudio> {
  const transcricao = await transcreverAudio(caminho);
  if (transcricao.trim() === '') return { transcricao, alimentos: [] };
  return { transcricao, alimentos: await interpretarTexto(transcricao) };
}

export const provedorOpenAI: ProvedorIA = {
  interpretarTexto,
  interpretarImagem,
  interpretarAudio,
};
