import type { Motivo } from './retentativa.js';

/**
 * Uma linha por registro, curta e greppável: `docker compose logs backend | grep '\[ia\]'`
 * conta quantas fotos, áudios e textos entraram e quantos falharam, e por quê.
 */

/** Por onde a pessoa registrou a refeição. */
export type Entrada = 'foto' | 'audio' | 'texto';

export interface Contexto {
  entrada: Entrada;
  modelo: string;
  inicioMs: number;
  tentativas: number;
}

function duracao(inicioMs: number): string {
  return `${((Date.now() - inicioMs) / 1000).toFixed(1)}s`;
}

/** Deixa o detalhe do erro em uma linha só — o corpo da API vem em JSON multilinha. */
function resumir(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim().slice(0, 200);
}

export function logSucesso(ctx: Contexto, alimentos: number): void {
  const repetiu = ctx.tentativas > 1 ? ` após ${ctx.tentativas} tentativas` : '';
  console.log(
    `[ia] ${ctx.entrada} ok ${ctx.modelo} ${duracao(ctx.inicioMs)} ${alimentos} alimento(s)${repetiu}`,
  );
}

export function logFalha(ctx: Contexto, motivo: Motivo, detalhe: string): void {
  console.error(
    `[ia] ${ctx.entrada} erro ${motivo} ${ctx.modelo} ${duracao(ctx.inicioMs)} ` +
      `${ctx.tentativas} tentativa(s) — ${resumir(detalhe)}`,
  );
}
