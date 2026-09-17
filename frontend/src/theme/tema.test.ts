import { describe, expect, it } from 'vitest';
import { tema } from './tema';

describe('tema', () => {
  it('tem os tokens do modo claro', () => {
    const p = tema.colorSchemes.light?.palette;
    expect(p?.primary.main).toBe('#0B7A46');
    expect(p?.primary.vivo).toBe('#0CA85D');
    expect(p?.status.passou).toBe('#FF2146');
    expect(p?.pilula.sobrou).toEqual({ bg: '#E4EEFB', fg: '#1B69B8' });
    expect(p?.refeicao.ceia).toBe('#D6457A');
    expect(p?.agua.gradiente).toBe('linear-gradient(90deg,#2B87E3,#5AA9F0)');
  });

  it('tem os tokens do modo escuro', () => {
    const p = tema.colorSchemes.dark?.palette;
    expect(p?.background.default).toBe('#0d0f12');
    expect(p?.primary.contrastText).toBe('#07130e');
    expect(p?.status.vazio).toBe('#33383f');
    expect(p?.neutro.fraco).toBe('#525a66');
    expect(p?.refeicao.cafe).toBe('#D99B2E');
  });

  it('usa Plus Jakarta Sans', () => {
    expect(tema.typography.fontFamily).toContain('Plus Jakarta Sans Variable');
  });
});
