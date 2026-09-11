import type {
  Autenticacao,
  EntradaConfirmacao,
  EntradaPerfil,
  Interpretacao,
  Perfil,
  Refeicao,
  Registro,
  RegistroAgua,
  RegistrosDoDia,
  ResumoDia,
  ResumoSemana,
} from './types';

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
    if (resposta.status === 401 && opcoes.semAuth !== true) aoDeslogar();
    throw erro;
  }

  return corpo as T;
}

function arquivoForm(arquivo: Blob, nome: string): FormData {
  const form = new FormData();
  form.append('arquivo', arquivo, nome);
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

  registroTexto: (texto: string) =>
    requisitar<Interpretacao>('/registros/texto', { method: 'POST', corpo: { texto } }),

  registroFoto: (arquivo: File) =>
    requisitar<Interpretacao>('/registros/foto', {
      method: 'POST',
      formData: arquivoForm(arquivo, arquivo.name),
    }),

  registroAudio: (audio: Blob) =>
    requisitar<Interpretacao>('/registros/audio', {
      method: 'POST',
      formData: arquivoForm(audio, 'gravacao.webm'),
    }),

  confirmar: (entrada: EntradaConfirmacao) =>
    requisitar<Registro>('/registros/confirmar', { method: 'POST', corpo: entrada }),

  atualizarRegistro: (id: string, dados: { refeicao?: Refeicao }) =>
    requisitar<Registro>(`/registros/${id}`, { method: 'PATCH', corpo: dados }),

  excluirRegistro: (id: string) => requisitar<void>(`/registros/${id}`, { method: 'DELETE' }),

  registrosDoDia: (data: string) =>
    requisitar<RegistrosDoDia>(`/registros/dia?data=${encodeURIComponent(data)}`),

  adicionarAgua: (quantidade_ml: number) =>
    requisitar<RegistroAgua>('/agua', { method: 'POST', corpo: { quantidade_ml } }),

  resumoDia: (data: string) => requisitar<ResumoDia>(`/resumo/dia?data=${encodeURIComponent(data)}`),

  resumoSemana: (fim: string) => requisitar<ResumoSemana>(`/resumo/semana?fim=${encodeURIComponent(fim)}`),
};

export function mensagemDoErro(erro: unknown): string {
  if (erro instanceof ErroApi) return erro.message;
  if (erro instanceof Error) return erro.message;
  return 'algo deu errado';
}
