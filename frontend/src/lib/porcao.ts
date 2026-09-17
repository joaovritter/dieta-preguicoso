import type { Alimento } from './types';

export interface Porcao {
  quantidade: number;
  unidade: string;
}

const UNIDADE_COLADA = /^(g|kg|mg|ml|l)$/i;

export function lerPorcao(texto: string): Porcao {
  const achado = /^\s*(\d+(?:[.,]\d+)?)\s*(.*)$/.exec(texto);
  if (achado === null) return { quantidade: 1, unidade: 'porção' };
  const unidade = (achado[2] ?? '').trim();
  return {
    quantidade: Number((achado[1] ?? '1').replace(',', '.')),
    unidade: unidade === '' ? 'porção' : unidade,
  };
}

export function passoDaPorcao(p: Porcao): number {
  return p.quantidade < 2 ? 0.5 : 1;
}

export function formatarPorcao(p: Porcao): string {
  const numero = String(p.quantidade).replace('.', ',');
  return UNIDADE_COLADA.test(p.unidade) ? `${numero}${p.unidade}` : `${numero} ${p.unidade}`;
}

const umaCasa = (valor: number) => Math.round(valor * 10) / 10;

export function escalarAlimento(alimento: Alimento, novaQuantidade: number): Alimento {
  const porcao = lerPorcao(alimento.quantidade_estimada);
  if (novaQuantidade === porcao.quantidade) return alimento;
  const fator = novaQuantidade / porcao.quantidade;
  return {
    ...alimento,
    quantidade_estimada: formatarPorcao({ quantidade: novaQuantidade, unidade: porcao.unidade }),
    calorias: umaCasa(alimento.calorias * fator),
    carboidrato_g: umaCasa(alimento.carboidrato_g * fator),
    proteina_g: umaCasa(alimento.proteina_g * fator),
    gordura_g: umaCasa(alimento.gordura_g * fator),
  };
}
