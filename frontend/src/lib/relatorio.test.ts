import { describe, expect, it } from 'vitest';
import {
  barrasDoDia,
  barrasDoMes,
  deslocarDia,
  descricaoDoGrupo,
  diaCurto,
  diasFiltrados,
  kcal,
  linhasDeVariacao,
  opcoesDeFiltro,
  podeAvancarDia,
  podeAvancarMes,
  preposicao,
  proximoFiltro,
  statusDoDia,
  visaoDosParametros,
} from './relatorio';
import type { GrupoRefeicao, Registro, RelatorioMes, RelatorioRefeicao } from './types';

function refeicao(id: string, nome: string, media: number, variacao: number | null): RelatorioRefeicao {
  return { refeicao_id: id, refeicao_nome: nome, media_calorias: media, variacao_percentual: variacao };
}

const RELATORIO: RelatorioMes = {
  mes: '2026-09',
  media_calorias: 1890,
  por_refeicao: [refeicao('almoco', 'Almoço', 712, 3), refeicao('janta', 'Janta', 534, 21.4)],
  dias: [
    {
      data: '2026-09-14',
      calorias: 1030,
      refeicoes: [
        { refeicao_id: 'almoco', refeicao_nome: 'Almoço', calorias: 612, descricao: 'arroz, feijão' },
        { refeicao_id: 'lanche', refeicao_nome: 'Lanche', calorias: 0, descricao: 'chá' },
        { refeicao_id: 'janta', refeicao_nome: 'Janta', calorias: 418, descricao: 'sopa' },
      ],
    },
    {
      data: '2026-09-13',
      calorias: 900,
      refeicoes: [{ refeicao_id: 'janta', refeicao_nome: 'Janta', calorias: 900, descricao: 'pizza' }],
    },
  ],
};

describe('preposicao', () => {
  it('usa "na" para nomes terminados em a e "no" nos demais', () => {
    expect(preposicao('janta')).toBe('na');
    expect(preposicao('Ceia')).toBe('na');
    expect(preposicao('lanche')).toBe('no');
    expect(preposicao('almoço')).toBe('no');
    expect(preposicao('café da manhã')).toBe('no');
  });
});

describe('linhasDeVariacao', () => {
  it('pega as 2 maiores variações absolutas, ignorando null e 0%', () => {
    const linhas = linhasDeVariacao(
      [
        refeicao('almoco', 'Almoço', 712, 3),
        refeicao('janta', 'Janta', 534, 21.4),
        refeicao('cafe', 'Café da manhã', 398, null),
        refeicao('lanche', 'Lanche', 246, -8.2),
        refeicao('ceia', 'Ceia', 100, 0.3),
      ],
      'agosto',
    );
    expect(linhas).toEqual([
      { sentido: 'mais', texto: '↑ 21% mais na janta que em agosto' },
      { sentido: 'menos', texto: '↓ 8% menos no lanche que em agosto' },
    ]);
  });

  it('devolve lista vazia sem comparação possível', () => {
    expect(linhasDeVariacao([refeicao('almoco', 'Almoço', 712, null)], 'agosto')).toEqual([]);
  });
});

describe('filtro', () => {
  it('opções: todas + refeições dos dias, na ordem de por_refeicao e depois as demais', () => {
    expect(opcoesDeFiltro(RELATORIO)).toEqual([
      { id: null, rotulo: 'todas as refeições' },
      { id: 'almoco', rotulo: 'só almoço' },
      { id: 'janta', rotulo: 'só janta' },
      { id: 'lanche', rotulo: 'só lanche' },
    ]);
  });

  it('proximoFiltro cicla e volta para todas', () => {
    const opcoes = opcoesDeFiltro(RELATORIO);
    expect(proximoFiltro(opcoes, null)).toBe('almoco');
    expect(proximoFiltro(opcoes, 'janta')).toBe('lanche');
    expect(proximoFiltro(opcoes, 'lanche')).toBeNull();
    expect(proximoFiltro(opcoes, 'sumiu')).toBeNull();
  });

  it('diasFiltrados mantém só a refeição escolhida, recalcula o total e tira dias vazios', () => {
    expect(diasFiltrados(RELATORIO.dias, null)).toBe(RELATORIO.dias);
    expect(diasFiltrados(RELATORIO.dias, 'almoco')).toEqual([
      {
        data: '2026-09-14',
        calorias: 612,
        refeicoes: [{ refeicao_id: 'almoco', refeicao_nome: 'Almoço', calorias: 612, descricao: 'arroz, feijão' }],
      },
    ]);
  });
});

describe('formatação', () => {
  it('kcal arredonda e separa milhar com espaço não separável', () => {
    expect(kcal(1890.4)).toBe('1 890');
    expect(kcal(712)).toBe('712');
    expect(kcal(12041)).toBe('12 041');
  });

  it('diaCurto usa dia e mês abreviado em maiúsculas', () => {
    expect(diaCurto('2026-09-13')).toBe('13 SET');
    expect(diaCurto('2026-01-02')).toBe('2 JAN');
  });
});

describe('visaoDosParametros', () => {
  const HOJE = '2026-09-16';
  const p = (query: string) => new URLSearchParams(query);

  it('sem parâmetro abre o mês atual', () => {
    expect(visaoDosParametros(p(''), HOJE)).toEqual({ tipo: 'mes', mes: '2026-09' });
  });

  it('data válida abre a visão do dia e ganha de mes', () => {
    expect(visaoDosParametros(p('data=2026-09-13'), HOJE)).toEqual({ tipo: 'dia', data: '2026-09-13' });
    expect(visaoDosParametros(p('data=2026-08-02&mes=2026-01'), HOJE)).toEqual({ tipo: 'dia', data: '2026-08-02' });
    expect(visaoDosParametros(p('data=2026-09-16'), HOJE)).toEqual({ tipo: 'dia', data: '2026-09-16' });
  });

  it('data inválida, inexistente ou futura cai no mês atual', () => {
    expect(visaoDosParametros(p('data=ontem'), HOJE)).toEqual({ tipo: 'mes', mes: '2026-09' });
    expect(visaoDosParametros(p('data=2026-02-30'), HOJE)).toEqual({ tipo: 'mes', mes: '2026-09' });
    expect(visaoDosParametros(p('data=2026-09-17'), HOJE)).toEqual({ tipo: 'mes', mes: '2026-09' });
  });

  it('mes válido é respeitado; futuro ou inválido vira o atual', () => {
    expect(visaoDosParametros(p('mes=2026-03'), HOJE)).toEqual({ tipo: 'mes', mes: '2026-03' });
    expect(visaoDosParametros(p('mes=2025-12'), HOJE)).toEqual({ tipo: 'mes', mes: '2025-12' });
    expect(visaoDosParametros(p('mes=2026-10'), HOJE)).toEqual({ tipo: 'mes', mes: '2026-09' });
    expect(visaoDosParametros(p('mes=2026-13'), HOJE)).toEqual({ tipo: 'mes', mes: '2026-09' });
  });
});

describe('navegação', () => {
  it('deslocarDia atravessa mês, ano e fevereiro bissexto', () => {
    expect(deslocarDia('2026-09-01', -1)).toBe('2026-08-31');
    expect(deslocarDia('2025-12-31', 1)).toBe('2026-01-01');
    expect(deslocarDia('2024-02-28', 1)).toBe('2024-02-29');
    expect(deslocarDia('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('só avança até o mês/dia de hoje', () => {
    const HOJE = '2026-09-16';
    expect(podeAvancarMes('2026-08', HOJE)).toBe(true);
    expect(podeAvancarMes('2026-09', HOJE)).toBe(false);
    expect(podeAvancarDia('2026-09-15', HOJE)).toBe(true);
    expect(podeAvancarDia('2026-09-16', HOJE)).toBe(false);
  });
});

describe('statusDoDia (mesma regra do backend)', () => {
  it('sem registro ou sem meta é sem_registro', () => {
    expect(statusDoDia(1000, 2000, 0)).toBe('sem_registro');
    expect(statusDoDia(1000, 0, 3)).toBe('sem_registro');
  });

  it('90% a 110% (arredondado a 1 casa) é na_meta', () => {
    expect(statusDoDia(1790, 2000, 2)).toBe('abaixo'); // 89,5%
    expect(statusDoDia(1800, 2000, 2)).toBe('na_meta'); // 90%
    expect(statusDoDia(2200, 2000, 2)).toBe('na_meta'); // 110%
    expect(statusDoDia(2210, 2000, 2)).toBe('acima'); // 110,5%
  });
});

describe('barras e descrição', () => {
  it('barrasDoMes usa a média de cada refeição', () => {
    expect(barrasDoMes(RELATORIO.por_refeicao)).toEqual([
      { refeicao_id: 'almoco', refeicao_nome: 'Almoço', calorias: 712 },
      { refeicao_id: 'janta', refeicao_nome: 'Janta', calorias: 534 },
    ]);
  });

  it('barrasDoDia tira refeições zeradas e mantém a ordem', () => {
    expect(
      barrasDoDia([
        { refeicao_id: 'cafe', refeicao_nome: 'Café da manhã', calorias: 418, quantidade_registros: 1 },
        { refeicao_id: 'almoco', refeicao_nome: 'Almoço', calorias: 0, quantidade_registros: 0 },
        { refeicao_id: 'janta', refeicao_nome: 'Janta', calorias: 612, quantidade_registros: 2 },
      ]),
    ).toEqual([
      { refeicao_id: 'cafe', refeicao_nome: 'Café da manhã', calorias: 418 },
      { refeicao_id: 'janta', refeicao_nome: 'Janta', calorias: 612 },
    ]);
  });

  it('descricaoDoGrupo junta os alimentos de todos os registros', () => {
    const alimento = (nome: string) => ({
      nome,
      quantidade_estimada: '1',
      calorias: 1,
      carboidrato_g: 0,
      proteina_g: 0,
      gordura_g: 0,
    });
    const registro = (nomes: string[]) => ({ alimentos_detectados: nomes.map(alimento) }) as unknown as Registro;
    const grupo: GrupoRefeicao = {
      refeicao_id: 'almoco',
      refeicao_nome: 'Almoço',
      calorias: 612,
      registros: [registro(['arroz', 'feijão']), registro(['frango'])],
    };
    expect(descricaoDoGrupo(grupo)).toBe('arroz, feijão, frango');
    expect(descricaoDoGrupo({ ...grupo, registros: [] })).toBe('');
  });
});
