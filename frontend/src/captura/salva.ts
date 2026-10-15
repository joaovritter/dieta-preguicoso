import { somarAlimentos } from '../lib/format';
import { listaDeAlimentos } from '../lib/social';
import type { Alimento, Interpretacao, Refeicao } from '../lib/types';

const DIA_MINUTOS = 1440;

function minutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Mesma regra do servidor: a faixa que contém a hora; se houver buraco, a que começou mais perto antes. */
export function refeicaoDoHorario(refeicoes: Refeicao[], instante: Date): Refeicao | undefined {
  const agora = instante.getHours() * 60 + instante.getMinutes();
  const dentro = refeicoes.find((r) => {
    const inicio = minutos(r.inicio);
    const fim = minutos(r.fim);
    return inicio <= fim ? agora >= inicio && agora <= fim : agora >= inicio || agora <= fim;
  });
  if (dentro !== undefined) return dentro;

  let melhor: Refeicao | undefined;
  let menor = Number.POSITIVE_INFINITY;
  for (const r of refeicoes) {
    const distancia = (agora - minutos(r.inicio) + DIA_MINUTOS) % DIA_MINUTOS;
    if (distancia < menor) {
      menor = distancia;
      melhor = r;
    }
  }
  return melhor;
}

/** Monta, sem chamar a IA, a tela de confirmação para alimentos que vieram das refeições salvas. */
export function interpretacaoDeSalva(
  alimentos: Alimento[],
  refeicoes: Refeicao[],
  instante: Date,
): Interpretacao | null {
  const refeicao = refeicaoDoHorario(refeicoes, instante);
  if (refeicao === undefined || alimentos.length === 0) return null;
  return {
    tipo_entrada: 'texto',
    descricao_bruta: listaDeAlimentos(alimentos),
    midia_url: null,
    refeicao_sugerida: refeicao,
    alimentos,
    totais: somarAlimentos(alimentos),
  };
}
