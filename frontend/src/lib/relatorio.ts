import type {
  GrupoRefeicao,
  RelatorioDia,
  RelatorioMes,
  RelatorioRefeicao,
  ResumoDia,
  StatusDia,
} from './types';

export interface LinhaVariacao {
  sentido: 'menos' | 'mais';
  texto: string;
}

export interface OpcaoFiltro {
  /** `null` = todas as refeições. */
  id: string | null;
  rotulo: string;
}

export type VisaoRelatorio = { tipo: 'mes'; mes: string } | { tipo: 'dia'; data: string };

export interface ItemBarra {
  refeicao_id: string;
  refeicao_nome: string;
  calorias: number;
}

const MESES_CURTOS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const RE_MES = /^\d{4}-(0[1-9]|1[0-2])$/;
const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;
const TOLERANCIA_PERCENTUAL = 10;

/** Refeições são nomes livres: "na janta", "no lanche". Heurística pela última letra. */
export function preposicao(nome: string): 'no' | 'na' {
  return nome.trim().toLowerCase().endsWith('a') ? 'na' : 'no';
}

export function linhasDeVariacao(
  porRefeicao: RelatorioRefeicao[],
  nomeMesAnterior: string,
): LinhaVariacao[] {
  return porRefeicao
    .filter((r): r is RelatorioRefeicao & { variacao_percentual: number } =>
      r.variacao_percentual !== null && Math.round(Math.abs(r.variacao_percentual)) > 0,
    )
    .sort((a, b) => Math.abs(b.variacao_percentual) - Math.abs(a.variacao_percentual))
    .slice(0, 2)
    .map((r) => {
      const nome = r.refeicao_nome.toLowerCase();
      const pct = Math.round(Math.abs(r.variacao_percentual));
      return r.variacao_percentual < 0
        ? { sentido: 'menos' as const, texto: `↓ ${pct}% menos ${preposicao(nome)} ${nome} que em ${nomeMesAnterior}` }
        : { sentido: 'mais' as const, texto: `↑ ${pct}% mais ${preposicao(nome)} ${nome} que em ${nomeMesAnterior}` };
    });
}

export function opcoesDeFiltro(relatorio: RelatorioMes): OpcaoFiltro[] {
  const nomes = new Map<string, string>();
  for (const dia of relatorio.dias) {
    for (const r of dia.refeicoes) nomes.set(r.refeicao_id, r.refeicao_nome);
  }
  const ordem = relatorio.por_refeicao.map((r) => r.refeicao_id);
  const posicao = (id: string) => {
    const i = ordem.indexOf(id);
    return i === -1 ? ordem.length : i;
  };
  const ids = [...nomes.keys()].sort((a, b) => posicao(a) - posicao(b));
  return [
    { id: null, rotulo: 'todas as refeições' },
    ...ids.map((id) => ({ id, rotulo: `só ${(nomes.get(id) ?? '').toLowerCase()}` })),
  ];
}

export function proximoFiltro(opcoes: OpcaoFiltro[], atual: string | null): string | null {
  const indice = opcoes.findIndex((o) => o.id === atual);
  if (indice === -1) return null;
  return opcoes[(indice + 1) % opcoes.length]?.id ?? null;
}

export function diasFiltrados(dias: RelatorioDia[], filtro: string | null): RelatorioDia[] {
  if (filtro === null) return dias;
  return dias
    .map((dia) => {
      const refeicoes = dia.refeicoes.filter((r) => r.refeicao_id === filtro);
      const calorias = Math.round(refeicoes.reduce((s, r) => s + r.calorias, 0) * 10) / 10;
      return { ...dia, calorias, refeicoes };
    })
    .filter((dia) => dia.refeicoes.length > 0);
}

export function kcal(valor: number): string {
  return String(Math.round(valor)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function diaCurto(data: string): string {
  const [, mes, dia] = data.split('-').map(Number);
  return `${dia ?? ''} ${MESES_CURTOS[(mes ?? 1) - 1] ?? ''}`;
}

/** Datas como dia do calendário, sem fuso: tudo em UTC para não escorregar um dia. */
function dataUtc(data: string): Date | null {
  if (!RE_DATA.test(data)) return null;
  const [ano, mes, dia] = data.split('-').map(Number);
  const d = new Date(Date.UTC(ano ?? 0, (mes ?? 1) - 1, dia ?? 1));
  return d.toISOString().slice(0, 10) === data ? d : null;
}

export function visaoDosParametros(params: URLSearchParams, hoje: string): VisaoRelatorio {
  const mesAtual = hoje.slice(0, 7);
  const data = params.get('data');
  if (data !== null && dataUtc(data) !== null && data <= hoje) return { tipo: 'dia', data };
  const mes = params.get('mes');
  if (mes !== null && RE_MES.test(mes) && mes <= mesAtual) return { tipo: 'mes', mes };
  return { tipo: 'mes', mes: mesAtual };
}

export function deslocarDia(data: string, delta: number): string {
  const d = dataUtc(data);
  if (d === null) return data;
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function podeAvancarMes(mes: string, hoje: string): boolean {
  return mes < hoje.slice(0, 7);
}

export function podeAvancarDia(data: string, hoje: string): boolean {
  return data < hoje;
}

/** Espelho de `statusDoDia` do backend (`domain/social.ts`) — manter as duas iguais. */
export function statusDoDia(calorias: number, meta: number, quantidadeRegistros: number): StatusDia {
  if (quantidadeRegistros <= 0 || meta <= 0) return 'sem_registro';
  const percentual = Math.round((calorias / meta) * 100 * 10) / 10;
  if (percentual < 100 - TOLERANCIA_PERCENTUAL) return 'abaixo';
  if (percentual > 100 + TOLERANCIA_PERCENTUAL) return 'acima';
  return 'na_meta';
}

export function barrasDoMes(porRefeicao: RelatorioRefeicao[]): ItemBarra[] {
  return porRefeicao.map((r) => ({
    refeicao_id: r.refeicao_id,
    refeicao_nome: r.refeicao_nome,
    calorias: r.media_calorias,
  }));
}

export function barrasDoDia(refeicoes: ResumoDia['refeicoes']): ItemBarra[] {
  return refeicoes
    .filter((r) => r.calorias > 0)
    .map((r) => ({ refeicao_id: r.refeicao_id, refeicao_nome: r.refeicao_nome, calorias: r.calorias }));
}

export function descricaoDoGrupo(grupo: GrupoRefeicao): string {
  return grupo.registros.flatMap((r) => r.alimentos_detectados.map((a) => a.nome)).join(', ');
}
