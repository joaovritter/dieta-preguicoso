import type { ProgressoDia } from './tipos.js';

export interface PontuacaoSemana {
  userId: string;
  diasNaMeta: number;
  /** Média de |percentual − 100| nos dias com registro. `null` = nenhum registro na janela. */
  desvioMedio: number | null;
}

export function pontuacaoDaSemana(userId: string, dias: ProgressoDia[]): PontuacaoSemana {
  const comRegistro = dias.filter((d) => d.status !== 'sem_registro');
  const diasNaMeta = comRegistro.filter((d) => d.status === 'na_meta').length;
  const desvioMedio =
    comRegistro.length === 0
      ? null
      : comRegistro.reduce((soma, d) => soma + Math.abs(d.percentual - 100), 0) / comRegistro.length;
  return { userId, diasNaMeta, desvioMedio };
}

/** Negativo = `a` vem antes. Sem registro vira desvio infinito, e empata com outro sem registro. */
function comparar(a: PontuacaoSemana, b: PontuacaoSemana): number {
  if (a.diasNaMeta !== b.diasNaMeta) return b.diasNaMeta - a.diasNaMeta;
  const da = a.desvioMedio ?? Number.POSITIVE_INFINITY;
  const db = b.desvioMedio ?? Number.POSITIVE_INFINITY;
  if (da === db) return 0;
  return da < db ? -1 : 1;
}

/** Posição estilo competição ("1, 2, 2, 4"): quantos vêm estritamente antes, mais um. */
export function posicaoNoRanking(pontuacoes: PontuacaoSemana[], userId: string): number | null {
  if (pontuacoes.length <= 1) return null;
  const minha = pontuacoes.find((x) => x.userId === userId);
  if (!minha) return null;
  return pontuacoes.filter((outra) => comparar(outra, minha) < 0).length + 1;
}
