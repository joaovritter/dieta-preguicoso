import { AppError } from '../lib/erros.js';
import type { Janela, Refeicao } from './tipos.js';
import { minutosDoDia } from './tempo.js';

const RE_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DIA_MINUTOS = 1440;

export function horaValida(hora: string): boolean {
  return RE_HORA.test(hora);
}

export function paraMinutos(hora: string): number {
  const m = RE_HORA.exec(hora);
  if (!m) throw new Error(`horário inválido: ${hora}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

function paraHora(minutos: number): string {
  const m = ((minutos % DIA_MINUTOS) + DIA_MINUTOS) % DIA_MINUTOS;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function cruzaMeiaNoite(r: { inicio: string; fim: string }): boolean {
  return paraMinutos(r.fim) < paraMinutos(r.inicio);
}

/** Uma faixa que cruza a meia-noite tem `fim` menor que `inicio` (ex.: ceia 22:01→04:59). */
function dentroDaFaixa(minutos: number, faixa: { inicio: string; fim: string }): boolean {
  const inicio = paraMinutos(faixa.inicio);
  const fim = paraMinutos(faixa.fim);
  return inicio <= fim ? minutos >= inicio && minutos <= fim : minutos >= inicio || minutos <= fim;
}

/**
 * Como as refeições existentes ficam depois de abrir espaço para `janela`.
 * Devolve só as que mudaram — quem não encosta na janela nova sai de fora.
 * `idIgnorado` é a própria refeição, quando é ela que está sendo movida.
 *
 * O dia é uma partição contígua: toda hora pertence a exatamente uma refeição.
 * Por isso a janela nova nunca pode engolir uma vizinha inteira nem cair no meio
 * de uma — nos dois casos a partição se quebraria, e adivinhar o que o usuário
 * quis seria pior que recusar.
 */
export function acomodar(
  existentes: Refeicao[],
  janela: Janela,
  idIgnorado?: string,
): Refeicao[] {
  const inicio = paraMinutos(janela.inicio);
  const fim = paraMinutos(janela.fim);

  if (fim < inicio) {
    throw new AppError('VALIDACAO', 'o fim tem que vir depois do início, no mesmo dia');
  }

  const mudadas: Refeicao[] = [];

  for (const atual of existentes) {
    if (atual.id === idIgnorado) continue;

    const aInicio = paraMinutos(atual.inicio);
    const aFim = paraMinutos(atual.fim);
    const atravessa = cruzaMeiaNoite(atual);

    // Fora da janela nova: nada a fazer.
    const cobreInicio = atravessa ? inicio >= aInicio || inicio <= aFim : inicio >= aInicio && inicio <= aFim;
    const cobreFim = atravessa ? fim >= aInicio || fim <= aFim : fim >= aInicio && fim <= aFim;
    const engolida = !atravessa && aInicio >= inicio && aFim <= fim;

    if (engolida) {
      throw new AppError('VALIDACAO', `essa faixa cobre ${atual.nome} inteira, escolha outra`);
    }
    if (!cobreInicio && !cobreFim) continue;

    // A janela nova começa e termina dentro da mesma vizinha: partiria ela em duas.
    if (cobreInicio && cobreFim && (atravessa || (inicio > aInicio && fim < aFim))) {
      throw new AppError('VALIDACAO', `essa faixa fica no meio de ${atual.nome}, escolha outra`);
    }

    if (cobreInicio && aInicio < inicio) {
      mudadas.push({ ...atual, fim: paraHora(inicio - 1) });
    } else {
      mudadas.push({ ...atual, inicio: paraHora(fim + 1) });
    }
  }

  return mudadas;
}

/**
 * Classifica a refeição pelo horário de parede do usuário.
 *
 * Se nenhuma faixa casar — o usuário configurou faixas com buracos — cai na faixa
 * cujo início é o mais próximo para trás, e em último caso na primeira faixa. Nunca
 * devolve nulo: o produto inteiro depende de nunca perguntar a refeição ao usuário.
 */
export function detectarRefeicao(
  instante: Date,
  timezone: string,
  refeicoes: Refeicao[],
): Refeicao {
  if (refeicoes.length === 0) {
    throw new AppError('ERRO_INTERNO', 'usuário sem refeições cadastradas');
  }
  const minutos = minutosDoDia(instante, timezone);

  for (const r of refeicoes) {
    if (dentroDaFaixa(minutos, r)) return r;
  }

  // Rede de segurança: com a partição contígua isso não acontece, mas uma lista
  // editada fora do app não pode derrubar o registro.
  let melhor = refeicoes[0]!;
  let menorDistancia = Number.POSITIVE_INFINITY;
  for (const r of refeicoes) {
    const distancia = (minutos - paraMinutos(r.inicio) + DIA_MINUTOS) % DIA_MINUTOS;
    if (distancia < menorDistancia) {
      menorDistancia = distancia;
      melhor = r;
    }
  }
  return melhor;
}
