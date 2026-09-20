import { describe, expect, it } from 'vitest';
import { deveAnimarFundo, temWebgl } from './suporteWebgl';

describe('deveAnimarFundo', () => {
  it('anima só com WebGL e sem pedido de menos movimento', () => {
    expect(deveAnimarFundo(true, false)).toBe(true);
  });

  it('não anima sem WebGL', () => {
    expect(deveAnimarFundo(false, false)).toBe(false);
  });

  it('não anima quando o sistema pede menos movimento', () => {
    expect(deveAnimarFundo(true, true)).toBe(false);
    expect(deveAnimarFundo(false, true)).toBe(false);
  });
});

describe('temWebgl', () => {
  it('true quando o canvas devolve contexto webgl2', () => {
    const canvas = { getContext: (tipo: string) => (tipo === 'webgl2' ? {} : null) };
    expect(temWebgl(() => canvas)).toBe(true);
  });

  it('true quando só existe webgl 1', () => {
    const canvas = { getContext: (tipo: string) => (tipo === 'webgl' ? {} : null) };
    expect(temWebgl(() => canvas)).toBe(true);
  });

  it('false quando nenhum contexto existe', () => {
    expect(temWebgl(() => ({ getContext: () => null }))).toBe(false);
  });

  it('false quando criar o canvas ou o contexto explode', () => {
    expect(
      temWebgl(() => {
        throw new Error('sem DOM');
      }),
    ).toBe(false);
  });

  it('false fora do navegador (sem document)', () => {
    expect(temWebgl()).toBe(false);
  });
});
