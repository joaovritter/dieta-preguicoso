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

export interface Refeicao {
  id: string;
  nome: string;
  /** "HH:MM" */
  inicio: string;
  /** "HH:MM" — pode ser menor que `inicio`, indicando que a faixa cruza a meia-noite. */
  fim: string;
}

export interface Janela {
  inicio: string;
  fim: string;
}

/** Semente de conta nova. A migration 003 tem a mesma lista em SQL. */
export const REFEICOES_INICIAIS: Array<{ nome: string; inicio: string; fim: string }> = [
  { nome: 'Café da manhã', inicio: '05:00', fim: '10:00' },
  { nome: 'Almoço', inicio: '10:01', fim: '15:00' },
  { nome: 'Lanche', inicio: '15:01', fim: '18:00' },
  { nome: 'Janta', inicio: '18:01', fim: '22:00' },
  { nome: 'Ceia', inicio: '22:01', fim: '04:59' },
];

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
  foto_url: string | null;
  esconder_comentarios_perfil: boolean;
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

/** Identidade pública de alguém na rede social: `nome#tag`. */
export interface PerfilPublico {
  id: string;
  nome: string;
  tag: string;
  nome_tag: string;
  objetivo: Objetivo;
  foto_url: string | null;
  total_posts: number;
  total_amigos: number;
}

export const STATUS_DIA = ['sem_registro', 'abaixo', 'na_meta', 'acima'] as const;
export type StatusDia = (typeof STATUS_DIA)[number];

export interface ProgressoDia {
  data: string;
  calorias: number;
  meta_calorias: number;
  percentual: number;
  status: StatusDia;
  quantidade_registros: number;
}

export interface MembroComProgresso {
  perfil: PerfilPublico;
  progresso_hoje: ProgressoDia;
}

/** Uma refeição de alguém, do jeito que aparece no feed. */
export interface Post extends Registro {
  autor: PerfilPublico;
  curtidas: number;
  curti: boolean;
  salvo: boolean;
  comentarios: number;
}

/** Cópia privada de uma refeição (própria ou de um post visível), guardada na aba "Salvos" do perfil. */
export interface RefeicaoSalva {
  id: string;
  nome: string;
  alimentos: Alimento[];
  calorias_total: number;
  carboidrato_total_g: number;
  proteina_total_g: number;
  gordura_total_g: number;
  origem_registro_id: string | null;
  origem_autor_id: string | null;
  origem_autor_nome: string | null;
  criado_em: string;
}

export interface Feed {
  posts: Post[];
  proximo_antes: string | null;
}

export interface Comentario {
  id: string;
  autor: PerfilPublico;
  texto: string;
  criado_em: string;
  posso_apagar: boolean;
}

/** Um comentário feito pelo próprio usuário, com o mínimo do post pra linkar de volta. */
export interface ComentarioComPost {
  id: string;
  texto: string;
  criado_em: string;
  post: {
    id: string;
    autor: PerfilPublico;
    descricao_bruta: string;
  };
}

export interface FeedComentarios {
  comentarios: ComentarioComPost[];
  proximo_antes: string | null;
}

export interface Grupo {
  id: string;
  nome: string;
  codigo_convite: string;
  quantidade_membros: number;
  sou_criador: boolean;
  criado_em: string;
  minha_posicao_semana: number | null;
}
