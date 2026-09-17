import { describe, expect, it } from 'vitest';
import { PRESETS_PADRAO, ajustarPreset, lerPresets } from './presetsAgua';

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
