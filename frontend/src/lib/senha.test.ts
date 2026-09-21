import { describe, expect, it } from 'vitest';
import { validarNovaSenha } from './senha';

describe('validarNovaSenha', () => {
  it('aceita senha de 8+ caracteres confirmada igual', () => {
    expect(validarNovaSenha('abcdefgh', 'abcdefgh')).toBeNull();
  });

  it('recusa senha curta antes de olhar a confirmação', () => {
    expect(validarNovaSenha('abc', 'xyz')).toBe('a senha nova precisa de pelo menos 8 caracteres');
  });

  it('recusa senha longa demais', () => {
    const longa = 'a'.repeat(201);
    expect(validarNovaSenha(longa, longa)).toBe('a senha nova pode ter no máximo 200 caracteres');
  });

  it('recusa confirmação diferente', () => {
    expect(validarNovaSenha('abcdefgh', 'abcdefgi')).toBe('as senhas não batem');
  });
});
