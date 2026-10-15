import type { Refeicao, StatusDia } from './types';

export type StatusVisual = 'meta' | 'sobrou' | 'passou' | 'vazio';

const STATUS_DA_API: Record<StatusDia, StatusVisual> = {
  na_meta: 'meta',
  abaixo: 'sobrou',
  acima: 'passou',
  sem_registro: 'vazio',
};

/** Datas em YYYY-MM-DD comparam certo como texto. */
export function statusVisual(status: StatusDia, data: string, hoje: string): StatusVisual {
  if (data > hoje) return 'vazio';
  return STATUS_DA_API[status];
}

export const ROTULO_STATUS: Record<StatusVisual, string> = {
  meta: 'na meta',
  sobrou: 'sobrou',
  passou: 'passou da meta',
  vazio: 'sem registro',
};

export type CorRefeicao = 'cafe' | 'almoco' | 'lanche' | 'janta' | 'ceia';

const CICLO_CORES: CorRefeicao[] = ['cafe', 'almoco', 'lanche', 'janta', 'ceia'];

/** Refeições são livres por pessoa: a cor vem da posição por horário, não do nome. */
export function corDaRefeicao(refeicaoId: string, refeicoes: Refeicao[]): CorRefeicao {
  const ordenadas = [...refeicoes].sort((a, b) => a.inicio.localeCompare(b.inicio));
  const posicao = ordenadas.findIndex((item) => item.id === refeicaoId);
  return CICLO_CORES[Math.max(posicao, 0) % CICLO_CORES.length] ?? 'cafe';
}

/** Litros com até 2 casas: 250ml vira 0,25 (não 0,3); 1200ml vira 1,2. */
export function litros(ml: number): string {
  const l = Math.round(ml / 10) / 100;
  return l.toFixed(2).replace(/0$/, '').replace('.', ',');
}

function partesDoMes(mes: string): { ano: number; indice: number } {
  const [ano, numero] = mes.split('-').map(Number);
  return { ano: ano ?? 1970, indice: (numero ?? 1) - 1 };
}

export function mesLongo(mes: string): string {
  const { ano, indice } = partesDoMes(mes);
  return new Date(ano, indice, 1).toLocaleDateString('pt-BR', { month: 'long' });
}

export function deslocarMes(mes: string, delta: number): string {
  const { ano, indice } = partesDoMes(mes);
  const total = ano * 12 + indice + delta;
  const novoAno = Math.floor(total / 12);
  const novoMes = total - novoAno * 12 + 1;
  return `${novoAno}-${String(novoMes).padStart(2, '0')}`;
}
