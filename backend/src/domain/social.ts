import { arredondar } from './nutricao.js';
import type { PerfilPublico, ProgressoDia, StatusDia } from './tipos.js';

/** Quanto o dia pode fugir da meta (para cima ou para baixo) e ainda contar como batida. */
const TOLERANCIA_PERCENTUAL = 10;

/**
 * Como o dia fechou em relação à meta de calorias. Dia sem nenhum registro não é
 * "abaixo da meta" — é dia sem dado, e o calendário mostra isso como vazio.
 */
export function statusDoDia(
  calorias: number,
  meta: number,
  quantidadeRegistros: number,
): StatusDia {
  if (quantidadeRegistros <= 0 || meta <= 0) return 'sem_registro';
  // Arredonda antes de comparar: o status precisa bater com o percentual que a tela mostra
  // (sem isso, 2200/2000 vira 110.00000000000001 e o dia certinho apareceria como estouro).
  const percentual = arredondar((calorias / meta) * 100);
  if (percentual < 100 - TOLERANCIA_PERCENTUAL) return 'abaixo';
  if (percentual > 100 + TOLERANCIA_PERCENTUAL) return 'acima';
  return 'na_meta';
}

export function progressoDoDia(
  data: string,
  calorias: number,
  meta: number,
  quantidadeRegistros: number,
): ProgressoDia {
  return {
    data,
    calorias: arredondar(calorias),
    meta_calorias: arredondar(meta),
    percentual: meta > 0 ? arredondar((calorias / meta) * 100) : 0,
    status: statusDoDia(calorias, meta, quantidadeRegistros),
    quantidade_registros: quantidadeRegistros,
  };
}

const RE_NOME_TAG = /^\s*(.+?)\s*#(\d{4})\s*$/;

/** Separa "joao#0427" em nome e tag. Devolve `null` se não estiver nesse formato. */
export function separarNomeTag(entrada: string): { nome: string; tag: string } | null {
  const m = RE_NOME_TAG.exec(entrada);
  if (!m || !m[1] || !m[2]) return null;
  return { nome: m[1], tag: m[2] };
}

export function montarNomeTag(nome: string, tag: string): string {
  return `${nome}#${tag}`;
}

export function paraPerfilPublico(u: {
  id: string;
  nome: string;
  tag: string;
  objetivo: PerfilPublico['objetivo'];
  foto_url: string | null;
  total_posts: number;
  total_amigos: number;
}): PerfilPublico {
  return {
    id: u.id,
    nome: u.nome,
    tag: u.tag,
    nome_tag: montarNomeTag(u.nome, u.tag),
    objetivo: u.objetivo,
    foto_url: u.foto_url,
    total_posts: u.total_posts,
    total_amigos: u.total_amigos,
  };
}
