import { unlink } from 'node:fs/promises';
import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import { perfilDe } from '../middleware/autenticar.js';
import { limiteTaxa, porUsuario } from '../middleware/limiteTaxa.js';
import { calcularMetas, recalcularMetaCaloriasManual } from '../domain/nutricao.js';
import { timezoneValida } from '../domain/tempo.js';
import { OBJETIVOS, SEXOS } from '../domain/tipos.js';
import { conferirSenha, hashSenha } from '../lib/auth.js';
import { AppError } from '../lib/erros.js';
import { uploadImagem, urlDaMidia, caminhoDaMidia } from '../lib/uploads.js';
import { donoDoRegistro, listarComentariosDoUsuario } from '../repos/interacoes.js';
import { apagarSalvo, listarSalvos, salvarRegistro } from '../repos/refeicoesSalvas.js';
import {
  atualizarFotoPerfil,
  atualizarSenha,
  atualizarUsuario,
  buscarPorId,
  desativarUsuario,
  paraPerfil,
  type CamposAtualizaveis,
} from '../repos/usuarios.js';
import { garantirAcesso, idSchema } from './socialComum.js';

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
    esconder_comentarios_perfil: z.boolean(),
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

/** Envolve o middleware do multer para que o erro caia no `next` em vez de estourar. */
function comUpload(middleware: RequestHandler): RequestHandler {
  return (req, res, next) => {
    middleware(req, res, (err: unknown) => {
      if (err) next(err);
      else next();
    });
  };
}

rotasMe.post('/foto', comUpload(uploadImagem), async (req, res, next) => {
  const arquivo = req.file;
  try {
    if (!arquivo) throw new AppError('ARQUIVO_INVALIDO', 'a foto não chegou no envio. tente de novo');
    const perfil = perfilDe(req);

    const linha = await atualizarFotoPerfil(perfil.id, urlDaMidia(arquivo.filename));

    // Troca por cima de uma foto antiga: apaga o arquivo anterior do disco.
    if (perfil.foto_url) {
      const caminho = caminhoDaMidia(perfil.foto_url);
      if (caminho) await unlink(caminho).catch(() => undefined);
    }

    res.json(paraPerfil(linha));
  } catch (e) {
    if (arquivo) await unlink(arquivo.path).catch(() => undefined);
    next(e);
  }
});

rotasMe.delete('/foto', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const linha = await atualizarFotoPerfil(perfil.id, null);

    if (perfil.foto_url) {
      const caminho = caminhoDaMidia(perfil.foto_url);
      if (caminho) await unlink(caminho).catch(() => undefined);
    }

    res.json(paraPerfil(linha));
  } catch (e) {
    next(e);
  }
});

const feedComentariosSchema = z.object({
  antes: z.iso.datetime({ offset: true }).optional(),
  limite: z.coerce.number().int().min(1).max(50).default(20),
});

rotasMe.get('/comentarios', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const { antes, limite } = feedComentariosSchema.parse(req.query);
    const comentarios = await listarComentariosDoUsuario(
      perfil.id,
      antes ? new Date(antes) : null,
      limite,
    );

    // Só oferece a próxima página quando a atual veio cheia; menos que isso é o fim da lista.
    const ultimo = comentarios.length === limite ? comentarios[comentarios.length - 1] : undefined;
    res.json({ comentarios, proximo_antes: ultimo?.criado_em ?? null });
  } catch (e) {
    next(e);
  }
});

const salvarSchema = z.object({ registro_id: z.uuid('id inválido') });

rotasMe.post('/salvos', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const { registro_id } = salvarSchema.parse(req.body);
    // Mesma regra de curtir/comentar: o registro existe e quem pede enxerga o dono.
    const dono = await donoDoRegistro(registro_id);
    if (!dono) throw new AppError('NAO_ENCONTRADO', 'essa refeição não existe');
    await garantirAcesso(perfil.id, dono);
    const salvo = await salvarRegistro(registro_id, perfil.id);
    if (!salvo) throw new AppError('NAO_ENCONTRADO', 'essa refeição não existe');
    res.status(201).json(salvo);
  } catch (e) {
    next(e);
  }
});

rotasMe.get('/salvos', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const { antes, limite } = feedComentariosSchema.parse(req.query);
    const salvos = await listarSalvos(perfil.id, antes ? new Date(antes) : null, limite);

    // Só oferece a próxima página quando a atual veio cheia; menos que isso é o fim da lista.
    const ultimo = salvos.length === limite ? salvos[salvos.length - 1] : undefined;
    res.json({ salvos, proximo_antes: ultimo?.criado_em ?? null });
  } catch (e) {
    next(e);
  }
});

rotasMe.delete('/salvos/:id', async (req, res, next) => {
  try {
    const { id } = idSchema.parse(req.params);
    if (!(await apagarSalvo(id, perfilDe(req).id))) {
      throw new AppError('NAO_ENCONTRADO', 'refeição salva não encontrada');
    }
    res.status(204).end();
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
