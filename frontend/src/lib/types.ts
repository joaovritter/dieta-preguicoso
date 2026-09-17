// Tipos copiados de docs/api-contract.md — fonte da verdade.

export interface Refeicao {
  id: string;
  nome: string;
  inicio: string;
  fim: string;
}
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

export interface Perfil {
  id: string;
  email: string;
  nome: string;
  tag: string;
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
  timezone: string;
  criado_em: string;
}

export interface Registro {
  id: string;
  tipo_entrada: TipoEntrada;
  refeicao_id: string;
  refeicao_nome: string;
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
  refeicoes: Array<{ refeicao_id: string; refeicao_nome: string; calorias: number; quantidade_registros: number }>;
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
  refeicao_id: string;
  refeicao_nome: string;
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
  /** Nunca editado na tela — sincronizado automaticamente com o fuso do aparelho. */
  timezone?: string;
}

export interface EntradaConfirmacao {
  tipo_entrada: TipoEntrada;
  descricao_bruta: string;
  midia_url?: string | null;
  refeicao_id?: string;
  alimentos: Alimento[];
  criado_em?: string;
}

/* ---- rede social ---- */

export interface PerfilPublico {
  id: string;
  nome: string;
  tag: string;
  /** "joao#0427" */
  nome_tag: string;
  objetivo: Objetivo;
}

/** Como o dia fechou em relação à meta de calorias. `na_meta` = entre 90% e 110%. */
export type StatusDia = 'sem_registro' | 'abaixo' | 'na_meta' | 'acima';

export interface ProgressoDia {
  data: string;
  calorias: number;
  meta_calorias: number;
  percentual: number;
  status: StatusDia;
  quantidade_registros: number;
}

/** Uma refeição de alguém, do jeito que aparece no feed. */
export interface Post {
  id: string;
  autor: PerfilPublico;
  refeicao_id: string;
  refeicao_nome: string;
  descricao_bruta: string;
  midia_url: string | null;
  alimentos_detectados: Alimento[];
  calorias_total: number;
  carboidrato_total_g: number;
  proteina_total_g: number;
  gordura_total_g: number;
  criado_em: string;
}

export interface Feed {
  posts: Post[];
  /** `criado_em` do último post; passe em `?antes=` para a próxima página. `null` = acabou. */
  proximo_antes: string | null;
}

export interface MembroComProgresso {
  perfil: PerfilPublico;
  progresso_hoje: ProgressoDia;
}

export interface Grupo {
  id: string;
  nome: string;
  codigo_convite: string;
  quantidade_membros: number;
  sou_criador: boolean;
  criado_em: string;
}

export interface PedidoAmizade {
  id: string;
  perfil: PerfilPublico;
  criado_em: string;
}

export interface PedidosAmizade {
  recebidos: PedidoAmizade[];
  enviados: PedidoAmizade[];
}

export interface DetalheGrupo {
  grupo: Grupo;
  membros: MembroComProgresso[];
}

export interface CalendarioMes {
  mes: string;
  dias: ProgressoDia[];
}

/* ---- relatório mensal ---- */

export interface RelatorioRefeicao {
  refeicao_id: string;
  refeicao_nome: string;
  media_calorias: number;
  /** vs mês anterior, 1 casa; `null` quando o mês anterior não tinha essa refeição. */
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

export interface RelatorioMes {
  mes: string;
  media_calorias: number;
  por_refeicao: RelatorioRefeicao[];
  dias: RelatorioDia[];
}
