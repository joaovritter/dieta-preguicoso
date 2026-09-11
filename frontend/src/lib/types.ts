// Tipos copiados de docs/api-contract.md — fonte da verdade.

export type Refeicao = 'cafe_da_manha' | 'almoco' | 'lanche' | 'janta' | 'ceia';
export type TipoEntrada = 'foto' | 'audio' | 'texto';
export type Objetivo = 'perder_peso' | 'manter' | 'ganhar_massa';
export type Sexo = 'M' | 'F';

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
  inicio: string;
  fim: string;
}

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

/** Resultado de uma interpretação da IA, ainda não gravada. */
export interface Interpretacao {
  tipo_entrada: TipoEntrada;
  descricao_bruta: string;
  midia_url: string | null;
  refeicao_sugerida: Refeicao;
  alimentos: Alimento[];
  totais: Totais;
  /** Presente só quando o perfil tem modo_preguicoso=true: o registro já foi gravado. */
  registro?: Registro;
}

export interface Autenticacao {
  token: string;
  perfil: Perfil;
}

export interface Metrica {
  consumido: number;
  meta: number;
  percentual: number;
  restante: number;
  excedido: number;
}

export interface ResumoDia {
  data: string;
  calorias: Metrica;
  carboidrato_g: Metrica;
  proteina_g: Metrica;
  gordura_g: Metrica;
  agua_ml: Metrica;
  refeicoes: Array<{ refeicao: Refeicao; calorias: number; quantidade_registros: number }>;
}

export interface DiaSemana {
  data: string;
  calorias: number;
  meta_calorias: number;
  percentual: number;
  tem_registro: boolean;
}

export interface ResumoSemana {
  dias: DiaSemana[];
}

export interface GrupoRefeicao {
  refeicao: Refeicao;
  calorias: number;
  registros: Registro[];
}

export interface RegistrosDoDia {
  data: string;
  refeicoes: GrupoRefeicao[];
}

export interface RegistroAgua {
  id: string;
  quantidade_ml: number;
  criado_em: string;
}

export interface EntradaPerfil {
  nome?: string;
  sexo?: Sexo | null;
  idade?: number | null;
  peso_kg?: number | null;
  altura_cm?: number | null;
  objetivo?: Objetivo;
  meta_calorias?: number;
  meta_carboidrato_g?: number;
  meta_proteina_g?: number;
  meta_gordura_g?: number;
  meta_agua_ml?: number;
  metas_automaticas?: boolean;
  modo_preguicoso?: boolean;
  faixas_refeicao?: FaixaRefeicao[];
  timezone?: string;
}

export interface EntradaConfirmacao {
  tipo_entrada: TipoEntrada;
  descricao_bruta: string;
  midia_url?: string | null;
  refeicao?: Refeicao;
  alimentos: Alimento[];
  criado_em?: string;
}
