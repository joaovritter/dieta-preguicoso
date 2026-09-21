import { describe, expect, it } from 'vitest';
import {
  alternarCurtida,
  corDoAvatar,
  corDoPonto,
  definirSalvo,
  filtrarAmigos,
  inicial,
  membros,
  tempoRelativo,
  textoDoDia,
  textoRanking,
} from './social';
import type { Post, ProgressoDia, StatusDia } from './types';

const agora = new Date('2026-09-16T12:00:00');

function progresso(percentual: number, status: StatusDia): ProgressoDia {
  return { data: '2026-09-16', calorias: 0, meta_calorias: 2000, percentual, status, quantidade_registros: 1 };
}

describe('tempoRelativo', () => {
  it('menos de 1 minuto é "agora"', () => {
    expect(tempoRelativo('2026-09-16T11:59:30', agora)).toBe('agora');
  });
  it('minutos e horas', () => {
    expect(tempoRelativo('2026-09-16T11:40:00', agora)).toBe('há 20 min');
    expect(tempoRelativo('2026-09-16T09:00:00', agora)).toBe('há 3 h');
  });
  it('ontem e dias', () => {
    expect(tempoRelativo('2026-09-15T08:00:00', agora)).toBe('ontem');
    expect(tempoRelativo('2026-09-12T08:00:00', agora)).toBe('há 4 dias');
  });
  it('mais de uma semana vira data curta', () => {
    expect(tempoRelativo('2026-09-01T08:00:00', agora)).toBe('1 set');
  });
});

describe('textoDoDia', () => {
  it('segue o design', () => {
    expect(textoDoDia(progresso(100, 'na_meta'))).toBe('bateu a meta hoje');
    expect(textoDoDia(progresso(121, 'acima'))).toBe('21% acima da meta');
    expect(textoDoDia(progresso(68, 'abaixo'))).toBe('32% abaixo da meta');
    expect(textoDoDia(progresso(0, 'sem_registro'))).toBe('sem registro hoje');
  });
});

describe('corDoPonto', () => {
  it('acima é âmbar como no design, sem registro é neutro', () => {
    expect(corDoPonto('na_meta')).toBe('status.meta');
    expect(corDoPonto('abaixo')).toBe('status.sobrou');
    expect(corDoPonto('acima')).toBe('macro.gordura');
    expect(corDoPonto('sem_registro')).toBe('neutro.borda');
  });
});

describe('avatar', () => {
  it('inicial maiúscula, sem espaço', () => {
    expect(inicial('  marina alves')).toBe('M');
    expect(inicial('')).toBe('?');
  });
  it('cor estável para o mesmo nome', () => {
    expect(corDoAvatar('rafael')).toBe(corDoAvatar('rafael'));
    expect(['status.sobrou', 'macro.proteina', 'macro.gordura', 'status.meta', 'text.secondary']).toContain(
      corDoAvatar('bia'),
    );
  });
});

describe('alternarCurtida', () => {
  const base = { id: 'p', curtidas: 8, curti: false, comentarios: 2 } as Post;
  it('curte e descurte ajustando a contagem', () => {
    const curtido = alternarCurtida(base);
    expect(curtido).toMatchObject({ curti: true, curtidas: 9 });
    expect(alternarCurtida(curtido)).toMatchObject({ curti: false, curtidas: 8 });
  });
  it('não deixa a contagem negativa', () => {
    expect(alternarCurtida({ ...base, curti: true, curtidas: 0 }).curtidas).toBe(0);
  });
});

describe('definirSalvo', () => {
  it('marca e desmarca sem mexer no resto', () => {
    const base = { id: 'p', curtidas: 8, salvo: false } as Post;
    expect(definirSalvo(base, true)).toMatchObject({ id: 'p', curtidas: 8, salvo: true });
    expect(definirSalvo({ ...base, salvo: true }, false).salvo).toBe(false);
  });
});

describe('filtrarAmigos', () => {
  const lista = [
    { perfil: { nome: 'Marina Alves', tag: '1234' } },
    { perfil: { nome: 'João Silva', tag: '9876' } },
    { perfil: { nome: 'Rafael', tag: '4321' } },
  ];
  const nomes = (l: typeof lista) => l.map((a) => a.perfil.nome);

  it('consulta vazia ou só espaços devolve a lista inteira', () => {
    expect(filtrarAmigos('', lista)).toEqual(lista);
    expect(filtrarAmigos('   ', lista)).toEqual(lista);
  });
  it('casa parte do nome', () => {
    expect(nomes(filtrarAmigos('mar', lista))).toEqual(['Marina Alves']);
  });
  it('casa pela tag e por nome#tag', () => {
    expect(nomes(filtrarAmigos('9876', lista))).toEqual(['João Silva']);
    expect(nomes(filtrarAmigos('rafael#43', lista))).toEqual(['Rafael']);
  });
  it('sem correspondência devolve lista vazia', () => {
    expect(filtrarAmigos('zzz', lista)).toEqual([]);
  });
  it('acento e maiúscula não importam', () => {
    expect(nomes(filtrarAmigos('JOAO', lista))).toEqual(['João Silva']);
    expect(nomes(filtrarAmigos('joão', lista))).toEqual(['João Silva']);
  });
});

describe('textoRanking e membros', () => {
  it('ranking', () => {
    expect(textoRanking(3)).toBe('você é #3 esta semana');
    expect(textoRanking(null)).toBeNull();
  });
  it('plural', () => {
    expect(membros(1)).toBe('1 membro');
    expect(membros(12)).toBe('12 membros');
  });
});
