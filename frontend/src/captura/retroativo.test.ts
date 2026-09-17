import { describe, expect, it } from 'vitest';
import { criadoEmParaDia } from './retroativo';

describe('criadoEmParaDia', () => {
  const agora = new Date(2026, 8, 16, 13, 45, 10);

  it('sem dia escolhido devolve undefined (a API usa agora)', () => {
    expect(criadoEmParaDia(null, agora)).toBeUndefined();
  });

  it('hoje devolve undefined', () => {
    expect(criadoEmParaDia('2026-09-16', agora)).toBeUndefined();
  });

  it('dia passado usa a hora atual do aparelho naquele dia', () => {
    expect(criadoEmParaDia('2026-09-13', agora)).toBe(new Date(2026, 8, 13, 13, 45, 10).toISOString());
  });

  it('atravessa virada de ano', () => {
    const cedo = new Date(2026, 0, 2, 8, 0, 0);
    expect(criadoEmParaDia('2025-12-31', cedo)).toBe(new Date(2025, 11, 31, 8, 0, 0).toISOString());
  });
});
