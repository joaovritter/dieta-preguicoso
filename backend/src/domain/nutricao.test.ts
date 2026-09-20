import { describe, expect, it } from 'vitest';
import { calcularMetas, calorasDeMacros, metrica, somarTotais } from './nutricao.js';
import type { Alimento } from './tipos.js';

const alimento = (p: Partial<Alimento>): Alimento => ({
  nome: 'x',
  quantidade_estimada: '100g',
  calorias: 0,
  carboidrato_g: 0,
  proteina_g: 0,
  gordura_g: 0,
  ...p,
});

describe('somarTotais', () => {
  it('soma e arredonda a uma casa', () => {
    expect(
      somarTotais([
        alimento({ calorias: 195, carboidrato_g: 42.15, proteina_g: 4, gordura_g: 0.4 }),
        alimento({ calorias: 120.5, carboidrato_g: 0, proteina_g: 22.3, gordura_g: 3.1 }),
      ]),
    ).toEqual({ calorias: 315.5, carboidrato_g: 42.2, proteina_g: 26.3, gordura_g: 3.5 });
  });

  it('devolve zeros para lista vazia', () => {
    expect(somarTotais([])).toEqual({
      calorias: 0,
      carboidrato_g: 0,
      proteina_g: 0,
      gordura_g: 0,
    });
  });
});

describe('metrica', () => {
  it('mostra o que falta quando está abaixo da meta', () => {
    expect(metrica(1500, 2000)).toEqual({
      consumido: 1500,
      meta: 2000,
      percentual: 75,
      restante: 500,
      excedido: 0,
    });
  });

  it('mostra o excesso separado, em vez de zerar', () => {
    expect(metrica(2400, 2000)).toEqual({
      consumido: 2400,
      meta: 2000,
      percentual: 120,
      restante: 0,
      excedido: 400,
    });
  });

  it('não divide por zero quando a meta não foi configurada', () => {
    expect(metrica(300, 0)).toMatchObject({ percentual: 0, restante: 0, excedido: 300 });
  });
});

describe('calorasDeMacros', () => {
  it('calcula 4/4/9 a partir dos macros', () => {
    expect(calorasDeMacros(50, 20, 10)).toBe(370); // 200 + 80 + 90
  });

  it('devolve zero quando todos os macros são zero', () => {
    expect(calorasDeMacros(0, 0, 0)).toBe(0);
  });

  it('arredonda a 1 casa decimal', () => {
    expect(calorasDeMacros(10.5375, 0, 0)).toBe(42.2); // 4*10.5375 = 42.15 -> 42.2
  });
});

describe('calcularMetas', () => {
  it('aplica Mifflin-St Jeor com o ajuste do objetivo', () => {
    // TMB = 10*80 + 6.25*180 - 5*30 + 5 = 1780; GET = 1780*1.375 = 2447.5; -20% = 1958
    const metas = calcularMetas({
      sexo: 'M',
      idade: 30,
      peso_kg: 80,
      altura_cm: 180,
      objetivo: 'perder_peso',
    });
    expect(metas?.meta_calorias).toBe(1958);
    expect(metas?.meta_proteina_g).toBe(160);
    expect(metas?.meta_agua_ml).toBe(2800);
  });

  it('usa a constante feminina', () => {
    const m = calcularMetas({
      sexo: 'F',
      idade: 30,
      peso_kg: 60,
      altura_cm: 165,
      objetivo: 'manter',
    });
    // TMB = 600 + 1031.25 - 150 - 161 = 1320.25; GET = 1815.34
    expect(m?.meta_calorias).toBe(1815);
  });

  it('as calorias dos macros fecham com a meta calórica', () => {
    const m = calcularMetas({
      sexo: 'M',
      idade: 25,
      peso_kg: 75,
      altura_cm: 175,
      objetivo: 'manter',
    });
    expect(m).not.toBeNull();
    const somaMacros =
      m!.meta_carboidrato_g * 4 + m!.meta_proteina_g * 4 + m!.meta_gordura_g * 9;
    expect(somaMacros).toBeCloseTo(m!.meta_calorias, 0);
  });

  it('devolve null sem dados corporais, para não zerar o perfil', () => {
    expect(
      calcularMetas({ sexo: 'M', idade: null, peso_kg: 80, altura_cm: 180, objetivo: 'manter' }),
    ).toBeNull();
    expect(
      calcularMetas({ sexo: null, idade: 30, peso_kg: 80, altura_cm: 180, objetivo: 'manter' }),
    ).toBeNull();
  });
});
