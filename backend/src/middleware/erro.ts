import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { AppError, type CodigoErro } from '../lib/erros.js';

function responder(res: Response, status: number, codigo: CodigoErro, message: string): void {
  res.status(status).json({ error: { code: codigo, message } });
}

export function naoEncontrado(_req: Request, res: Response): void {
  responder(res, 404, 'NAO_ENCONTRADO', 'rota não encontrada');
}

/**
 * Traduz qualquer coisa lançada nas rotas para o envelope de erro do contrato.
 * Detalhe interno (stack, mensagem do driver do Postgres) fica no log, nunca na resposta.
 */
export function tratarErro(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    responder(res, err.status, err.codigo, err.message);
    return;
  }

  if (err instanceof ZodError) {
    const detalhe = err.issues
      .map((i) => `${i.path.join('.') || 'corpo'}: ${i.message}`)
      .join('; ');
    responder(res, 400, 'VALIDACAO', detalhe);
    return;
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'arquivo maior que o limite permitido' : err.message;
    responder(res, 400, 'ARQUIVO_INVALIDO', message);
    return;
  }

  console.error('[erro]', err);
  responder(res, 500, 'ERRO_INTERNO', 'erro interno no servidor');
}
