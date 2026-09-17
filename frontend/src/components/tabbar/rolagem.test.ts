import { describe, expect, it } from 'vitest';
import { decidirCompacta } from './rolagem';

describe('decidirCompacta', () => {
  it('perto do topo sempre normal', () => {
    expect(decidirCompacta(true, 20, 40)).toBe(false);
    expect(decidirCompacta(true, 0, 10)).toBe(false);
  });

  it('descendo mais que o limiar compacta', () => {
    expect(decidirCompacta(false, 7, 300)).toBe(true);
  });

  it('subindo mais que o limiar volta ao normal', () => {
    expect(decidirCompacta(true, -7, 300)).toBe(false);
  });

  it('movimento pequeno mantém o estado', () => {
    expect(decidirCompacta(true, 6, 300)).toBe(true);
    expect(decidirCompacta(false, -6, 300)).toBe(false);
  });
});
