import { describe, expect, it } from 'vitest';
import { decidir, ESPERAS_MS, mensagemErro } from './retentativa.js';

describe('decidir', () => {
  it('repete no mesmo modelo enquanto houver espera sobrando', () => {
    expect(decidir(503, 0)).toBe('repetir');
    expect(decidir(429, ESPERAS_MS.length - 1)).toBe('repetir');
  });

  it('troca de modelo quando as tentativas acabam', () => {
    expect(decidir(503, ESPERAS_MS.length)).toBe('proximo-modelo');
  });

  it('troca de modelo direto no 404, que é modelo indisponível', () => {
    expect(decidir(404, 0)).toBe('proximo-modelo');
  });

  it('desiste quando o erro é nosso', () => {
    expect(decidir(400, 0)).toBe('desistir');
    expect(decidir(403, 0)).toBe('desistir');
  });
});

describe('mensagemErro', () => {
  it('separa limite de uso de sobrecarga', () => {
    expect(mensagemErro(429)).toMatch(/limite de uso/);
    expect(mensagemErro(503)).toMatch(/sobrecarregada/);
    expect(mensagemErro(400)).toMatch(/não consegui falar/);
  });
});
