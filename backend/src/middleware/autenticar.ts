import type { NextFunction, Request, Response } from 'express';
import { verificarToken } from '../lib/auth.js';
import { AppError } from '../lib/erros.js';
import { buscarPorId, paraPerfil } from '../repos/usuarios.js';
import type { Perfil } from '../domain/tipos.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      perfil?: Perfil;
    }
  }
}

/** Depois deste middleware, `req.perfil` está garantidamente preenchido. */
export function perfilDe(req: Request): Perfil {
  if (!req.perfil) throw new AppError('NAO_AUTORIZADO', 'requisição sem perfil autenticado');
  return req.perfil;
}

export async function autenticar(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.get('authorization') ?? '';
    const [esquema, token] = header.split(' ');
    if (esquema?.toLowerCase() !== 'bearer' || !token) {
      throw new AppError('NAO_AUTORIZADO', 'informe o header Authorization: Bearer <token>');
    }

    const userId = verificarToken(token);
    const linha = await buscarPorId(userId);
    if (!linha) throw new AppError('NAO_AUTORIZADO', 'usuário do token não existe mais');

    req.perfil = paraPerfil(linha);
    next();
  } catch (e) {
    next(e);
  }
}
