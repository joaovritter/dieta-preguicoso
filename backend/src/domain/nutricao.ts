import type { Alimento, Metrica, Objetivo, Sexo, Totais } from './tipos.js';

/** Arredonda a 1 casa decimal, evitando lixo binário tipo 12.300000000000001. */
export function arredondar(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Calorias derivadas dos macros: 4 kcal/g de carboidrato e proteína, 9 kcal/g de gordura. */
export function calorasDeMacros(
  carboidrato_g: number,
  proteina_g: number,
  gordura_g: number,
): number {
  return arredondar(4 * carboidrato_g + 4 * proteina_g + 9 * gordura_g);
}

export function somarTotais(alimentos: Alimento[]): Totais {
  const t = alimentos.reduce<Totais>(
    (acc, a) => ({
      calorias: acc.calorias + a.calorias,
      carboidrato_g: acc.carboidrato_g + a.carboidrato_g,
      proteina_g: acc.proteina_g + a.proteina_g,
      gordura_g: acc.gordura_g + a.gordura_g,
    }),
    { calorias: 0, carboidrato_g: 0, proteina_g: 0, gordura_g: 0 },
  );
  return {
    calorias: arredondar(t.calorias),
    carboidrato_g: arredondar(t.carboidrato_g),
    proteina_g: arredondar(t.proteina_g),
    gordura_g: arredondar(t.gordura_g),
  };
}

/**
 * Métrica de um macro no dia. Guarda `restante` e `excedido` separados de propósito:
 * o resumo tem que ser honesto sobre o estouro, não zerar e fingir que está tudo bem.
 */
export function metrica(consumido: number, meta: number): Metrica {
  const c = arredondar(consumido);
  const m = arredondar(meta);
  return {
    consumido: c,
    meta: m,
    percentual: m > 0 ? arredondar((c / m) * 100) : 0,
    restante: arredondar(Math.max(m - c, 0)),
    excedido: arredondar(Math.max(c - m, 0)),
  };
}

export interface DadosCorporais {
  sexo: Sexo | null;
  idade: number | null;
  peso_kg: number | null;
  altura_cm: number | null;
  objetivo: Objetivo;
}

export interface MetasCalculadas {
  meta_calorias: number;
  meta_carboidrato_g: number;
  meta_proteina_g: number;
  meta_gordura_g: number;
  meta_agua_ml: number;
}

const FATOR_ATIVIDADE = 1.375; // atividade leve
const AJUSTE_OBJETIVO: Record<Objetivo, number> = {
  perder_peso: 0.8,
  manter: 1,
  ganhar_massa: 1.15,
};

/**
 * Mifflin-St Jeor. Devolve `null` quando falta algum dado corporal — o chamador
 * mantém as metas atuais em vez de zerar o perfil do usuário.
 */
export function calcularMetas(d: DadosCorporais): MetasCalculadas | null {
  const { sexo, idade, peso_kg, altura_cm, objetivo } = d;
  if (!sexo || !idade || !peso_kg || !altura_cm) return null;
  if (idade <= 0 || peso_kg <= 0 || altura_cm <= 0) return null;

  const base = 10 * peso_kg + 6.25 * altura_cm - 5 * idade;
  const tmb = sexo === 'M' ? base + 5 : base - 161;
  const calorias = tmb * FATOR_ATIVIDADE * AJUSTE_OBJETIVO[objetivo];

  const proteina = peso_kg * 2;
  const gordura = (calorias * 0.25) / 9;
  const caloriasRestantes = calorias - proteina * 4 - gordura * 9;
  const carboidrato = Math.max(caloriasRestantes / 4, 0);

  return {
    meta_calorias: Math.round(calorias),
    meta_carboidrato_g: arredondar(carboidrato),
    meta_proteina_g: arredondar(proteina),
    meta_gordura_g: arredondar(gordura),
    meta_agua_ml: Math.round(peso_kg * 35),
  };
}
