import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../lib/erros.js';
import { perfilDe } from '../middleware/autenticar.js';
import {
  buscarGrupo,
  buscarGrupoPorCodigo,
  criarGrupo,
  ehMembro,
  entrarNoGrupo,
  listarGruposDoUsuario,
  membrosDoGrupo,
  paraGrupo,
  sairDoGrupo,
} from '../repos/social.js';
import { idSchema, listarComProgresso, montarFeed } from './socialComum.js';

export const rotasGrupos: Router = Router();

const nomeSchema = z.object({ nome: z.string().trim().min(1, 'dê um nome ao grupo').max(60) });
const codigoSchema = z.object({ codigo: z.string().trim().min(4).max(12) });

/** Confere que a pessoa é membro antes de devolver qualquer coisa do grupo. */
async function grupoDoMembro(grupoId: string, userId: string) {
  const grupo = await buscarGrupo(grupoId);
  if (!grupo) throw new AppError('NAO_ENCONTRADO', 'grupo não encontrado');
  if (!(await ehMembro(grupoId, userId))) {
    throw new AppError('SEM_ACESSO', 'você não faz parte desse grupo');
  }
  return grupo;
}

rotasGrupos.get('/', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const grupos = await listarGruposDoUsuario(perfil.id);
    res.json({ grupos: grupos.map((g) => paraGrupo(g, perfil.id)) });
  } catch (e) {
    next(e);
  }
});

rotasGrupos.post('/', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const { nome } = nomeSchema.parse(req.body);
    const grupo = await criarGrupo(nome, perfil.id);
    res.status(201).json(paraGrupo(grupo, perfil.id));
  } catch (e) {
    next(e);
  }
});

rotasGrupos.post('/entrar', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const { codigo } = codigoSchema.parse(req.body);

    const grupo = await buscarGrupoPorCodigo(codigo);
    if (!grupo) throw new AppError('NAO_ENCONTRADO', 'nenhum grupo com esse código');

    await entrarNoGrupo(grupo.id, perfil.id);
    const atualizado = await buscarGrupo(grupo.id);
    res.json(paraGrupo(atualizado ?? grupo, perfil.id));
  } catch (e) {
    next(e);
  }
});

rotasGrupos.delete('/:id/sair', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const { id } = idSchema.parse(req.params);
    await grupoDoMembro(id, perfil.id);
    await sairDoGrupo(id, perfil.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

rotasGrupos.get('/:id', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const { id } = idSchema.parse(req.params);
    const grupo = await grupoDoMembro(id, perfil.id);
    res.json({
      grupo: paraGrupo(grupo, perfil.id),
      membros: await listarComProgresso(await membrosDoGrupo(id)),
    });
  } catch (e) {
    next(e);
  }
});

rotasGrupos.get('/:id/feed', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const { id } = idSchema.parse(req.params);
    await grupoDoMembro(id, perfil.id);
    const membros = await membrosDoGrupo(id);
    res.json(await montarFeed(req, membros.map((m) => m.id)));
  } catch (e) {
    next(e);
  }
});
