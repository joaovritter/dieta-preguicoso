import { describe, expect, it } from 'vitest';
import { extrairMililitros, parsearAlimentos } from './parse.js';
import { AppError } from '../lib/erros.js';

describe('parsearAlimentos', () => {
  it('lê a resposta bem-comportada', () => {
    const bruto = JSON.stringify({
      alimentos: [
        {
          nome: 'arroz branco',
          quantidade_estimada: '150g',
          calorias: 195,
          carboidrato_g: 42,
          proteina_g: 4,
          gordura_g: 0.4,
        },
      ],
    });
    expect(parsearAlimentos(bruto)).toEqual([
      {
        nome: 'arroz branco',
        quantidade_estimada: '150g',
        calorias: 195,
        carboidrato_g: 42,
        proteina_g: 4,
        gordura_g: 0.4,
      },
    ]);
  });

  it('desembrulha JSON vindo dentro de cerca de código', () => {
    const bruto = '```json\n{"alimentos":[{"nome":"ovo","quantidade_estimada":"1 un","calorias":72,"carboidrato_g":0.4,"proteina_g":6.3,"gordura_g":4.8}]}\n```';
    expect(parsearAlimentos(bruto)).toHaveLength(1);
  });

  it('aceita número em string e com unidade colada', () => {
    const bruto = JSON.stringify({
      alimentos: [
        {
          nome: 'pão',
          quantidade_estimada: '1 fatia',
          calorias: '80',
          carboidrato_g: '15 g',
          proteina_g: null,
          gordura_g: '1,2',
        },
      ],
    });
    expect(parsearAlimentos(bruto)[0]).toMatchObject({
      calorias: 80,
      carboidrato_g: 15,
      proteina_g: 0,
      gordura_g: 1.2,
    });
  });

  it('aceita lista vazia — foto sem comida é resposta válida', () => {
    expect(parsearAlimentos('{"alimentos":[]}')).toEqual([]);
  });

  it('rejeita resposta sem JSON', () => {
    expect(() => parsearAlimentos('desculpe, não consegui')).toThrow(AppError);
  });

  it('rejeita JSON sem a chave alimentos', () => {
    expect(() => parsearAlimentos('{"comida":[]}')).toThrow(AppError);
  });
});

describe('extrairMililitros', () => {
  it.each([
    ['bebi 300ml de água', 300],
    ['500 ml', 500],
    ['tomei 1 litro', 1000],
    ['1,5 litros', 1500],
    ['2 copos', 500],
    ['uma garrafa não conta, mas 1 garrafa sim', 500],
    ['250', 250],
  ])('%s → %i ml', (texto, esperado) => {
    expect(extrairMililitros(texto)).toBe(esperado);
  });

  it('devolve null quando não há número', () => {
    expect(extrairMililitros('bebi bastante água')).toBeNull();
  });

  it('rejeita valor absurdo', () => {
    expect(extrairMililitros('50 litros')).toBeNull();
  });
});
