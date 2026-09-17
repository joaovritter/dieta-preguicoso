import { describe, expect, it } from 'vitest';
import { escalarAlimento, formatarPorcao, lerPorcao, passoDaPorcao } from './porcao';
import type { Alimento } from './types';

const arroz: Alimento = {
  nome: 'arroz branco',
  quantidade_estimada: '4 colheres',
  calorias: 212,
  carboidrato_g: 48,
  proteina_g: 4,
  gordura_g: 1,
};

describe('lerPorcao', () => {
  it('lê número e unidade', () => {
    expect(lerPorcao('4 colheres')).toEqual({ quantidade: 4, unidade: 'colheres' });
  });
  it('aceita vírgula decimal e unidade colada', () => {
    expect(lerPorcao('1,5 xícara')).toEqual({ quantidade: 1.5, unidade: 'xícara' });
    expect(lerPorcao('150g')).toEqual({ quantidade: 150, unidade: 'g' });
  });
  it('sem número vira 1 porção', () => {
    expect(lerPorcao('um prato fundo')).toEqual({ quantidade: 1, unidade: 'porção' });
    expect(lerPorcao('')).toEqual({ quantidade: 1, unidade: 'porção' });
  });
  it('número sozinho vira porção', () => {
    expect(lerPorcao('2')).toEqual({ quantidade: 2, unidade: 'porção' });
  });
});

describe('passoDaPorcao', () => {
  it('é 1 a partir de 2', () => {
    expect(passoDaPorcao({ quantidade: 4, unidade: 'colheres' })).toBe(1);
    expect(passoDaPorcao({ quantidade: 2, unidade: 'fatias' })).toBe(1);
  });
  it('é 0,5 abaixo de 2', () => {
    expect(passoDaPorcao({ quantidade: 1, unidade: 'concha' })).toBe(0.5);
    expect(passoDaPorcao({ quantidade: 1.5, unidade: 'xícara' })).toBe(0.5);
  });
});

describe('formatarPorcao', () => {
  it('usa vírgula e espaço', () => {
    expect(formatarPorcao({ quantidade: 1.5, unidade: 'porção' })).toBe('1,5 porção');
  });
  it('cola unidades de medida curtas', () => {
    expect(formatarPorcao({ quantidade: 200, unidade: 'ml' })).toBe('200ml');
    expect(formatarPorcao({ quantidade: 150, unidade: 'G' })).toBe('150G');
  });
});

describe('escalarAlimento', () => {
  it('multiplica kcal e macros pelo fator e reescreve a quantidade', () => {
    expect(escalarAlimento(arroz, 6)).toEqual({
      nome: 'arroz branco',
      quantidade_estimada: '6 colheres',
      calorias: 318,
      carboidrato_g: 72,
      proteina_g: 6,
      gordura_g: 1.5,
    });
  });
  it('arredonda a 1 casa', () => {
    const r = escalarAlimento({ ...arroz, quantidade_estimada: '3 colheres', calorias: 100 }, 1);
    expect(r.calorias).toBe(33.3);
  });
  it('mesma quantidade devolve o alimento intacto', () => {
    const texto = { ...arroz, quantidade_estimada: 'um prato' };
    expect(escalarAlimento(texto, 1)).toBe(texto);
  });
});
