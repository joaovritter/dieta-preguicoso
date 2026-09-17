import { describe, expect, it } from 'vitest';
import { FOLGA_FUTURO_MS, criadoEmValido } from './retroativo.js';

const agora = new Date('2026-09-16T15:00:00.000Z');

describe('criadoEmValido', () => {
  it('aceita um instante no passado', () => {
    expect(criadoEmValido('2026-09-13T15:00:00.000Z', agora)).toBe(true);
  });

  it('aceita exatamente agora', () => {
    expect(criadoEmValido(agora.toISOString(), agora)).toBe(true);
  });

  it('aceita relógio do aparelho um pouco adiantado (dentro da folga)', () => {
    const adiantado = new Date(agora.getTime() + FOLGA_FUTURO_MS - 1000).toISOString();
    expect(criadoEmValido(adiantado, agora)).toBe(true);
  });

  it('recusa além da folga', () => {
    const futuro = new Date(agora.getTime() + FOLGA_FUTURO_MS + 1000).toISOString();
    expect(criadoEmValido(futuro, agora)).toBe(false);
  });

  it('recusa o dia seguinte', () => {
    expect(criadoEmValido('2026-09-17T12:00:00.000Z', agora)).toBe(false);
  });
});
