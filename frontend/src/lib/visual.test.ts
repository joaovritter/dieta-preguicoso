import { describe, expect, it } from 'vitest';
import { corDaRefeicao, deslocarMes, litros, mesLongo, ROTULO_STATUS, statusVisual } from './visual';
import type { Refeicao } from './types';

const refeicoes: Refeicao[] = [
  { id: 'j', nome: 'Janta', inicio: '18:01', fim: '22:00' },
  { id: 'c', nome: 'Café da manhã', inicio: '05:00', fim: '10:00' },
  { id: 'x', nome: 'Ceia', inicio: '22:01', fim: '04:59' },
  { id: 'a', nome: 'Almoço', inicio: '10:01', fim: '15:00' },
  { id: 'l', nome: 'Lanche', inicio: '15:01', fim: '18:00' },
];

describe('statusVisual', () => {
  it('mapeia os status da API', () => {
    expect(statusVisual('na_meta', '2026-09-10', '2026-09-14')).toBe('meta');
    expect(statusVisual('abaixo', '2026-09-10', '2026-09-14')).toBe('sobrou');
    expect(statusVisual('acima', '2026-09-10', '2026-09-14')).toBe('passou');
    expect(statusVisual('sem_registro', '2026-09-10', '2026-09-14')).toBe('vazio');
  });

  it('dia futuro é vazio mesmo com status', () => {
    expect(statusVisual('na_meta', '2026-09-15', '2026-09-14')).toBe('vazio');
  });

  it('hoje conta como passado', () => {
    expect(statusVisual('abaixo', '2026-09-14', '2026-09-14')).toBe('sobrou');
  });

  it('tem rótulos', () => {
    expect(ROTULO_STATUS).toEqual({
      meta: 'na meta',
      sobrou: 'sobrou',
      passou: 'passou da meta',
      vazio: 'sem registro',
    });
  });
});

describe('corDaRefeicao', () => {
  it('usa a posição por horário de início', () => {
    expect(corDaRefeicao('c', refeicoes)).toBe('cafe');
    expect(corDaRefeicao('a', refeicoes)).toBe('almoco');
    expect(corDaRefeicao('l', refeicoes)).toBe('lanche');
    expect(corDaRefeicao('j', refeicoes)).toBe('janta');
    expect(corDaRefeicao('x', refeicoes)).toBe('ceia');
  });

  it('cicla depois da quinta', () => {
    const seis = [...refeicoes, { id: 'z', nome: 'Madrugada', inicio: '23:00', fim: '23:30' }];
    expect(corDaRefeicao('z', seis)).toBe('cafe');
  });

  it('id desconhecido cai em café', () => {
    expect(corDaRefeicao('nao-existe', refeicoes)).toBe('cafe');
  });

  it('não reordena o array recebido', () => {
    const copia = [...refeicoes];
    corDaRefeicao('a', refeicoes);
    expect(refeicoes).toEqual(copia);
  });
});

describe('litros', () => {
  it('formata com vírgula e uma casa', () => {
    expect(litros(1200)).toBe('1,2');
    expect(litros(2500)).toBe('2,5');
    expect(litros(0)).toBe('0,0');
    expect(litros(1250)).toBe('1,3');
  });
});

describe('meses', () => {
  it('mesLongo em português', () => {
    expect(mesLongo('2026-09')).toBe('setembro');
    expect(mesLongo('2026-03')).toBe('março');
  });

  it('deslocarMes atravessa o ano', () => {
    expect(deslocarMes('2026-01', -1)).toBe('2025-12');
    expect(deslocarMes('2025-12', 1)).toBe('2026-01');
    expect(deslocarMes('2026-09', 0)).toBe('2026-09');
    expect(deslocarMes('2026-09', -14)).toBe('2025-07');
  });
});
