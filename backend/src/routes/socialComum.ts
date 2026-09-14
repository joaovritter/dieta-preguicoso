import type { Request } from 'express';
import { z } from 'zod';
import type { Feed, MembroComProgresso } from '../domain/tipos.js';
import { AppError } from '../lib/erros.js';
import { progressoNoDia } from '../repos/progresso.js';
import { feedDeUsuarios } from '../repos/registros.js';
import { paraPerfilPublico } from '../domain/social.js';
import { podeVer, type UsuarioSocial } from '../repos/social.js';

export const idSchema = z.object({ id: z.uuid('id inválido') });

const feedSchema = z.object({
  antes: z.iso.datetime({ offset: true }).optional(),
  limite: z.coerce.number().int().min(1).max(50).default(20),
});

/** Monta uma página do feed a partir da query da requisição. */
export async function montarFeed(req: Request, userIds: string[]): Promise<Feed> {
  const { antes, limite } = feedSchema.parse(req.query);
  const posts = await feedDeUsuarios(userIds, antes ? new Date(antes) : null, limite);

  // Só oferece a próxima página quando a atual veio cheia; menos que isso é o fim da lista.
  const ultimo = posts.length === limite ? posts[posts.length - 1] : undefined;
  return { posts, proximo_antes: ultimo?.criado_em ?? null };
}

export async function membroComProgresso(u: UsuarioSocial): Promise<MembroComProgresso> {
  return { perfil: paraPerfilPublico(u), progresso_hoje: await progressoNoDia(u) };
}

export function listarComProgresso(usuarios: UsuarioSocial[]): Promise<MembroComProgresso[]> {
  return Promise.all(usuarios.map(membroComProgresso));
}

/** Barra quem não é a própria pessoa, nem amigo, nem colega de grupo. */
export async function garantirAcesso(observadorId: string, alvoId: string): Promise<void> {
  if (!(await podeVer(observadorId, alvoId))) {
    throw new AppError('SEM_ACESSO', 'você não acompanha essa pessoa');
  }
}
