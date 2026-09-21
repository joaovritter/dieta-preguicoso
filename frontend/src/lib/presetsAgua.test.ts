import { describe, expect, it } from 'vitest';
import { PRESETS_PADRAO, ajustarPreset, lerAvulso, lerPresets, normalizarPreset, somarAvulso } from './presetsAgua';

describe('lerPresets', () => {
  it('sem nada salvo usa o padrão', () => {
    expect(lerPresets(null)).toEqual([200, 300, 500]);
  });
  it('lê o que foi salvo', () => {
    expect(lerPresets('[250,350,1000]')).toEqual([250, 350, 1000]);
  });
  it('lixo, tamanho errado ou fora da faixa volta ao padrão', () => {
    expect(lerPresets('{')).toEqual(PRESETS_PADRAO);
    expect(lerPresets('[200,300]')).toEqual(PRESETS_PADRAO);
    expect(lerPresets('[0,300,500]')).toEqual(PRESETS_PADRAO);
    expect(lerPresets('[200,300,2050]')).toEqual(PRESETS_PADRAO);
    expect(lerPresets('[210,300,500]')).toEqual(PRESETS_PADRAO);
  });
});

describe('ajustarPreset', () => {
  it('soma o delta só no índice pedido, sem mutar', () => {
    const antes = [200, 300, 500];
    expect(ajustarPreset(antes, 1, 50)).toEqual([200, 350, 500]);
    expect(antes).toEqual([200, 300, 500]);
  });
  it('trava entre 50 e 2000', () => {
    expect(ajustarPreset([50, 300, 500], 0, -50)).toEqual([50, 300, 500]);
    expect(ajustarPreset([200, 300, 2000], 2, 50)).toEqual([200, 300, 2000]);
  });
});

describe('normalizarPreset', () => {
  it('arredonda para múltiplo de 50 e trava entre 50 e 2000', () => {
    expect(normalizarPreset('260')).toBe(250);
    expect(normalizarPreset('275')).toBe(300);
    expect(normalizarPreset('10')).toBe(50);
    expect(normalizarPreset('9999')).toBe(2000);
  });
  it('vazio ou lixo vira null', () => {
    expect(normalizarPreset('')).toBeNull();
    expect(normalizarPreset('abc')).toBeNull();
  });
});

describe('lerAvulso', () => {
  it('aceita inteiro de 1 a 10000', () => {
    expect(lerAvulso('1')).toBe(1);
    expect(lerAvulso(' 750 ')).toBe(750);
    expect(lerAvulso('10000')).toBe(10000);
  });
  it('rejeita vazio, zero, decimal, negativo e acima do limite', () => {
    for (const ruim of ['', '0', '12.5', '-5', '10001', 'abc']) expect(lerAvulso(ruim)).toBeNull();
  });
});

describe('somarAvulso', () => {
  it('soma o delta e trava nos limites', () => {
    expect(somarAvulso('300', 50)).toBe(350);
    expect(somarAvulso('20', -50)).toBe(1);
    expect(somarAvulso('9980', 50)).toBe(10000);
  });
  it('texto inválido parte de zero', () => {
    expect(somarAvulso('', 50)).toBe(50);
    expect(somarAvulso('', -50)).toBe(1);
  });
});
