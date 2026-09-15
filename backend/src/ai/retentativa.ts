import type { CodigoErro } from '../lib/erros.js';

/**
 * Classifica o que deu errado numa chamada à IA e decide se vale insistir.
 * Fica separado dos provedores para poder ser testado sem rede.
 */

/** Esperas entre as tentativas no mesmo modelo, em ms. */
export const ESPERAS_MS = [1_000, 3_000];

export type Motivo =
  | 'sobrecarga'
  | 'cota'
  | 'modelo_indisponivel'
  | 'chave_invalida'
  | 'pedido_invalido'
  | 'timeout'
  | 'rede'
  | 'resposta_invalida'
  | 'desconhecido';

export interface Falha {
  motivo: Motivo;
  /** Código de domínio que vai virar a resposta HTTP. */
  codigo: CodigoErro;
  /** Texto que a pessoa lê na tela. */
  mensagem: string;
}

const FALHAS: Record<Motivo, Omit<Falha, 'motivo'>> = {
  sobrecarga: {
    codigo: 'IA_INDISPONIVEL',
    mensagem: 'a IA está sobrecarregada agora, tente de novo em instantes',
  },
  cota: {
    codigo: 'IA_INDISPONIVEL',
    mensagem: 'a IA atingiu o limite de uso, tente de novo em alguns minutos',
  },
  modelo_indisponivel: {
    codigo: 'IA_INDISPONIVEL',
    mensagem: 'a IA está mal configurada no servidor, avise o administrador',
  },
  chave_invalida: {
    codigo: 'IA_INDISPONIVEL',
    mensagem: 'a IA está mal configurada no servidor, avise o administrador',
  },
  pedido_invalido: {
    codigo: 'IA_RESPOSTA_INVALIDA',
    mensagem: 'a IA recusou este envio, tente com outra foto ou descreva por texto',
  },
  timeout: {
    codigo: 'IA_INDISPONIVEL',
    mensagem: 'a IA demorou demais para responder, tente de novo',
  },
  rede: {
    codigo: 'IA_INDISPONIVEL',
    mensagem: 'não consegui falar com a IA agora, tente de novo',
  },
  resposta_invalida: {
    codigo: 'IA_RESPOSTA_INVALIDA',
    mensagem: 'a IA respondeu de um jeito que eu não entendi, tente de novo',
  },
  desconhecido: {
    codigo: 'IA_INDISPONIVEL',
    mensagem: 'não consegui falar com a IA agora, tente de novo',
  },
};

export function falha(motivo: Motivo): Falha {
  return { motivo, ...FALHAS[motivo] };
}

/**
 * 429 é cota (por minuto ou por dia) e 5xx é sobrecarga: ambos passam sozinhos.
 * 404 é modelo que não existe nesta chave. 401/403 é chave errada ou sem
 * permissão. 400 é o pedido em si — arquivo que a API não aceitou, prompt
 * bloqueado — e repetir igual não muda o resultado.
 */
export function classificarStatus(status: number): Falha {
  if (status === 429) return falha('cota');
  if (status >= 500) return falha('sobrecarga');
  if (status === 404) return falha('modelo_indisponivel');
  if (status === 401 || status === 403) return falha('chave_invalida');
  if (status === 400) return falha('pedido_invalido');
  return falha('desconhecido');
}

/**
 * Erro que nem chegou a virar resposta HTTP: estouro do tempo limite ou rede
 * fora. O SDK da OpenAI embrulha o status numa exceção — quando ele vem, vale
 * mais que o nome do erro.
 */
export function classificarExcecao(e: unknown): Falha {
  const status = (e as { status?: unknown } | null)?.status;
  if (typeof status === 'number') return classificarStatus(status);
  const nome = e instanceof Error ? e.name : '';
  if (/timeout/i.test(nome) || nome === 'AbortError') return falha('timeout');
  return falha('rede');
}

export type Acao = 'repetir' | 'proximo-modelo' | 'desistir';

/**
 * Problema passageiro rende até três tentativas no mesmo modelo; depois disso,
 * e sempre que o modelo não existe na conta, a vez passa para o próximo da
 * lista. Erro de configuração ou de pedido desiste na hora.
 */
export function decidir(motivo: Motivo, tentativa: number): Acao {
  if (motivo === 'sobrecarga' || motivo === 'cota' || motivo === 'timeout' || motivo === 'rede') {
    return tentativa < ESPERAS_MS.length ? 'repetir' : 'proximo-modelo';
  }
  if (motivo === 'modelo_indisponivel') return 'proximo-modelo';
  return 'desistir';
}
