import { describe, expect, it } from 'vitest';
import { abaDaRota, ehIdAba, ROTA_DA_ABA } from './abas';

describe('abaDaRota', () => {
  it('início só na raiz', () => {
    expect(abaDaRota('/')).toBe('inicio');
  });

  it('social cobre grupos e perfil público', () => {
    expect(abaDaRota('/social')).toBe('social');
    expect(abaDaRota('/grupos/abc')).toBe('social');
    expect(abaDaRota('/u/123')).toBe('social');
  });

  it('calendário e perfil', () => {
    expect(abaDaRota('/calendario')).toBe('calendario');
    expect(abaDaRota('/perfil')).toBe('perfil');
    expect(abaDaRota('/perfil/metas')).toBe('perfil');
  });

  it('relatório não marca aba', () => {
    expect(abaDaRota('/relatorio')).toBeNull();
    expect(abaDaRota('/qualquer')).toBeNull();
  });

  it('não confunde prefixos', () => {
    expect(abaDaRota('/perfilx')).toBeNull();
    expect(abaDaRota('/grupos')).toBeNull();
  });
});

describe('ROTA_DA_ABA e ehIdAba', () => {
  it('ida e volta', () => {
    for (const id of Object.keys(ROTA_DA_ABA)) {
      expect(ehIdAba(id)).toBe(true);
      if (ehIdAba(id)) expect(abaDaRota(ROTA_DA_ABA[id])).toBe(id);
    }
    expect(ehIdAba('relatorio')).toBe(false);
  });
});
