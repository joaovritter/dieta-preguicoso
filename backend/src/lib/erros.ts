export type CodigoErro =
  | 'VALIDACAO'
  | 'NAO_AUTORIZADO'
  | 'CREDENCIAIS_INVALIDAS'
  | 'EMAIL_EM_USO'
  | 'CADASTRO_DESABILITADO'
  | 'NAO_ENCONTRADO'
  | 'SEM_ACESSO'
  | 'PEDIDO_DUPLICADO'
  | 'IA_INDISPONIVEL'
  | 'IA_RESPOSTA_INVALIDA'
  | 'ARQUIVO_INVALIDO'
  | 'LIMITE_EXCEDIDO'
  | 'REFEICAO_EM_USO'
  | 'ERRO_INTERNO';

const STATUS_PADRAO: Record<CodigoErro, number> = {
  VALIDACAO: 400,
  NAO_AUTORIZADO: 401,
  CREDENCIAIS_INVALIDAS: 401,
  EMAIL_EM_USO: 409,
  CADASTRO_DESABILITADO: 403,
  NAO_ENCONTRADO: 404,
  SEM_ACESSO: 403,
  PEDIDO_DUPLICADO: 409,
  IA_INDISPONIVEL: 502,
  IA_RESPOSTA_INVALIDA: 502,
  ARQUIVO_INVALIDO: 400,
  LIMITE_EXCEDIDO: 429,
  REFEICAO_EM_USO: 409,
  ERRO_INTERNO: 500,
};

export class AppError extends Error {
  readonly codigo: CodigoErro;
  readonly status: number;

  constructor(codigo: CodigoErro, message: string, status?: number) {
    super(message);
    this.name = 'AppError';
    this.codigo = codigo;
    this.status = status ?? STATUS_PADRAO[codigo];
  }
}
