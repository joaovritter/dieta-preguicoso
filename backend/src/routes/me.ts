import { Router } from 'express';
import { z } from 'zod';
import { perfilDe } from '../middleware/autenticar.js';
import { limiteTaxa, porUsuario } from '../middleware/limiteTaxa.js';
import { calcularMetas, recalcularMetaCaloriasManual } from '../domain/nutricao.js';
import { timezoneValida } from '../domain/tempo.js';
import { OBJETIVOS, SEXOS } from '../domain/tipos.js';
import { conferirSenha, hashSenha } from '../lib/auth.js';
import { AppError } from '../lib/erros.js';
import {
  atualizarSenha,
  atualizarUsuario,
  buscarPorId,
  desativarUsuario,
  paraPerfil,
  type CamposAtualizaveis,
} from '../repos/usuarios.js';

export const rotasMe: Router = Router();

const perfilSchema = z
  .object({
    nome: z.string().trim().min(1).max(120),
    sexo: z.enum(SEXOS).nullable(),
    idade: z.number().int().min(1).max(120).nullable(),
    peso_kg: z.number().min(20).max(400).nullable(),
    altura_cm: z.number().min(80).max(260).nullable(),
    objetivo: z.enum(OBJETIVOS),
    meta_calorias: z.number().int().min(500).max(10000),
    meta_carboidrato_g: z.number().min(0).max(2000),
    meta_proteina_g: z.number().min(0).max(1000),
    meta_gordura_g: z.number().min(0).max(1000),
    meta_agua_ml: z.number().int().min(200).max(20000),
    metas_automaticas: z.boolean(),
    modo_preguicoso: z.boolean(),
    timezone: z.string().refine(timezoneValida, 'fuso horário desconhecido'),
  })
  .partial();

rotasMe.get('/', (req, res) => {
  res.json(perfilDe(req));
});

rotasMe.put('/', async (req, res, next) => {
  try {
    const atual = perfilDe(req);
    const campos: CamposAtualizaveis = perfilSchema.parse(req.body);

    // Metas automáticas ligadas: os dados corporais mandam, o que veio de meta_* é ignorado.
    const automaticas = campos.metas_automaticas ?? atual.metas_automaticas;
    if (automaticas) {
      const metas = calcularMetas({
        sexo: campos.sexo !== undefined ? campos.sexo : atual.sexo,
        idade: campos.idade !== undefined ? campos.idade : atual.idade,
        peso_kg: campos.peso_kg !== undefined ? campos.peso_kg : atual.peso_kg,
        altura_cm: campos.altura_cm !== undefined ? campos.altura_cm : atual.altura_cm,
        objetivo: campos.objetivo ?? atual.objetivo,
      });
      // Sem dados corporais suficientes, mantém as metas atuais em vez de zerar o perfil.
      if (metas) Object.assign(campos, metas);
    } else {
      // Metas automáticas desligadas: meta_calorias nunca é um campo independente, é sempre
      // derivado dos macros (mesclados com o que já está salvo) — ignora o que veio no body.
      campos.meta_calorias = recalcularMetaCaloriasManual(atual, campos);
    }

    const linha = await atualizarUsuario(atual.id, campos);
    res.json(paraPerfil(linha));
  } catch (e) {
    next(e);
  }
});

// Com um token vazado dá para chutar a senha atual por aqui: limita por usuário.
const limiteConta = limiteTaxa({
  janelaMs: 15 * 60 * 1000,
  maximo: 10,
  chave: porUsuario,
  mensagem: 'muitas tentativas com a senha, aguarde alguns minutos',
});

async function exigirSenha(userId: string, senha: string): Promise<void> {
  const linha = await buscarPorId(userId);
  const ok = linha ? await conferirSenha(senha, linha.password_hash) : false;
  if (!ok) throw new AppError('SENHA_INCORRETA', 'senha atual incorreta');
}

const trocaSenhaSchema = z.object({
  senha_atual: z.string().min(1, 'informe a senha atual').max(200),
  senha_nova: z
    .string()
    .min(8, 'a senha nova precisa de pelo menos 8 caracteres')
    .max(200, 'a senha nova pode ter no máximo 200 caracteres'),
});

rotasMe.put('/senha', limiteConta, async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const { senha_atual, senha_nova } = trocaSenhaSchema.parse(req.body);
    await exigirSenha(perfil.id, senha_atual);
    await atualizarSenha(perfil.id, await hashSenha(senha_nova));
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

const desativarSchema = z.object({
  senha: z.string().min(1, 'informe a senha').max(200),
});

rotasMe.post('/desativar', limiteConta, async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const { senha } = desativarSchema.parse(req.body);
    await exigirSenha(perfil.id, senha);
    await desativarUsuario(perfil.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
