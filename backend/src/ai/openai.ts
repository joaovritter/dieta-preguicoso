import { createReadStream } from 'node:fs';
import OpenAI from 'openai';
import { env } from '../env.js';
import { AppError } from '../lib/erros.js';
import { parsearAlimentos } from './parse.js';
import type { Alimento } from '../domain/tipos.js';

const cliente = new OpenAI({ apiKey: env.openaiApiKey, maxRetries: 2, timeout: 60_000 });

const INSTRUCAO = `Você é um nutricionista que estima valores nutricionais de refeições brasileiras.
Responda SEMPRE e SOMENTE com JSON válido no formato:
{"alimentos":[{"nome":"arroz branco cozido","quantidade_estimada":"150g","calorias":195,"carboidrato_g":42,"proteina_g":4,"gordura_g":0.4}]}

Regras:
- Um item por alimento distinto. Separe o prato em componentes (arroz, feijão, bife, salada) em vez de um item genérico.
- "quantidade_estimada" é uma string com a porção estimada (ex.: "150g", "1 unidade média", "1 concha").
- Valores nutricionais são números referentes à quantidade estimada, não a 100g.
- Estime porções pelo contexto visual ou pela descrição. Na dúvida, use a porção caseira típica brasileira.
- Nunca invente alimentos que não foram mencionados nem aparecem na imagem.
- Se não houver nenhum alimento identificável, devolva {"alimentos":[]}.
- Nomes dos alimentos em português.`;

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
    const r = await cliente.chat.completions.create({
      model: env.modeloTexto,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        { role: 'system', content: INSTRUCAO },
        { role: 'user', content: `O que eu comi: ${texto}` },
      ],
    });
    return parsearAlimentos(conteudoOuFalha(r.choices[0]?.message.content));
  } catch (e) {
    return erroDeRede(e);
  }
}

export interface ResultadoVisao {
  alimentos: Alimento[];
  descricao: string;
}

/** Interpreta a foto de um prato ou de um alimento avulso. */
export async function interpretarImagem(
  base64: string,
  mimetype: string,
): Promise<ResultadoVisao> {
  try {
    const r = await cliente.chat.completions.create({
      model: env.modeloVisao,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `${INSTRUCAO}\n\nInclua também a chave "descricao": uma frase curta descrevendo o prato.`,
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
      const obj = JSON.parse(bruto) as { descricao?: unknown };
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
    const r = await cliente.audio.transcriptions.create({
      model: env.modeloAudio,
      file: createReadStream(caminho),
      language: 'pt',
    });
    return conteudoOuFalha(r.text).trim();
  } catch (e) {
    return erroDeRede(e);
  }
}
