import { describe, expect, it } from 'vitest';
import { detectarRefeicao } from './refeicao.js';
import { FAIXAS_PADRAO, type FaixaRefeicao } from './tipos.js';

const TZ = 'America/Sao_Paulo';

/** Constrói um instante UTC que corresponde a `hora:minuto` em São Paulo (UTC-3). */
function emSaoPaulo(hora: number, minuto = 0): Date {
  return new Date(Date.UTC(2026, 2, 10, hora + 3, minuto));
}

describe('detectarRefeicao', () => {
  it.each([
    [7, 0, 'cafe_da_manha'],
    [5, 0, 'cafe_da_manha'],
    [10, 0, 'cafe_da_manha'],
    [10, 1, 'almoco'],
    [12, 30, 'almoco'],
    [15, 0, 'almoco'],
    [16, 0, 'lanche'],
    [19, 30, 'janta'],
    [22, 0, 'janta'],
  ])('%i:%i cai em %s', (hora, minuto, esperado) => {
    expect(detectarRefeicao(emSaoPaulo(hora, minuto), TZ, FAIXAS_PADRAO)).toBe(esperado);
  });

  it('classifica como ceia a faixa que cruza a meia-noite', () => {
    expect(detectarRefeicao(emSaoPaulo(23, 30), TZ, FAIXAS_PADRAO)).toBe('ceia');
    expect(detectarRefeicao(emSaoPaulo(2, 0), TZ, FAIXAS_PADRAO)).toBe('ceia');
    expect(detectarRefeicao(emSaoPaulo(4, 59), TZ, FAIXAS_PADRAO)).toBe('ceia');
  });

  it('respeita o fuso do usuário, não o do servidor', () => {
    const instante = new Date('2026-03-10T12:00:00Z'); // 09:00 em SP, 21:00 em Tóquio
    expect(detectarRefeicao(instante, 'America/Sao_Paulo', FAIXAS_PADRAO)).toBe('cafe_da_manha');
    expect(detectarRefeicao(instante, 'Asia/Tokyo', FAIXAS_PADRAO)).toBe('janta');
  });

  it('nunca devolve nulo mesmo com faixas cheias de buracos', () => {
    const faixas: FaixaRefeicao[] = [
      { refeicao: 'cafe_da_manha', inicio: '06:00', fim: '07:00' },
      { refeicao: 'almoco', inicio: '12:00', fim: '13:00' },
      { refeicao: 'lanche', inicio: '16:00', fim: '17:00' },
      { refeicao: 'janta', inicio: '20:00', fim: '21:00' },
      { refeicao: 'ceia', inicio: '23:00', fim: '23:30' },
    ];
    // 14:00 não está em nenhuma faixa: cai na anterior mais próxima (almoço).
    expect(detectarRefeicao(emSaoPaulo(14, 0), TZ, faixas)).toBe('almoco');
    // 05:00 não está em nenhuma: a anterior mais próxima, dando a volta, é a ceia.
    expect(detectarRefeicao(emSaoPaulo(5, 0), TZ, faixas)).toBe('ceia');
  });

  it('cai nas faixas padrão quando o perfil está sem configuração', () => {
    expect(detectarRefeicao(emSaoPaulo(12, 0), TZ, [])).toBe('almoco');
  });
});
