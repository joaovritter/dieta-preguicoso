import { describe, expect, it } from 'vitest';
import { emailDosArgumentos } from './argumentos.js';

describe('emailDosArgumentos', () => {
  it('pega o único argumento e normaliza', () => {
    expect(emailDosArgumentos(['  Joao@UFN.edu.br '])).toBe('joao@ufn.edu.br');
  });

  it('ignora o "--" que o npm repassa', () => {
    expect(emailDosArgumentos(['--', 'joao@ufn.edu.br'])).toBe('joao@ufn.edu.br');
  });

  it('recusa sem argumento', () => {
    expect(emailDosArgumentos([])).toBeNull();
  });

  it('recusa mais de um e-mail', () => {
    expect(emailDosArgumentos(['a@b.com', 'c@d.com'])).toBeNull();
  });

  it('recusa o que não parece e-mail', () => {
    expect(emailDosArgumentos(['joao'])).toBeNull();
    expect(emailDosArgumentos(['joao@'])).toBeNull();
    expect(emailDosArgumentos(['@ufn.edu.br'])).toBeNull();
  });
});
