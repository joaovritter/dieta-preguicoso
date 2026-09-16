import { Router } from 'express';
import { z } from 'zod';
import { perfilDe } from '../middleware/autenticar.js';
import { horaValida } from '../domain/refeicao.js';
import { AppError } from '../lib/erros.js';
import {
  apagarRefeicao,
  atualizarRefeicao,
  criarRefeicao,
  listarRefeicoes,
} from '../repos/refeicoes.js';

export const rotasRefeicoes: Router = Router();

const hora = z.string().refine(horaValida, 'horário deve estar no formato HH:MM');
const nome = z.string().trim().min(1, 'dê um nome à refeição').max(40);

const novaSchema = z.object({ nome, inicio: hora, fim: hora });
const patchSchema = z
  .object({ nome: nome.optional(), inicio: hora.optional(), fim: hora.optional() })
  .refine((o) => Object.keys(o).length > 0, 'nada para atualizar');

rotasRefeicoes.get('/', async (req, res, next) => {
  try {
    res.json({ refeicoes: await listarRefeicoes(perfilDe(req).id) });
  } catch (e) {
    next(e);
  }
});

rotasRefeicoes.post('/', async (req, res, next) => {
  try {
    const dados = novaSchema.parse(req.body);
    res.status(201).json(await criarRefeicao(perfilDe(req).id, dados));
  } catch (e) {
    next(e);
  }
});

rotasRefeicoes.patch('/:id', async (req, res, next) => {
  try {
    const id = z.uuid('id inválido').parse(req.params.id);
    const campos = patchSchema.parse(req.body);
    const atualizada = await atualizarRefeicao(perfilDe(req).id, id, campos);
    if (!atualizada) throw new AppError('NAO_ENCONTRADO', 'refeição não encontrada');
    res.json(atualizada);
  } catch (e) {
    next(e);
  }
});

rotasRefeicoes.delete('/:id', async (req, res, next) => {
  try {
    const id = z.uuid('id inválido').parse(req.params.id);
    const apagou = await apagarRefeicao(perfilDe(req).id, id);
    if (!apagou) throw new AppError('NAO_ENCONTRADO', 'refeição não encontrada');
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
