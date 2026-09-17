import { describe, expect, it } from 'vitest';
import { dataCurta, dataValida, milhar } from './format';

describe('milhar', () => {
  it('separa milhar com espaço não separável e arredonda', () => {
    expect(milhar(1476)).toBe('1 476');
    expect(milhar(2200.4)).toBe('2 200');
    expect(milhar(724)).toBe('724');
  });
});

describe('dataCurta', () => {
  it('dia e mês abreviado', () => {
    expect(dataCurta('2026-09-14')).toBe('14 set');
    expect(dataCurta('2026-03-01', true)).toBe('1 mar 2026');
  });
});

describe('dataValida', () => {
  const hoje = '2026-09-16';
  it('aceita data passada ou hoje', () => {
    expect(dataValida('2026-09-13', hoje)).toBe('2026-09-13');
    expect(dataValida(hoje, hoje)).toBe(hoje);
  });
  it('recusa ausente, lixo, inexistente e futuro', () => {
    expect(dataValida(null, hoje)).toBe(hoje);
    expect(dataValida('ontem', hoje)).toBe(hoje);
    expect(dataValida('2026-02-30', hoje)).toBe(hoje);
    expect(dataValida('2026-09-17', hoje)).toBe(hoje);
  });
});
