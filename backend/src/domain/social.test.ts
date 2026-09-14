import { describe, expect, it } from 'vitest';
import { montarNomeTag, progressoDoDia, separarNomeTag, statusDoDia } from './social.js';

describe('statusDoDia', () => {
  it('conta como na meta quem ficou entre 90% e 110%', () => {
    expect(statusDoDia(2000, 2000, 3)).toBe('na_meta');
    expect(statusDoDia(1800, 2000, 3)).toBe('na_meta'); // 90% na borda
    expect(statusDoDia(2200, 2000, 3)).toBe('na_meta'); // 110% na borda
  });

  it('separa quem comeu de menos de quem estourou', () => {
    expect(statusDoDia(1700, 2000, 1)).toBe('abaixo'); // 85%
    expect(statusDoDia(2400, 2000, 1)).toBe('acima'); // 120%
  });

  it('decide a borda pelo percentual arredondado, igual ao que a tela mostra', () => {
    expect(statusDoDia(1799, 2000, 1)).toBe('na_meta'); // 89,95% → 90,0%
    expect(statusDoDia(1789, 2000, 1)).toBe('abaixo'); // 89,45% → 89,5%
  });

  it('dia sem registro nenhum não é "abaixo da meta", é dia sem dado', () => {
    expect(statusDoDia(0, 2000, 0)).toBe('sem_registro');
  });

  it('sem meta configurada não dá para julgar o dia', () => {
    expect(statusDoDia(1500, 0, 4)).toBe('sem_registro');
  });
});

describe('progressoDoDia', () => {
  it('arredonda a 1 casa e calcula o percentual', () => {
    const p = progressoDoDia('2026-05-02', 1833.333, 2000, 4);
    expect(p).toEqual({
      data: '2026-05-02',
      calorias: 1833.3,
      meta_calorias: 2000,
      percentual: 91.7,
      status: 'na_meta',
      quantidade_registros: 4,
    });
  });

  it('dia vazio vem zerado, sem dividir por zero', () => {
    const p = progressoDoDia('2026-05-03', 0, 0, 0);
    expect(p.percentual).toBe(0);
    expect(p.status).toBe('sem_registro');
  });
});

describe('separarNomeTag', () => {
  it('separa nome e tag de "joao#0427"', () => {
    expect(separarNomeTag('joao#0427')).toEqual({ nome: 'joao', tag: '0427' });
  });

  it('aceita nome com espaço e ignora espaço nas pontas', () => {
    expect(separarNomeTag('  joão da silva#0007 ')).toEqual({
      nome: 'joão da silva',
      tag: '0007',
    });
  });

  it('recusa o que não está no formato nome#0000', () => {
    expect(separarNomeTag('joao')).toBeNull();
    expect(separarNomeTag('joao#42')).toBeNull();
    expect(separarNomeTag('joao#abcd')).toBeNull();
    expect(separarNomeTag('#0427')).toBeNull();
  });

  it('usa a última # como separador, para nome que tem # no meio', () => {
    expect(separarNomeTag('a#b#1234')).toEqual({ nome: 'a#b', tag: '1234' });
  });

  it('é o inverso de montarNomeTag', () => {
    expect(separarNomeTag(montarNomeTag('joao', '0427'))).toEqual({ nome: 'joao', tag: '0427' });
  });
});
