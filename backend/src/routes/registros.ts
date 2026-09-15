import { readFile, unlink } from 'node:fs/promises';
import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import { ia } from '../ai/index.js';
import { alimentoEntradaSchema } from '../ai/parse.js';
import { somarTotais } from '../domain/nutricao.js';
import { detectarRefeicao } from '../domain/refeicao.js';
import { intervaloDoDia, dataLocal } from '../domain/tempo.js';
import {
  REFEICOES,
  TIPOS_ENTRADA,
  type Alimento,
  type Interpretacao,
  type Perfil,
} from '../domain/tipos.js';
import { AppError } from '../lib/erros.js';
import { uploadAudio, uploadImagem, urlDaMidia, caminhoDaMidia } from '../lib/uploads.js';
import { perfilDe } from '../middleware/autenticar.js';
import { limiteTaxa, porUsuario } from '../middleware/limiteTaxa.js';
import {
  apagarRegistro,
  atualizarRegistro,
  buscarRegistro,
  criarRegistro,
  listarNoIntervalo,
} from '../repos/registros.js';

export const rotasRegistros: Router = Router();

// Cada chamada de /texto, /foto e /audio consome créditos da OpenAI: limita
// por usuário para conter tanto custo quanto uso indevido do endpoint.
const limiteIA = limiteTaxa({
  janelaMs: 60 * 60 * 1000,
  maximo: 60,
  chave: porUsuario,
  mensagem: 'muitos registros em pouco tempo, aguarde um pouco',
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

async function montarInterpretacao(
  perfil: Perfil,
  dados: {
    tipo_entrada: Interpretacao['tipo_entrada'];
    descricao_bruta: string;
    midia_url: string | null;
    alimentos: Alimento[];
  },
): Promise<Interpretacao> {
  const agora = new Date();
  const refeicao = detectarRefeicao(agora, perfil.timezone, perfil.faixas_refeicao);

  const interpretacao: Interpretacao = {
    tipo_entrada: dados.tipo_entrada,
    descricao_bruta: dados.descricao_bruta,
    midia_url: dados.midia_url,
    refeicao_sugerida: refeicao,
    alimentos: dados.alimentos,
    totais: somarTotais(dados.alimentos),
  };

  // Modo preguiçoso total: grava direto, sem passar pela tela de confirmação.
  // Sem alimento detectado não há o que gravar — o usuário precisa ver e corrigir.
  if (perfil.modo_preguicoso && dados.alimentos.length > 0) {
    interpretacao.registro = await criarRegistro({
      userId: perfil.id,
      tipo_entrada: dados.tipo_entrada,
      refeicao,
      descricao_bruta: dados.descricao_bruta,
      midia_url: dados.midia_url,
      alimentos: dados.alimentos,
      criado_em: agora,
    });
  }

  return interpretacao;
}

const textoSchema = z.object({
  texto: z.string().trim().min(2, 'descreva o que você comeu').max(2000),
});

rotasRegistros.post('/texto', limiteIA, async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const { texto } = textoSchema.parse(req.body);
    const alimentos = await ia.interpretarTexto(texto);
    res.json(
      await montarInterpretacao(perfil, {
        tipo_entrada: 'texto',
        descricao_bruta: texto,
        midia_url: null,
        alimentos,
      }),
    );
  } catch (e) {
    next(e);
  }
});

rotasRegistros.post('/foto', limiteIA, comUpload(uploadImagem), async (req, res, next) => {
  const arquivo = req.file;
  try {
    const perfil = perfilDe(req);
    if (!arquivo) throw new AppError('ARQUIVO_INVALIDO', 'envie a imagem no campo "arquivo"');

    const base64 = (await readFile(arquivo.path)).toString('base64');
    const { alimentos, descricao } = await ia.interpretarImagem(base64, arquivo.mimetype);

    res.json(
      await montarInterpretacao(perfil, {
        tipo_entrada: 'foto',
        descricao_bruta: descricao,
        midia_url: urlDaMidia(arquivo.filename),
        alimentos,
      }),
    );
  } catch (e) {
    // Falhou antes de virar registro: não deixa o arquivo órfão no disco.
    if (arquivo) await unlink(arquivo.path).catch(() => undefined);
    next(e);
  }
});

rotasRegistros.post('/audio', limiteIA, comUpload(uploadAudio), async (req, res, next) => {
  const arquivo = req.file;
  try {
    const perfil = perfilDe(req);
    if (!arquivo) throw new AppError('ARQUIVO_INVALIDO', 'envie o áudio no campo "arquivo"');

    const { transcricao, alimentos } = await ia.interpretarAudio(arquivo.path, arquivo.mimetype);
    if (transcricao.trim() === '') {
      throw new AppError('IA_RESPOSTA_INVALIDA', 'não consegui entender o áudio');
    }

    res.json(
      await montarInterpretacao(perfil, {
        tipo_entrada: 'audio',
        descricao_bruta: transcricao,
        midia_url: urlDaMidia(arquivo.filename),
        alimentos,
      }),
    );
  } catch (e) {
    if (arquivo) await unlink(arquivo.path).catch(() => undefined);
    next(e);
  }
});

const confirmarSchema = z.object({
  tipo_entrada: z.enum(TIPOS_ENTRADA),
  descricao_bruta: z.string().max(4000).default(''),
  midia_url: z.string().max(500).nullable().optional(),
  refeicao: z.enum(REFEICOES).optional(),
  alimentos: z.array(alimentoEntradaSchema).min(1, 'informe pelo menos um alimento').max(40),
  criado_em: z.iso.datetime().optional(),
});

rotasRegistros.post('/confirmar', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const dados = confirmarSchema.parse(req.body);
    const criadoEm = dados.criado_em ? new Date(dados.criado_em) : new Date();

    const registro = await criarRegistro({
      userId: perfil.id,
      tipo_entrada: dados.tipo_entrada,
      refeicao:
        dados.refeicao ?? detectarRefeicao(criadoEm, perfil.timezone, perfil.faixas_refeicao),
      descricao_bruta: dados.descricao_bruta,
      midia_url: dados.midia_url ?? null,
      alimentos: dados.alimentos,
      criado_em: criadoEm,
    });

    res.status(201).json(registro);
  } catch (e) {
    next(e);
  }
});

const patchSchema = z
  .object({
    refeicao: z.enum(REFEICOES),
    alimentos: z.array(alimentoEntradaSchema).min(1).max(40),
  })
  .partial()
  .refine((o) => o.refeicao !== undefined || o.alimentos !== undefined, 'nada para atualizar');

rotasRegistros.patch('/:id', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const id = z.uuid('id inválido').parse(req.params.id);
    const campos = patchSchema.parse(req.body);

    const registro = await atualizarRegistro(perfil.id, id, campos);
    if (!registro) throw new AppError('NAO_ENCONTRADO', 'registro não encontrado');
    res.json(registro);
  } catch (e) {
    next(e);
  }
});

rotasRegistros.delete('/:id', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const id = z.uuid('id inválido').parse(req.params.id);

    // Lê antes de apagar para saber qual mídia limpar do disco depois.
    const registro = await buscarRegistro(perfil.id, id);
    const apagou = await apagarRegistro(perfil.id, id);
    if (!apagou) throw new AppError('NAO_ENCONTRADO', 'registro não encontrado');

    if (registro?.midia_url) {
      const caminho = caminhoDaMidia(registro.midia_url);
      if (caminho) await unlink(caminho).catch(() => undefined);
    }
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

const diaSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'data deve estar no formato YYYY-MM-DD').optional(),
});

rotasRegistros.get('/dia', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const { data } = diaSchema.parse(req.query);
    const dia = data ?? dataLocal(new Date(), perfil.timezone);
    const { inicio, fim } = intervaloDoDia(dia, perfil.timezone);

    const registros = await listarNoIntervalo(perfil.id, inicio, fim);

    const refeicoes = REFEICOES.map((refeicao) => {
      const doGrupo = registros.filter((r) => r.refeicao === refeicao);
      return {
        refeicao,
        calorias: Math.round(doGrupo.reduce((s, r) => s + r.calorias_total, 0) * 10) / 10,
        registros: doGrupo,
      };
    })
      // Ceia normalmente fica vazia; só aparece quando tem registro.
      .filter((g) => g.refeicao !== 'ceia' || g.registros.length > 0);

    res.json({ data: dia, refeicoes });
  } catch (e) {
    next(e);
  }
});
