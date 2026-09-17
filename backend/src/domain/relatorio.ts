import { arredondar } from './nutricao.js';
import { dataLocal } from './tempo.js';
import type { Refeicao, Registro } from './tipos.js';

export interface RelatorioRefeicao {
  refeicao_id: string;
  refeicao_nome: string;
  media_calorias: number;
  variacao_percentual: number | null;
}

export interface RelatorioDiaRefeicao {
  refeicao_id: string;
  refeicao_nome: string;
  calorias: number;
  descricao: string;
}

export interface RelatorioDia {
  data: string;
  calorias: number;
  refeicoes: RelatorioDiaRefeicao[];
}

/** Corpo de `GET /api/resumo/mes` sem o campo `mes`, que a rota acrescenta. */
export interface RelatorioMes {
  media_calorias: number;
  por_refeicao: RelatorioRefeicao[];
  dias: RelatorioDia[];
}

function porDiaLocal(registros: Registro[], timezone: string): Map<string, Registro[]> {
  const dias = new Map<string, Registro[]>();
  for (const r of registros) {
    const data = dataLocal(new Date(r.criado_em), timezone);
    const doDia = dias.get(data);
    if (doDia) doDia.push(r);
    else dias.set(data, [r]);
  }
  return dias;
}

function kcalPorRefeicao(registros: Registro[]): Map<string, number> {
  const totais = new Map<string, number>();
  for (const r of registros) {
    totais.set(r.refeicao_id, (totais.get(r.refeicao_id) ?? 0) + r.calorias_total);
  }
  return totais;
}

function somaKcal(registros: Registro[]): number {
  return registros.reduce((s, r) => s + r.calorias_total, 0);
}

/**
 * Relatório de um mês. As médias dividem pelos dias com pelo menos um registro — um dia
 * em branco é dia não anotado, não dia de jejum, e puxaria a média para baixo à toa.
 */
export function montarRelatorioMes(
  registrosMes: Registro[],
  registrosMesAnterior: Registro[],
  refeicoes: Refeicao[],
  timezone: string,
): RelatorioMes {
  const ordenadas = [...refeicoes].sort((a, b) => a.inicio.localeCompare(b.inicio));
  const posicao = new Map(ordenadas.map((r, i) => [r.id, i]));

  const dias = porDiaLocal(registrosMes, timezone);
  const quantidadeDias = dias.size;
  const quantidadeDiasAnterior = porDiaLocal(registrosMesAnterior, timezone).size;
  const atual = kcalPorRefeicao(registrosMes);
  const anterior = kcalPorRefeicao(registrosMesAnterior);

  const media_calorias =
    quantidadeDias > 0 ? Math.round(somaKcal(registrosMes) / quantidadeDias) : 0;

  const por_refeicao = ordenadas
    .filter((r) => (atual.get(r.id) ?? 0) > 0)
    .map((r) => {
      const media = (atual.get(r.id) ?? 0) / quantidadeDias;
      const mediaAnterior =
        quantidadeDiasAnterior > 0 ? (anterior.get(r.id) ?? 0) / quantidadeDiasAnterior : 0;
      return {
        refeicao_id: r.id,
        refeicao_nome: r.nome,
        media_calorias: Math.round(media),
        variacao_percentual:
          mediaAnterior > 0 ? arredondar(((media - mediaAnterior) / mediaAnterior) * 100) : null,
      };
    })
    .sort(
      (a, b) =>
        b.media_calorias - a.media_calorias ||
        (posicao.get(a.refeicao_id) ?? 0) - (posicao.get(b.refeicao_id) ?? 0),
    );

  const listaDias = [...dias.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([data, doDia]) => ({
      data,
      calorias: arredondar(somaKcal(doDia)),
      refeicoes: ordenadas
        .map((refeicao) => ({ refeicao, registros: doDia.filter((r) => r.refeicao_id === refeicao.id) }))
        .filter(({ registros }) => registros.length > 0)
        .map(({ refeicao, registros }) => ({
          refeicao_id: refeicao.id,
          refeicao_nome: refeicao.nome,
          calorias: arredondar(somaKcal(registros)),
          descricao: registros
            .flatMap((r) => r.alimentos_detectados.map((a) => a.nome.trim()))
            .filter((nome) => nome.length > 0)
            .join(', '),
        })),
    }));

  return { media_calorias, por_refeicao, dias: listaDias };
}
