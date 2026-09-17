import { describe, expect, it } from 'vitest';
import { BRILHO_REPOUSO, posicaoRelativa } from './brilho';

const rect = { left: 100, top: 500, width: 300, height: 60 };

describe('posicaoRelativa', () => {
  it('converte para porcentagem da pílula', () => {
    expect(posicaoRelativa(250, 530, rect)).toEqual({ x: 50, y: 50 });
    expect(posicaoRelativa(100, 500, rect)).toEqual({ x: 0, y: 0 });
    expect(posicaoRelativa(400, 560, rect)).toEqual({ x: 100, y: 100 });
  });

  it('prende entre 0 e 100 quando o dedo sai da pílula', () => {
    expect(posicaoRelativa(0, 900, rect)).toEqual({ x: 0, y: 100 });
    expect(posicaoRelativa(999, 0, rect)).toEqual({ x: 100, y: 0 });
  });

  it('retângulo sem tamanho volta ao repouso', () => {
    expect(posicaoRelativa(10, 10, { left: 0, top: 0, width: 0, height: 0 })).toEqual(BRILHO_REPOUSO);
  });
});
