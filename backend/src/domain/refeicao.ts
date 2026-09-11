import { FAIXAS_PADRAO, type FaixaRefeicao, type Refeicao } from './tipos.js';
import { minutosDoDia } from './tempo.js';

const RE_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function horaValida(hora: string): boolean {
  return RE_HORA.test(hora);
}

function paraMinutos(hora: string): number {
  const m = RE_HORA.exec(hora);
  if (!m) throw new Error(`horário inválido: ${hora}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Uma faixa que cruza a meia-noite tem `fim` menor que `inicio` (ex.: ceia 22:01→04:59). */
function dentroDaFaixa(minutos: number, faixa: FaixaRefeicao): boolean {
  const inicio = paraMinutos(faixa.inicio);
  const fim = paraMinutos(faixa.fim);
  return inicio <= fim ? minutos >= inicio && minutos <= fim : minutos >= inicio || minutos <= fim;
}

/**
 * Classifica a refeição pelo horário de parede do usuário.
 *
 * Se nenhuma faixa casar — o usuário configurou faixas com buracos — cai na faixa
 * cujo início é o mais próximo para trás, e em último caso na primeira faixa. Nunca
 * devolve nulo: o produto inteiro depende de nunca perguntar a refeição ao usuário.
 */
export function detectarRefeicao(
  instante: Date,
  timezone: string,
  faixas: FaixaRefeicao[] = FAIXAS_PADRAO,
): Refeicao {
  const lista = faixas.length > 0 ? faixas : FAIXAS_PADRAO;
  const minutos = minutosDoDia(instante, timezone);

  for (const faixa of lista) {
    if (dentroDaFaixa(minutos, faixa)) return faixa.refeicao;
  }

  let melhor = lista[0]!;
  let menorDistancia = Number.POSITIVE_INFINITY;
  for (const faixa of lista) {
    const inicio = paraMinutos(faixa.inicio);
    const distancia = (minutos - inicio + 1440) % 1440;
    if (distancia < menorDistancia) {
      menorDistancia = distancia;
      melhor = faixa;
    }
  }
  return melhor.refeicao;
}
