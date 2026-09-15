import { afterEach, describe, expect, it, vi } from 'vitest';
import { logFalha, logSucesso } from './log.js';

const ctx = { entrada: 'foto' as const, modelo: 'gemini-3.6-flash', inicioMs: Date.now(), tentativas: 1 };

afterEach(() => vi.restoreAllMocks());

describe('logSucesso', () => {
  it('sai numa linha com entrada, modelo e quantos alimentos', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logSucesso(ctx, 3);
    expect(spy.mock.calls[0]?.[0]).toMatch(/^\[ia\] foto ok gemini-3\.6-flash \d+\.\ds 3 alimento\(s\)$/);
  });

  it('avisa quando só deu certo repetindo', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logSucesso({ ...ctx, tentativas: 4 }, 1);
    expect(spy.mock.calls[0]?.[0]).toMatch(/após 4 tentativas$/);
  });
});

describe('logFalha', () => {
  it('achata o JSON multilinha da API numa linha só', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logFalha(ctx, 'sobrecarga', '503 {\n  "error": {\n    "code": 503\n  }\n}');
    const linha = String(spy.mock.calls[0]?.[0]);
    expect(linha).not.toContain('\n');
    expect(linha).toContain('erro sobrecarga');
    expect(linha).toContain('503 { "error": { "code": 503 } }');
  });

  it('corta detalhe longo para não entupir o log', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logFalha(ctx, 'pedido_invalido', 'x'.repeat(500));
    expect(String(spy.mock.calls[0]?.[0]).length).toBeLessThan(300);
  });
});
