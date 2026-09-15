import { describe, expect, it } from 'vitest';
import { acomodar, detectarRefeicao } from './refeicao.js';
import { AppError } from '../lib/erros.js';
import type { Refeicao } from './tipos.js';

const TZ = 'America/Sao_Paulo';

/** Constrói um instante UTC que corresponde a `hora:minuto` em São Paulo (UTC-3). */
function emSaoPaulo(hora: number, minuto = 0): Date {
  return new Date(Date.UTC(2026, 2, 10, hora + 3, minuto));
}

function refeicao(id: string, nome: string, inicio: string, fim: string): Refeicao {
  return { id, nome, inicio, fim };
}

const PADRAO: Refeicao[] = [
  refeicao('1', 'Café da manhã', '05:00', '10:00'),
  refeicao('2', 'Almoço', '10:01', '15:00'),
  refeicao('3', 'Lanche', '15:01', '18:00'),
  refeicao('4', 'Janta', '18:01', '22:00'),
  refeicao('5', 'Ceia', '22:01', '04:59'),
];

describe('detectarRefeicao', () => {
  it.each([
    [7, 0, 'Café da manhã'],
    [5, 0, 'Café da manhã'],
    [10, 0, 'Café da manhã'],
    [10, 1, 'Almoço'],
    [15, 0, 'Almoço'],
    [16, 0, 'Lanche'],
    [19, 30, 'Janta'],
    [22, 0, 'Janta'],
  ])('%i:%i cai em %s', (hora, minuto, esperado) => {
    expect(detectarRefeicao(emSaoPaulo(hora, minuto), TZ, PADRAO).nome).toBe(esperado);
  });

  it('classifica na faixa que cruza a meia-noite', () => {
    expect(detectarRefeicao(emSaoPaulo(23, 30), TZ, PADRAO).nome).toBe('Ceia');
    expect(detectarRefeicao(emSaoPaulo(2, 0), TZ, PADRAO).nome).toBe('Ceia');
    expect(detectarRefeicao(emSaoPaulo(4, 59), TZ, PADRAO).nome).toBe('Ceia');
  });

  it('encontra a refeição extra criada no meio do dia', () => {
    const comExtra = [
      ...PADRAO.filter((r) => r.id !== '3'),
      refeicao('6', 'Pré-treino', '15:01', '17:00'),
      refeicao('3', 'Lanche', '17:01', '18:00'),
    ];
    expect(detectarRefeicao(emSaoPaulo(16, 0), TZ, comExtra).nome).toBe('Pré-treino');
    expect(detectarRefeicao(emSaoPaulo(17, 30), TZ, comExtra).nome).toBe('Lanche');
  });

  it('cai na mais próxima para trás quando a lista tem buraco', () => {
    const comBuraco = [refeicao('1', 'Café', '05:00', '08:00'), refeicao('2', 'Janta', '18:00', '22:00')];
    expect(detectarRefeicao(emSaoPaulo(12, 0), TZ, comBuraco).nome).toBe('Café');
  });
});

describe('acomodar', () => {
  it('empurra o início da vizinha que começa dentro da janela nova', () => {
    const mudadas = acomodar(PADRAO, { inicio: '15:01', fim: '17:00' });
    expect(mudadas).toEqual([{ ...PADRAO[2], inicio: '17:01' }]);
  });

  it('recua o fim da vizinha que termina dentro da janela nova', () => {
    const mudadas = acomodar(PADRAO, { inicio: '14:00', fim: '15:30' });
    expect(mudadas).toEqual([
      { ...PADRAO[1], fim: '13:59' },
      { ...PADRAO[2], inicio: '15:31' },
    ]);
  });

  it('não mexe em quem não encosta na janela nova', () => {
    const mudadas = acomodar(PADRAO, { inicio: '15:30', fim: '18:00' });
    expect(mudadas.map((r) => r.id)).toEqual(['3']);
  });

  it('recusa janela que engole uma refeição inteira', () => {
    expect(() => acomodar(PADRAO, { inicio: '15:00', fim: '18:30' })).toThrow(AppError);
    expect(() => acomodar(PADRAO, { inicio: '15:00', fim: '18:30' })).toThrow(/Lanche/);
  });

  it('recusa janela que cruza a meia-noite', () => {
    expect(() => acomodar(PADRAO, { inicio: '23:00', fim: '01:00' })).toThrow(AppError);
  });

  it('recusa janela que cairia no meio da refeição que cruza a meia-noite', () => {
    expect(() => acomodar(PADRAO, { inicio: '02:00', fim: '03:00' })).toThrow(AppError);
  });

  it('ignora a própria refeição ao mover uma que já existe', () => {
    const mudadas = acomodar(PADRAO, { inicio: '15:01', fim: '17:30' }, '3');
    expect(mudadas).toEqual([]);
  });

  it('mantém a partição contígua depois de duas inserções', () => {
    const passo1 = [...PADRAO];
    const mudadas1 = acomodar(passo1, { inicio: '15:01', fim: '17:00' });
    const lista1 = aplicar(passo1, mudadas1).concat(refeicao('6', 'Pré-treino', '15:01', '17:00'));
    const mudadas2 = acomodar(lista1, { inicio: '09:00', fim: '10:00' });
    const lista2 = aplicar(lista1, mudadas2).concat(refeicao('7', 'Colação', '09:00', '10:00'));

    const ordenadas = [...lista2].sort((a, b) => a.inicio.localeCompare(b.inicio));
    for (let i = 1; i < ordenadas.length; i += 1) {
      expect(minutos(ordenadas[i]!.inicio)).toBe(minutos(ordenadas[i - 1]!.fim) + 1);
    }
  });
});

function aplicar(lista: Refeicao[], mudadas: Refeicao[]): Refeicao[] {
  return lista.map((r) => mudadas.find((m) => m.id === r.id) ?? r);
}

function minutos(hora: string): number {
  const [h, m] = hora.split(':');
  return Number(h) * 60 + Number(m);
}
