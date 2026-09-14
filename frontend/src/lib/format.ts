import type { Alimento, Objetivo, Refeicao, StatusDia, Totais } from './types';

export const REFEICOES: Refeicao[] = ['cafe_da_manha', 'almoco', 'lanche', 'janta', 'ceia'];

export const NOME_REFEICAO: Record<Refeicao, string> = {
  cafe_da_manha: 'café da manhã',
  almoco: 'almoço',
  lanche: 'lanche',
  janta: 'janta',
  ceia: 'ceia',
};

export const TEXTO_STATUS: Record<StatusDia, string> = {
  sem_registro: 'sem registro',
  abaixo: 'abaixo da meta',
  na_meta: 'na meta',
  acima: 'acima da meta',
};

export const NOME_OBJETIVO: Record<Objetivo, string> = {
  perder_peso: 'perder peso',
  manter: 'manter',
  ganhar_massa: 'ganhar massa',
};

/** Arredonda a 1 casa e some com o `.0` supérfluo. */
export function numero(valor: number): string {
  const arredondado = Math.round(valor * 10) / 10;
  return Number.isInteger(arredondado) ? String(arredondado) : arredondado.toFixed(1);
}

export function hojeISO(): string {
  return paraISO(new Date());
}

export function paraISO(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

/** Interpreta YYYY-MM-DD como data local (evita o deslize de fuso do `new Date(str)`). */
export function deISO(iso: string): Date {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano ?? 1970, (mes ?? 1) - 1, dia ?? 1);
}

export const LETRAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function letraDaSemana(iso: string): string {
  return LETRAS_SEMANA[deISO(iso).getDay()] ?? '?';
}

export function diaDoMes(iso: string): string {
  return String(deISO(iso).getDate());
}

export function ehHoje(iso: string): boolean {
  return iso === hojeISO();
}

export function dataLonga(iso: string): string {
  if (ehHoje(iso)) return 'hoje';
  return deISO(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
}

export function horaDoTimestamp(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function somarAlimentos(alimentos: Alimento[]): Totais {
  return alimentos.reduce<Totais>(
    (acc, item) => ({
      calorias: acc.calorias + item.calorias,
      carboidrato_g: acc.carboidrato_g + item.carboidrato_g,
      proteina_g: acc.proteina_g + item.proteina_g,
      gordura_g: acc.gordura_g + item.gordura_g,
    }),
    { calorias: 0, carboidrato_g: 0, proteina_g: 0, gordura_g: 0 },
  );
}

export function duracao(segundos: number): string {
  const min = Math.floor(segundos / 60);
  const seg = segundos % 60;
  return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
}
