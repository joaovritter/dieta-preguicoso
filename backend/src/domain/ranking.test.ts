import { describe, expect, it } from 'vitest';
import { pontuacaoDaSemana, posicaoNoRanking, type PontuacaoSemana } from './ranking.js';
import type { ProgressoDia, StatusDia } from './tipos.js';

function dia(percentual: number, status: StatusDia, registros = 1): ProgressoDia {
  return {
    data: '2026-09-10',
    calorias: percentual * 20,
    meta_calorias: 2000,
    percentual,
    status,
    quantidade_registros: registros,
  };
}

const p = (userId: string, diasNaMeta: number, desvioMedio: number | null): PontuacaoSemana => ({
  userId,
  diasNaMeta,
  desvioMedio,
});

describe('pontuacaoDaSemana', () => {
  it('conta dias na meta e tira a média do desvio só dos dias com registro', () => {
    const r = pontuacaoDaSemana('a', [
      dia(100, 'na_meta'),
      dia(80, 'abaixo'),
      dia(0, 'sem_registro', 0),
      dia(120, 'acima'),
    ]);
    expect(r.userId).toBe('a');
    expect(r.diasNaMeta).toBe(1);
    expect(r.desvioMedio).toBeCloseTo(40 / 3);
  });

  it('sem nenhum registro na janela, o desvio fica null', () => {
    const r = pontuacaoDaSemana('b', [dia(0, 'sem_registro', 0), dia(0, 'sem_registro', 0)]);
    expect(r).toEqual({ userId: 'b', diasNaMeta: 0, desvioMedio: null });
  });
});

describe('posicaoNoRanking', () => {
  it('ordena por dias na meta, do maior para o menor', () => {
    const lista = [p('a', 2, 5), p('b', 5, 30), p('c', 3, 1)];
    expect(posicaoNoRanking(lista, 'b')).toBe(1);
    expect(posicaoNoRanking(lista, 'c')).toBe(2);
    expect(posicaoNoRanking(lista, 'a')).toBe(3);
  });

  it('desempata pelo menor desvio médio', () => {
    const lista = [p('a', 3, 12), p('b', 3, 4)];
    expect(posicaoNoRanking(lista, 'b')).toBe(1);
    expect(posicaoNoRanking(lista, 'a')).toBe(2);
  });

  it('empate total divide a posição e a próxima pula (1, 2, 2, 4)', () => {
    const lista = [p('a', 5, 2), p('b', 4, 6), p('c', 4, 6), p('d', 1, 9)];
    expect(posicaoNoRanking(lista, 'a')).toBe(1);
    expect(posicaoNoRanking(lista, 'b')).toBe(2);
    expect(posicaoNoRanking(lista, 'c')).toBe(2);
    expect(posicaoNoRanking(lista, 'd')).toBe(4);
  });

  it('quem não registrou nada fica depois de todos, mesmo de quem tem 0 dias na meta', () => {
    const lista = [p('sumido', 0, null), p('tentou', 0, 45)];
    expect(posicaoNoRanking(lista, 'tentou')).toBe(1);
    expect(posicaoNoRanking(lista, 'sumido')).toBe(2);
  });

  it('dois sem registro empatam entre si', () => {
    const lista = [p('a', 1, 3), p('b', 0, null), p('c', 0, null)];
    expect(posicaoNoRanking(lista, 'b')).toBe(2);
    expect(posicaoNoRanking(lista, 'c')).toBe(2);
  });

  it('grupo de um membro só não tem ranking', () => {
    expect(posicaoNoRanking([p('a', 7, 0)], 'a')).toBeNull();
  });

  it('quem não está na lista não tem posição', () => {
    expect(posicaoNoRanking([p('a', 1, 1), p('b', 2, 2)], 'z')).toBeNull();
  });
});
