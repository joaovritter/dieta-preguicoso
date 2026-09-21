import type {
  Alimento,
  Autenticacao,
  CalendarioMes,
  Comentario,
  DetalheGrupo,
  EntradaConfirmacao,
  EntradaPerfil,
  Feed,
  FeedComentarios,
  Grupo,
  Interpretacao,
  MembroComProgresso,
  PedidoAmizade,
  PedidosAmizade,
  Perfil,
  PerfilPublico,
  Refeicao,
  RefeicaoSalva,
  Registro,
  RegistroAgua,
  RegistrosDoDia,
  RelatorioMes,
  ResumoDia,
  ResumoSemana,
} from './types';
import { encerraSessao } from './sessao';

const BASE = '/api';
const CHAVE_TOKEN = 'dieta.token';

export class ErroApi extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ErroApi';
    this.code = code;
    this.status = status;
  }
}

export function lerToken(): string | null {
  return localStorage.getItem(CHAVE_TOKEN);
}

export function gravarToken(token: string | null): void {
  if (token === null) localStorage.removeItem(CHAVE_TOKEN);
  else localStorage.setItem(CHAVE_TOKEN, token);
}

let aoDeslogar: () => void = () => {};

/** A AuthContext registra aqui o logout, para qualquer 401 derrubar a sessão. */
export function registrarLogout(fn: () => void): void {
  aoDeslogar = fn;
}

let motivoSaida: string | null = null;

/** Guarda por que a sessão acabou, para o login mostrar uma vez. */
export function definirMotivoSaida(mensagem: string): void {
  motivoSaida = mensagem;
}

export function consumirMotivoSaida(): string | null {
  const motivo = motivoSaida;
  motivoSaida = null;
  return motivo;
}

function extrairErro(corpo: unknown, status: number): ErroApi {
  if (typeof corpo === 'object' && corpo !== null && 'error' in corpo) {
    const erro = (corpo as { error: unknown }).error;
    if (typeof erro === 'object' && erro !== null) {
      const { code, message } = erro as { code?: unknown; message?: unknown };
      return new ErroApi(
        typeof code === 'string' ? code : 'ERRO_INTERNO',
        typeof message === 'string' ? message : 'algo deu errado',
        status,
      );
    }
  }
  return new ErroApi('ERRO_INTERNO', `falha na requisição (${status})`, status);
}

interface Opcoes {
  method?: string;
  corpo?: unknown;
  formData?: FormData;
  semAuth?: boolean;
}

async function requisitar<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = lerToken();
  if (token !== null && opcoes.semAuth !== true) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (opcoes.formData !== undefined) {
    body = opcoes.formData; // deixa o browser montar o boundary do multipart
  } else if (opcoes.corpo !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opcoes.corpo);
  }

  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}${caminho}`, { method: opcoes.method ?? 'GET', headers, body });
  } catch {
    throw new ErroApi('REDE_INDISPONIVEL', 'não consegui falar com o servidor', 0);
  }

  if (resposta.status === 204) return undefined as T;

  const texto = await resposta.text();
  let corpo: unknown = null;
  if (texto.length > 0) {
    try {
      corpo = JSON.parse(texto);
    } catch {
      corpo = null;
    }
  }

  if (!resposta.ok) {
    const erro = extrairErro(corpo, resposta.status);
    if (encerraSessao(resposta.status, erro.code, opcoes.semAuth === true)) {
      if (erro.code === 'CONTA_DESATIVADA') definirMotivoSaida(erro.message);
      aoDeslogar();
    }
    throw erro;
  }

  return corpo as T;
}

function arquivoForm(arquivo: Blob, nome: string, criado_em?: string): FormData {
  const form = new FormData();
  form.append('arquivo', arquivo, nome);
  if (criado_em !== undefined) form.append('criado_em', criado_em);
  return form;
}

export const api = {
  registrar: (email: string, senha: string, nome: string) =>
    requisitar<Autenticacao>('/auth/register', {
      method: 'POST',
      corpo: { email, senha, nome },
      semAuth: true,
    }),

  entrar: (email: string, senha: string) =>
    requisitar<Autenticacao>('/auth/login', { method: 'POST', corpo: { email, senha }, semAuth: true }),

  perfil: () => requisitar<Perfil>('/me'),

  salvarPerfil: (dados: EntradaPerfil) => requisitar<Perfil>('/me', { method: 'PUT', corpo: dados }),

  trocarSenha: (senha_atual: string, senha_nova: string) =>
    requisitar<void>('/me/senha', { method: 'PUT', corpo: { senha_atual, senha_nova } }),

  desativarConta: (senha: string) =>
    requisitar<void>('/me/desativar', { method: 'POST', corpo: { senha } }),

  enviarFotoPerfil: (arquivo: File) =>
    requisitar<Perfil>('/me/foto', { method: 'POST', formData: arquivoForm(arquivo, arquivo.name) }),

  removerFotoPerfil: () => requisitar<Perfil>('/me/foto', { method: 'DELETE' }),

  meComentarios: (antes?: string) =>
    requisitar<FeedComentarios>(`/me/comentarios${antes === undefined ? '' : `?antes=${encodeURIComponent(antes)}`}`),

  salvarRefeicao: (registroId: string) =>
    requisitar<RefeicaoSalva>('/me/salvos', { method: 'POST', corpo: { registro_id: registroId } }),

  salvos: (antes?: string) =>
    requisitar<{ salvos: RefeicaoSalva[]; proximo_antes: string | null }>(
      `/me/salvos${antes === undefined ? '' : `?antes=${encodeURIComponent(antes)}`}`,
    ),

  apagarSalvo: (id: string) => requisitar<void>(`/me/salvos/${id}`, { method: 'DELETE' }),

  registroTexto: (texto: string, criado_em?: string) =>
    requisitar<Interpretacao>('/registros/texto', {
      method: 'POST',
      corpo: criado_em === undefined ? { texto } : { texto, criado_em },
    }),

  registroFoto: (arquivo: File, criado_em?: string) =>
    requisitar<Interpretacao>('/registros/foto', {
      method: 'POST',
      formData: arquivoForm(arquivo, arquivo.name, criado_em),
    }),

  registroAudio: (audio: Blob, criado_em?: string) =>
    requisitar<Interpretacao>('/registros/audio', {
      method: 'POST',
      formData: arquivoForm(audio, 'gravacao.webm', criado_em),
    }),

  confirmar: (entrada: EntradaConfirmacao) =>
    requisitar<Registro>('/registros/confirmar', { method: 'POST', corpo: entrada }),

  atualizarRegistro: (id: string, dados: { refeicao_id?: string; alimentos?: Alimento[] }) =>
    requisitar<Registro>(`/registros/${id}`, { method: 'PATCH', corpo: dados }),

  excluirRegistro: (id: string) => requisitar<void>(`/registros/${id}`, { method: 'DELETE' }),

  registrosDoDia: (data: string) =>
    requisitar<RegistrosDoDia>(`/registros/dia?data=${encodeURIComponent(data)}`),

  adicionarAgua: (quantidade_ml: number) =>
    requisitar<RegistroAgua>('/agua', { method: 'POST', corpo: { quantidade_ml } }),

  aguaDoDia: (data?: string) =>
    requisitar<RegistroAgua[]>(`/agua${data === undefined ? '' : `?data=${encodeURIComponent(data)}`}`),

  apagarAgua: (id: string) => requisitar<void>(`/agua/${id}`, { method: 'DELETE' }),

  resumoDia: (data: string) => requisitar<ResumoDia>(`/resumo/dia?data=${encodeURIComponent(data)}`),

  resumoSemana: (fim: string) => requisitar<ResumoSemana>(`/resumo/semana?fim=${encodeURIComponent(fim)}`),

  resumoMes: (mes?: string) =>
    requisitar<RelatorioMes>(`/resumo/mes${mes === undefined ? '' : `?mes=${encodeURIComponent(mes)}`}`),

  amigos: () => requisitar<{ amigos: MembroComProgresso[] }>('/amigos'),

  pedidos: () => requisitar<PedidosAmizade>('/amigos/pedidos'),

  pedirAmizade: (nome_tag: string) =>
    requisitar<PedidoAmizade>('/amigos/pedidos', { method: 'POST', corpo: { nome_tag } }),

  aceitarPedido: (id: string) =>
    requisitar<{ perfil: PerfilPublico }>(`/amigos/pedidos/${id}/aceitar`, { method: 'POST' }),

  recusarPedido: (id: string) => requisitar<void>(`/amigos/pedidos/${id}`, { method: 'DELETE' }),

  removerAmigo: (id: string) => requisitar<void>(`/amigos/${id}`, { method: 'DELETE' }),

  grupos: () => requisitar<{ grupos: Grupo[] }>('/grupos'),

  criarGrupo: (nome: string) => requisitar<Grupo>('/grupos', { method: 'POST', corpo: { nome } }),

  entrarNoGrupo: (codigo: string) =>
    requisitar<Grupo>('/grupos/entrar', { method: 'POST', corpo: { codigo } }),

  sairDoGrupo: (id: string) => requisitar<void>(`/grupos/${id}/sair`, { method: 'DELETE' }),

  grupo: (id: string) => requisitar<DetalheGrupo>(`/grupos/${id}`),

  feedDoGrupo: (id: string, antes?: string) =>
    requisitar<Feed>(`/grupos/${id}/feed${antes === undefined ? '' : `?antes=${encodeURIComponent(antes)}`}`),

  perfilPublico: (id: string) => requisitar<MembroComProgresso>(`/social/usuarios/${id}`),

  calendarioDe: (id: string, mes?: string) =>
    requisitar<CalendarioMes>(
      `/social/usuarios/${id}/calendario${mes === undefined ? '' : `?mes=${encodeURIComponent(mes)}`}`,
    ),

  refeicoesDe: (id: string, antes?: string) =>
    requisitar<Feed>(
      `/social/usuarios/${id}/refeicoes${antes === undefined ? '' : `?antes=${encodeURIComponent(antes)}`}`,
    ),

  feedGeral: (antes?: string) =>
    requisitar<Feed>(`/social/feed${antes === undefined ? '' : `?antes=${encodeURIComponent(antes)}`}`),

  curtir: (postId: string) => requisitar<void>(`/social/posts/${postId}/curtida`, { method: 'PUT' }),

  descurtir: (postId: string) =>
    requisitar<void>(`/social/posts/${postId}/curtida`, { method: 'DELETE' }),

  comentarios: (postId: string) =>
    requisitar<{ comentarios: Comentario[] }>(`/social/posts/${postId}/comentarios`),

  comentar: (postId: string, texto: string) =>
    requisitar<Comentario>(`/social/posts/${postId}/comentarios`, { method: 'POST', corpo: { texto } }),

  apagarComentario: (id: string) =>
    requisitar<void>(`/social/comentarios/${id}`, { method: 'DELETE' }),

  refeicoes: () => requisitar<{ refeicoes: Refeicao[] }>('/refeicoes'),

  criarRefeicao: (dados: { nome: string; inicio: string; fim: string }) =>
    requisitar<Refeicao>('/refeicoes', { method: 'POST', corpo: dados }),

  atualizarRefeicao: (id: string, campos: { nome?: string; inicio?: string; fim?: string }) =>
    requisitar<Refeicao>(`/refeicoes/${id}`, { method: 'PATCH', corpo: campos }),

  excluirRefeicao: (id: string) => requisitar<void>(`/refeicoes/${id}`, { method: 'DELETE' }),
};

export function mensagemDoErro(erro: unknown): string {
  if (erro instanceof ErroApi) return erro.message;
  if (erro instanceof Error) return erro.message;
  return 'algo deu errado';
}
