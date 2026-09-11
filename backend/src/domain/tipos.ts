export const REFEICOES = [
  'cafe_da_manha',
  'almoco',
  'lanche',
  'janta',
  'ceia',
] as const;
export type Refeicao = (typeof REFEICOES)[number];

export const TIPOS_ENTRADA = ['foto', 'audio', 'texto'] as const;
export type TipoEntrada = (typeof TIPOS_ENTRADA)[number];

export const OBJETIVOS = ['perder_peso', 'manter', 'ganhar_massa'] as const;
export type Objetivo = (typeof OBJETIVOS)[number];

export const SEXOS = ['M', 'F'] as const;
export type Sexo = (typeof SEXOS)[number];

export interface Alimento {
  nome: string;
  quantidade_estimada: string;
  calorias: number;
  carboidrato_g: number;
  proteina_g: number;
  gordura_g: number;
}

export interface FaixaRefeicao {
  refeicao: Refeicao;
  /** "HH:MM" */
  inicio: string;
  /** "HH:MM" — pode ser menor que `inicio`, indicando que a faixa cruza a meia-noite. */
  fim: string;
}

export const FAIXAS_PADRAO: FaixaRefeicao[] = [
  { refeicao: 'cafe_da_manha', inicio: '05:00', fim: '10:00' },
  { refeicao: 'almoco', inicio: '10:01', fim: '15:00' },
  { refeicao: 'lanche', inicio: '15:01', fim: '18:00' },
  { refeicao: 'janta', inicio: '18:01', fim: '22:00' },
  { refeicao: 'ceia', inicio: '22:01', fim: '04:59' },
];

export interface Perfil {
  id: string;
  email: string;
  nome: string;
  sexo: Sexo | null;
  idade: number | null;
  peso_kg: number | null;
  altura_cm: number | null;
  objetivo: Objetivo;
  meta_calorias: number;
  meta_carboidrato_g: number;
  meta_proteina_g: number;
  meta_gordura_g: number;
  meta_agua_ml: number;
  metas_automaticas: boolean;
  modo_preguicoso: boolean;
  faixas_refeicao: FaixaRefeicao[];
  timezone: string;
  criado_em: string;
}

export interface Registro {
  id: string;
  tipo_entrada: TipoEntrada;
  refeicao: Refeicao;
  descricao_bruta: string;
  midia_url: string | null;
  alimentos_detectados: Alimento[];
  calorias_total: number;
  carboidrato_total_g: number;
  proteina_total_g: number;
  gordura_total_g: number;
  criado_em: string;
}

export interface Totais {
  calorias: number;
  carboidrato_g: number;
  proteina_g: number;
  gordura_g: number;
}

export interface Interpretacao {
  tipo_entrada: TipoEntrada;
  descricao_bruta: string;
  midia_url: string | null;
  refeicao_sugerida: Refeicao;
  alimentos: Alimento[];
  totais: Totais;
  registro?: Registro;
}

export interface Metrica {
  consumido: number;
  meta: number;
  percentual: number;
  restante: number;
  excedido: number;
}
