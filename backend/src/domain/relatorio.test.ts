import { describe, expect, it } from 'vitest';
import { montarRelatorioMes } from './relatorio.js';
import type { Alimento, Refeicao, Registro } from './tipos.js';

const TZ = 'America/Sao_Paulo';

const CAFE: Refeicao = { id: 'cafe', nome: 'Café da manhã', inicio: '05:00', fim: '10:00' };
const ALMOCO: Refeicao = { id: 'almoco', nome: 'Almoço', inicio: '10:01', fim: '15:00' };
const LANCHE: Refeicao = { id: 'lanche', nome: 'Lanche', inicio: '15:01', fim: '18:00' };
const JANTA: Refeicao = { id: 'janta', nome: 'Janta', inicio: '18:01', fim: '22:00' };
const CEIA: Refeicao = { id: 'ceia', nome: 'Ceia', inicio: '22:01', fim: '04:59' };
const REFEICOES = [CAFE, ALMOCO, LANCHE, JANTA, CEIA];

function alimento(nome: string, calorias: number): Alimento {
  return { nome, quantidade_estimada: '1 porção', calorias, carboidrato_g: 0, proteina_g: 0, gordura_g: 0 };
}

let contador = 0;
function registro(refeicao: Refeicao, criadoEm: string, alimentos: Alimento[]): Registro {
  contador += 1;
  return {
    id: `r${contador}`,
    tipo_entrada: 'texto',
    refeicao_id: refeicao.id,
    refeicao_nome: refeicao.nome,
    descricao_bruta: '',
    midia_url: null,
    alimentos_detectados: alimentos,
    calorias_total: alimentos.reduce((s, a) => s + a.calorias, 0),
    carboidrato_total_g: 0,
    proteina_total_g: 0,
    gordura_total_g: 0,
    criado_em: criadoEm,
  };
}

describe('montarRelatorioMes', () => {
  it('mês sem registro devolve tudo zerado e vazio', () => {
    expect(montarRelatorioMes([], [], REFEICOES, TZ)).toEqual({
      media_calorias: 0,
      por_refeicao: [],
      dias: [],
    });
  });

  it('média do mês divide só pelos dias com registro', () => {
    const mes = [
      registro(ALMOCO, '2026-09-10T15:00:00Z', [alimento('arroz', 800)]),
      registro(JANTA, '2026-09-10T22:00:00Z', [alimento('sopa', 400)]),
      registro(ALMOCO, '2026-09-12T15:00:00Z', [alimento('lasanha', 600)]),
    ];
    expect(montarRelatorioMes(mes, [], REFEICOES, TZ).media_calorias).toBe(900);
  });

  it('média por refeição divide pelos dias com registro de qualquer refeição, em ordem desc', () => {
    const mes = [
      registro(ALMOCO, '2026-09-10T15:00:00Z', [alimento('arroz', 800)]),
      registro(JANTA, '2026-09-10T22:00:00Z', [alimento('sopa', 400)]),
      registro(ALMOCO, '2026-09-12T15:00:00Z', [alimento('lasanha', 600)]),
    ];
    const { por_refeicao } = montarRelatorioMes(mes, [], REFEICOES, TZ);
    expect(por_refeicao).toEqual([
      { refeicao_id: 'almoco', refeicao_nome: 'Almoço', media_calorias: 700, variacao_percentual: null },
      { refeicao_id: 'janta', refeicao_nome: 'Janta', media_calorias: 200, variacao_percentual: null },
    ]);
  });

  it('variação compara com a média do mês anterior e é null quando lá era 0', () => {
    const mes = [
      registro(ALMOCO, '2026-09-10T15:00:00Z', [alimento('arroz', 700)]),
      registro(JANTA, '2026-09-10T22:00:00Z', [alimento('sopa', 400)]),
    ];
    const anterior = [
      registro(ALMOCO, '2026-08-03T15:00:00Z', [alimento('arroz', 600)]),
      registro(ALMOCO, '2026-08-04T15:00:00Z', [alimento('arroz', 400)]),
    ];
    const { por_refeicao } = montarRelatorioMes(mes, anterior, REFEICOES, TZ);
    // agosto: 1000 kcal de almoço ÷ 2 dias = 500; setembro: 700 ÷ 1 dia = 700 → +40%
    expect(por_refeicao.find((r) => r.refeicao_id === 'almoco')?.variacao_percentual).toBe(40);
    expect(por_refeicao.find((r) => r.refeicao_id === 'janta')?.variacao_percentual).toBeNull();
  });

  it('arredonda a variação a 1 casa e a média a inteiro', () => {
    const mes = [registro(ALMOCO, '2026-09-10T15:00:00Z', [alimento('arroz', 310.4)])];
    const anterior = [registro(ALMOCO, '2026-08-10T15:00:00Z', [alimento('arroz', 300)])];
    const [almoco] = montarRelatorioMes(mes, anterior, REFEICOES, TZ).por_refeicao;
    expect(almoco?.media_calorias).toBe(310);
    expect(almoco?.variacao_percentual).toBe(3.5);
  });

  it('refeição com 0 kcal no mês fica fora de por_refeicao, mas aparece no dia', () => {
    const mes = [
      registro(ALMOCO, '2026-09-10T15:00:00Z', [alimento('arroz', 500)]),
      registro(LANCHE, '2026-09-10T19:00:00Z', [alimento('chá', 0)]),
    ];
    const rel = montarRelatorioMes(mes, [], REFEICOES, TZ);
    expect(rel.por_refeicao.map((r) => r.refeicao_id)).toEqual(['almoco']);
    expect(rel.dias[0]?.refeicoes.map((r) => r.refeicao_id)).toEqual(['almoco', 'lanche']);
  });

  it('empate na média segue a ordem de início da refeição, mesmo com a lista fora de ordem', () => {
    const mes = [
      registro(LANCHE, '2026-09-10T19:00:00Z', [alimento('iogurte', 300)]),
      registro(CAFE, '2026-09-10T10:00:00Z', [alimento('pão', 300)]),
    ];
    const rel = montarRelatorioMes(mes, [], [JANTA, LANCHE, CEIA, CAFE, ALMOCO], TZ);
    expect(rel.por_refeicao.map((r) => r.refeicao_id)).toEqual(['cafe', 'lanche']);
  });

  it('dias em ordem desc, refeições por início e descrição com os nomes dos alimentos', () => {
    const mes = [
      registro(JANTA, '2026-09-13T22:00:00Z', [alimento('pizza', 900)]),
      registro(ALMOCO, '2026-09-13T15:00:00Z', [alimento('arroz', 200), alimento('feijão', 128)]),
      registro(ALMOCO, '2026-09-13T16:00:00Z', [alimento('frango', 284)]),
      registro(CAFE, '2026-09-14T11:00:00Z', [alimento('pão na chapa', 418)]),
    ];
    const { dias } = montarRelatorioMes(mes, [], REFEICOES, TZ);
    expect(dias).toEqual([
      {
        data: '2026-09-14',
        calorias: 418,
        refeicoes: [{ refeicao_id: 'cafe', refeicao_nome: 'Café da manhã', calorias: 418, descricao: 'pão na chapa' }],
      },
      {
        data: '2026-09-13',
        calorias: 1512,
        refeicoes: [
          { refeicao_id: 'almoco', refeicao_nome: 'Almoço', calorias: 612, descricao: 'arroz, feijão, frango' },
          { refeicao_id: 'janta', refeicao_nome: 'Janta', calorias: 900, descricao: 'pizza' },
        ],
      },
    ]);
  });

  it('agrupa pelo dia local: 23:30 em SP no dia 30 é 02:30Z do dia 1º', () => {
    const mes = [registro(CEIA, '2026-10-01T02:30:00Z', [alimento('torrada', 150)])];
    const { dias } = montarRelatorioMes(mes, [], REFEICOES, TZ);
    expect(dias.map((d) => d.data)).toEqual(['2026-09-30']);
  });

  it('ceia depois da meia-noite conta no dia local em que foi comida', () => {
    const mes = [
      registro(JANTA, '2026-09-10T22:00:00Z', [alimento('sopa', 400)]),
      registro(CEIA, '2026-09-11T04:00:00Z', [alimento('leite', 120)]), // 01:00 do dia 11 em SP
    ];
    const { dias, media_calorias } = montarRelatorioMes(mes, [], REFEICOES, TZ);
    expect(dias.map((d) => d.data)).toEqual(['2026-09-11', '2026-09-10']);
    expect(media_calorias).toBe(260);
  });
});
