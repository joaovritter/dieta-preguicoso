import { Router, type Request } from 'express';
import { z } from 'zod';
import { mesLocal } from '../domain/tempo.js';
import { AppError } from '../lib/erros.js';
import { perfilDe } from '../middleware/autenticar.js';
import { progressoNoDia, progressoNoMes } from '../repos/progresso.js';
import { paraPerfilPublico } from '../domain/social.js';
import { buscarUsuarioSocial } from '../repos/social.js';
import { garantirAcesso, idSchema, montarFeed } from './socialComum.js';

export const rotasSocial: Router = Router();

const mesSchema = z.object({
  mes: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'mês deve estar no formato YYYY-MM')
    .optional(),
});

/** Carrega a pessoa e já barra quem não tem permissão de ver o progresso dela. */
async function alvoVisivel(req: Request) {
  const perfil = perfilDe(req);
  const { id } = idSchema.parse(req.params);
  const alvo = await buscarUsuarioSocial(id);
  if (!alvo) throw new AppError('NAO_ENCONTRADO', 'essa conta não existe');
  await garantirAcesso(perfil.id, alvo.id);
  return alvo;
}

rotasSocial.get('/usuarios/:id', async (req, res, next) => {
  try {
    const alvo = await alvoVisivel(req);
    res.json({
      perfil: paraPerfilPublico(alvo),
      progresso_hoje: await progressoNoDia(alvo),
    });
  } catch (e) {
    next(e);
  }
});

rotasSocial.get('/usuarios/:id/calendario', async (req, res, next) => {
  try {
    const alvo = await alvoVisivel(req);
    const { mes } = mesSchema.parse(req.query);
    const alvoMes = mes ?? mesLocal(new Date(), alvo.timezone);
    res.json({ mes: alvoMes, dias: await progressoNoMes(alvo, alvoMes) });
  } catch (e) {
    next(e);
  }
});

rotasSocial.get('/usuarios/:id/refeicoes', async (req, res, next) => {
  try {
    const alvo = await alvoVisivel(req);
    res.json(await montarFeed(req, [alvo.id]));
  } catch (e) {
    next(e);
  }
});
