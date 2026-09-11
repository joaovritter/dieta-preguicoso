import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import { AppError } from './erros.js';

const CUSTO_BCRYPT = 12;

export function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, CUSTO_BCRYPT);
}

export function conferirSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

export function gerarToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiracao as jwt.SignOptions['expiresIn'],
  });
}

export function verificarToken(token: string): string {
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const sub = typeof payload === 'string' ? null : payload.sub;
    if (typeof sub !== 'string' || sub === '') {
      throw new AppError('NAO_AUTORIZADO', 'token sem sujeito');
    }
    return sub;
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError('NAO_AUTORIZADO', 'token inválido ou expirado');
  }
}
