import { describe, expect, it } from 'vitest';
import {
  classificarExcecao,
  classificarStatus,
  decidir,
  ESPERAS_MS,
  falha,
} from './retentativa.js';

describe('classificarStatus', () => {
  it('separa os erros da API por motivo', () => {
    expect(classificarStatus(503).motivo).toBe('sobrecarga');
    expect(classificarStatus(500).motivo).toBe('sobrecarga');
    expect(classificarStatus(429).motivo).toBe('cota');
    expect(classificarStatus(404).motivo).toBe('modelo_indisponivel');
    expect(classificarStatus(401).motivo).toBe('chave_invalida');
    expect(classificarStatus(403).motivo).toBe('chave_invalida');
    expect(classificarStatus(400).motivo).toBe('pedido_invalido');
    expect(classificarStatus(418).motivo).toBe('desconhecido');
  });

  it('fala com a pessoa, não com o programador', () => {
    const todas = [400, 401, 404, 429, 503].map((s) => classificarStatus(s).mensagem);
    for (const m of todas) {
      expect(m).not.toMatch(/JSON|HTTP|token|API|[0-9]{3}/);
      expect(m.length).toBeLessThan(100);
    }
    expect(classificarStatus(503).mensagem).toMatch(/muita gente/);
    expect(classificarStatus(401).mensagem).toMatch(/quem cuida do app/);
  });
});

describe('classificarExcecao', () => {
  it('reconhece o estouro do tempo limite', () => {
    const e = new Error('timed out');
    e.name = 'TimeoutError';
    expect(classificarExcecao(e).motivo).toBe('timeout');
  });

  it('reconhece o timeout do SDK da OpenAI pelo nome', () => {
    const e = new Error('request timed out');
    e.name = 'APIConnectionTimeoutError';
    expect(classificarExcecao(e).motivo).toBe('timeout');
  });

  it('usa o status quando o SDK embrulha a resposta HTTP', () => {
    expect(classificarExcecao(Object.assign(new Error('rate limit'), { status: 429 })).motivo)
      .toBe('cota');
  });

  it('cai em rede quando não há status nem nome conhecido', () => {
    expect(classificarExcecao(new TypeError('fetch failed')).motivo).toBe('rede');
  });
});

describe('decidir', () => {
  it('repete timeout e queda de rede enquanto houver espera sobrando', () => {
    expect(decidir('timeout', 0)).toBe('repetir');
    expect(decidir('rede', ESPERAS_MS.length - 1)).toBe('repetir');
  });

  it('troca de modelo quando as tentativas acabam', () => {
    expect(decidir('timeout', ESPERAS_MS.length)).toBe('proximo-modelo');
  });

  it('troca de modelo já na primeira sobrecarga, sem esperar', () => {
    expect(decidir('sobrecarga', 0)).toBe('proximo-modelo');
    expect(decidir('cota', 0)).toBe('proximo-modelo');
  });

  it('troca de modelo direto quando o modelo não existe na conta', () => {
    expect(decidir('modelo_indisponivel', 0)).toBe('proximo-modelo');
  });

  it('desiste do que repetir não resolve', () => {
    expect(decidir('chave_invalida', 0)).toBe('desistir');
    expect(decidir('pedido_invalido', 0)).toBe('desistir');
    expect(decidir('resposta_invalida', 0)).toBe('desistir');
  });
});

describe('falha', () => {
  it('leva junto o código de domínio que vira o status HTTP', () => {
    expect(falha('sobrecarga').codigo).toBe('IA_INDISPONIVEL');
    expect(falha('resposta_invalida').codigo).toBe('IA_RESPOSTA_INVALIDA');
  });
});
