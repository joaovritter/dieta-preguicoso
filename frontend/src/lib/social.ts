import type { Post, ProgressoDia, StatusDia } from './types';

export type CorAvatar =
  | 'status.sobrou'
  | 'macro.proteina'
  | 'macro.gordura'
  | 'status.meta'
  | 'text.secondary';

const CORES_AVATAR: CorAvatar[] = [
  'status.sobrou',
  'macro.proteina',
  'macro.gordura',
  'status.meta',
  'text.secondary',
];

/** Mesma pessoa, mesma cor, em qualquer tela. */
export function corDoAvatar(nome: string): CorAvatar {
  let soma = 0;
  for (const letra of nome.trim().toLowerCase()) soma += letra.codePointAt(0) ?? 0;
  return CORES_AVATAR[soma % CORES_AVATAR.length]!;
}

export function inicial(nome: string): string {
  const primeira = nome.trim().charAt(0);
  return primeira === '' ? '?' : primeira.toUpperCase();
}

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function tempoRelativo(iso: string, agora: Date): string {
  const instante = new Date(iso);
  const minutos = Math.floor((agora.getTime() - instante.getTime()) / 60_000);
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;

  const inicioDoDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dias = Math.round((inicioDoDia(agora) - inicioDoDia(instante)) / 86_400_000);
  if (dias <= 1) return 'ontem';
  if (dias <= 7) return `há ${dias} dias`;
  return `${instante.getDate()} ${MESES_CURTOS[instante.getMonth()]}`;
}

export function textoDoDia(p: ProgressoDia): string {
  switch (p.status) {
    case 'na_meta':
      return 'bateu a meta hoje';
    case 'acima':
      return `${Math.round(p.percentual - 100)}% acima da meta`;
    case 'abaixo':
      return `${Math.round(100 - p.percentual)}% abaixo da meta`;
    case 'sem_registro':
      return 'sem registro hoje';
  }
}

export type CorPonto = 'status.meta' | 'status.sobrou' | 'macro.gordura' | 'neutro.borda';

/** Bolinha 8px da lista de amigos. No design, "acima" é âmbar (não o vermelho do calendário). */
export function corDoPonto(status: StatusDia): CorPonto {
  switch (status) {
    case 'na_meta':
      return 'status.meta';
    case 'abaixo':
      return 'status.sobrou';
    case 'acima':
      return 'macro.gordura';
    case 'sem_registro':
      return 'neutro.borda';
  }
}

/** Troca otimista: a tela muda na hora e a chamada à API vem depois. */
export function alternarCurtida(post: Post): Post {
  return post.curti
    ? { ...post, curti: false, curtidas: Math.max(0, post.curtidas - 1) }
    : { ...post, curti: true, curtidas: post.curtidas + 1 };
}

/** Marca (ou desmarca, ao reverter uma falha) o post como salvo. */
export function definirSalvo(post: Post, salvo: boolean): Post {
  return { ...post, salvo };
}

export function textoRanking(posicao: number | null): string | null {
  return posicao === null ? null : `você é #${posicao} esta semana`;
}

export function membros(qtd: number): string {
  return `${qtd} ${qtd === 1 ? 'membro' : 'membros'}`;
}
