import { describe, expect, it } from 'vitest';
import { interpretacaoDeSalva, refeicaoDoHorario } from './salva';
import type { Alimento, Refeicao } from '../lib/types';

const refeicoes: Refeicao[] = [
  { id: 'cafe', nome: 'café', inicio: '05:00', fim: '10:59' },
  { id: 'almoco', nome: 'almoço', inicio: '11:00', fim: '15:59' },
  { id: 'ceia', nome: 'ceia', inicio: '22:00', fim: '04:59' },
];

const em = (hora: number, minuto = 0) => new Date(2026, 8, 16, hora, minuto);

const pao: Alimento = { nome: 'pão', quantidade_estimada: '55g', calorias: 150, carboidrato_g: 30, proteina_g: 5, gordura_g: 1 };
const queijo: Alimento = { nome: 'queijo', quantidade_estimada: '35g', calorias: 120, carboidrato_g: 1, proteina_g: 8, gordura_g: 9 };

describe('refeicaoDoHorario', () => {
  it('acha a faixa que contém a hora', () => {
    expect(refeicaoDoHorario(refeicoes, em(8))?.id).toBe('cafe');
    expect(refeicaoDoHorario(refeicoes, em(11))?.id).toBe('almoco');
  });
  it('faixa que cruza a meia-noite vale dos dois lados', () => {
    expect(refeicaoDoHorario(refeicoes, em(23))?.id).toBe('ceia');
    expect(refeicaoDoHorario(refeicoes, em(2))?.id).toBe('ceia');
  });
  it('com buraco entre faixas, usa a que começou mais perto antes', () => {
    expect(refeicaoDoHorario(refeicoes, em(18))?.id).toBe('almoco');
  });
  it('sem refeições, devolve nada', () => {
    expect(refeicaoDoHorario([], em(8))).toBeUndefined();
  });
});

describe('interpretacaoDeSalva', () => {
  it('soma os totais e descreve só os alimentos', () => {
    const r = interpretacaoDeSalva([pao, queijo], refeicoes, em(8));
    expect(r?.refeicao_sugerida.id).toBe('cafe');
    expect(r?.totais.calorias).toBe(270);
    expect(r?.descricao_bruta).toBe('55g de pão, 35g de queijo');
    expect(r?.midia_url).toBeNull();
  });
  it('sem alimentos ou sem refeições, devolve null', () => {
    expect(interpretacaoDeSalva([], refeicoes, em(8))).toBeNull();
    expect(interpretacaoDeSalva([pao], [], em(8))).toBeNull();
  });
});
