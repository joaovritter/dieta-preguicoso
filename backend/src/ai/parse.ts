import { z } from 'zod';
import { AppError } from '../lib/erros.js';
import { arredondar } from '../domain/nutricao.js';
import type { Alimento } from '../domain/tipos.js';

/**
 * A IA às vezes devolve número como string ("42"), às vezes com unidade ("42 g"),
 * às vezes null. Nada disso é motivo para derrubar o registro do usuário — extrai
 * o que der e trata o resto como zero.
 */
const numeroTolerante = z.preprocess((v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const m = /-?\d+(?:[.,]\d+)?/.exec(v.replace(/\s/g, ''));
    return m ? Number(m[0].replace(',', '.')) : 0;
  }
  return 0;
}, z.number().min(0).max(20000));

const alimentoSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  quantidade_estimada: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : 'não informado'),
    z.string().max(60),
  ),
  calorias: numeroTolerante,
  carboidrato_g: numeroTolerante,
  proteina_g: numeroTolerante,
  gordura_g: numeroTolerante,
});

const respostaSchema = z.object({
  alimentos: z.array(alimentoSchema).max(40),
});

/** Schema público para validar alimentos vindos do cliente (tela de confirmação). */
export const alimentoEntradaSchema = alimentoSchema;

function extrairJson(bruto: string): unknown {
  const texto = bruto.trim();
  try {
    return JSON.parse(texto);
  } catch {
    // Alguns modelos embrulham o JSON em ```json ... ``` ou em texto solto.
    const inicio = texto.indexOf('{');
    const fim = texto.lastIndexOf('}');
    if (inicio === -1 || fim <= inicio) {
      throw new AppError('IA_RESPOSTA_INVALIDA', 'a IA não devolveu JSON');
    }
    try {
      return JSON.parse(texto.slice(inicio, fim + 1));
    } catch {
      throw new AppError('IA_RESPOSTA_INVALIDA', 'a IA devolveu JSON malformado');
    }
  }
}

export function parsearAlimentos(bruto: string): Alimento[] {
  const resultado = respostaSchema.safeParse(extrairJson(bruto));
  if (!resultado.success) {
    throw new AppError(
      'IA_RESPOSTA_INVALIDA',
      'a IA devolveu um formato inesperado de alimentos',
    );
  }
  return resultado.data.alimentos.map((a) => ({
    nome: a.nome,
    quantidade_estimada: a.quantidade_estimada,
    calorias: arredondar(a.calorias),
    carboidrato_g: arredondar(a.carboidrato_g),
    proteina_g: arredondar(a.proteina_g),
    gordura_g: arredondar(a.gordura_g),
  }));
}

const RE_ML = /(\d+(?:[.,]\d+)?)\s*(ml|mls|mililitros?|l|litros?|copos?|garrafas?)?/i;

/**
 * Extrai um volume de água de texto livre ("bebi 300ml", "dois copos" não conta —
 * só número). Copo = 250ml, garrafa = 500ml, litro = 1000ml.
 */
export function extrairMililitros(texto: string): number | null {
  const m = RE_ML.exec(texto);
  if (!m?.[1]) return null;
  const valor = Number(m[1].replace(',', '.'));
  if (!Number.isFinite(valor) || valor <= 0) return null;

  const unidade = m[2]?.toLowerCase() ?? 'ml';
  const fator = unidade.startsWith('l') ? 1000
    : unidade.startsWith('copo') ? 250
    : unidade.startsWith('garrafa') ? 500
    : 1;
  const ml = Math.round(valor * fator);
  return ml > 0 && ml <= 10000 ? ml : null;
}
