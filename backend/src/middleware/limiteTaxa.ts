import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { AppError } from '../lib/erros.js';
import { perfilDe } from './autenticar.js';

interface Contador {
  contagem: number;
  expiraEm: number;
}

/**
 * Limitador de taxa em memória, por janela fixa. Suficiente para um app de
 * uso pessoal rodando num único processo — não precisa de Redis.
 */
export function limiteTaxa(opcoes: {
  janelaMs: number;
  maximo: number;
  chave: (req: Request) => string;
  mensagem: string;
}): RequestHandler {
  const contadores = new Map<string, Contador>();

  return (req: Request, _res: Response, next: NextFunction) => {
    const chave = opcoes.chave(req);
    const agora = Date.now();
    const atual = contadores.get(chave);

    if (!atual || atual.expiraEm <= agora) {
      contadores.set(chave, { contagem: 1, expiraEm: agora + opcoes.janelaMs });
      next();
      return;
    }

    if (atual.contagem >= opcoes.maximo) {
      next(new AppError('LIMITE_EXCEDIDO', opcoes.mensagem));
      return;
    }

    atual.contagem += 1;
    next();
  };
}

/** Chave por IP — usada em rotas ainda sem usuário autenticado (login/cadastro). */
export function porIp(req: Request): string {
  return req.ip ?? 'desconhecido';
}

/** Chave por usuário autenticado — usada em rotas que chamam a IA. */
export function porUsuario(req: Request): string {
  return perfilDe(req).id;
}
