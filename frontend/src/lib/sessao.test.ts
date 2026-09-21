import { describe, expect, it } from 'vitest';
import { encerraSessao } from './sessao';

describe('encerraSessao', () => {
  it('401 de rota autenticada derruba a sessão', () => {
    expect(encerraSessao(401, 'NAO_AUTORIZADO', false)).toBe(true);
  });

  it('conta desativada derruba a sessão', () => {
    expect(encerraSessao(403, 'CONTA_DESATIVADA', false)).toBe(true);
  });

  it('outro 403 não derruba', () => {
    expect(encerraSessao(403, 'SEM_ACESSO', false)).toBe(false);
  });

  it('senha errada (400) não derruba', () => {
    expect(encerraSessao(400, 'SENHA_INCORRETA', false)).toBe(false);
  });

  it('login e cadastro (sem auth) nunca derrubam: o erro aparece no formulário', () => {
    expect(encerraSessao(401, 'CREDENCIAIS_INVALIDAS', true)).toBe(false);
    expect(encerraSessao(403, 'CONTA_DESATIVADA', true)).toBe(false);
  });
});
