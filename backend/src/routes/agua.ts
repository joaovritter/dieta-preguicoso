import { Router } from 'express';
import { z } from 'zod';
import { extrairMililitros } from '../ai/parse.js';
import { AppError } from '../lib/erros.js';
import { perfilDe } from '../middleware/autenticar.js';
import { dataLocal, intervaloDoDia } from '../domain/tempo.js';
import { apagarAgua, criarAgua, listarAguaNoIntervalo } from '../repos/agua.js';

export const rotasAgua: Router = Router();

const dataOpcional = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'data deve estar no formato YYYY-MM-DD')
  .optional();

rotasAgua.get('/', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const { data } = z.object({ data: dataOpcional }).parse(req.query);
    const dia = data ?? dataLocal(new Date(), perfil.timezone);
    const { inicio, fim } = intervaloDoDia(dia, perfil.timezone);
    res.json(await listarAguaNoIntervalo(perfil.id, inicio, fim));
  } catch (e) {
    next(e);
  }
});

const aguaSchema = z
  .object({
    quantidade_ml: z.number().int().min(1).max(10000).optional(),
    texto: z.string().trim().min(1).max(200).optional(),
  })
  .refine(
    (o) => o.quantidade_ml !== undefined || o.texto !== undefined,
    'informe quantidade_ml ou texto',
  );

rotasAgua.post('/', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const dados = aguaSchema.parse(req.body);

    // Regex resolve "300ml", "1 litro", "2 copos" sem gastar chamada de IA.
    const ml = dados.quantidade_ml ?? (dados.texto ? extrairMililitros(dados.texto) : null);
    if (ml === null) {
      throw new AppError('VALIDACAO', 'não identifiquei a quantidade de água nesse texto');
    }

    res.status(201).json(await criarAgua(perfil.id, ml));
  } catch (e) {
    next(e);
  }
});

rotasAgua.delete('/:id', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const id = z.uuid('id inválido').parse(req.params.id);
    if (!(await apagarAgua(perfil.id, id))) {
      throw new AppError('NAO_ENCONTRADO', 'registro de água não encontrado');
    }
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
