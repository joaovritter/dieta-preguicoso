import { Router } from 'express';
import { z } from 'zod';
import { paraPerfilPublico, separarNomeTag } from '../domain/social.js';
import { AppError } from '../lib/erros.js';
import { perfilDe } from '../middleware/autenticar.js';
import { limiteTaxa, porUsuario } from '../middleware/limiteTaxa.js';
import { buscarPorNomeTag } from '../repos/usuarios.js';
import {
  aceitarPedido,
  apagarPedido,
  buscarUsuarioSocial,
  criarPedido,
  desfazerAmizade,
  listarAmigos,
  listarPedidos,
  relacaoEntre,
  type PedidoComPerfil,
} from '../repos/social.js';
import { idSchema, listarComProgresso } from './socialComum.js';

export const rotasAmigos: Router = Router();

// Sem limite, dava para descobrir quem existe no servidor chutando tag atrás de tag.
const limitePedidos = limiteTaxa({
  janelaMs: 60 * 60 * 1000,
  maximo: 20,
  chave: porUsuario,
  mensagem: 'muitos pedidos de amizade em pouco tempo, aguarde um pouco',
});

rotasAmigos.get('/', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    res.json({ amigos: await listarComProgresso(await listarAmigos(perfil.id)) });
  } catch (e) {
    next(e);
  }
});

rotasAmigos.get('/pedidos', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const { recebidos, enviados } = await listarPedidos(perfil.id);
    const formatar = (p: PedidoComPerfil) => ({
      id: p.pedido_id,
      perfil: paraPerfilPublico(p),
      criado_em: p.pedido_criado_em.toISOString(),
    });
    res.json({ recebidos: recebidos.map(formatar), enviados: enviados.map(formatar) });
  } catch (e) {
    next(e);
  }
});

rotasAmigos.post('/pedidos', limitePedidos, async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const { nome_tag } = z.object({ nome_tag: z.string().min(3).max(130) }).parse(req.body);

    const partes = separarNomeTag(nome_tag);
    if (!partes) {
      throw new AppError('VALIDACAO', 'use o formato nome#0000, com os 4 dígitos da tag');
    }

    const alvo = await buscarPorNomeTag(partes.nome, partes.tag);
    if (!alvo) throw new AppError('NAO_ENCONTRADO', 'não achei ninguém com esse nome#tag');
    if (alvo.id === perfil.id) {
      throw new AppError('VALIDACAO', 'esse é você mesmo');
    }

    const existente = await relacaoEntre(perfil.id, alvo.id);
    if (existente) {
      throw new AppError(
        'PEDIDO_DUPLICADO',
        existente.status === 'aceita' ? 'vocês já são amigos' : 'já existe um pedido entre vocês',
      );
    }

    const pedido = await criarPedido(perfil.id, alvo.id);
    res.status(201).json({
      id: pedido.id,
      perfil: paraPerfilPublico(alvo),
      criado_em: pedido.criado_em.toISOString(),
    });
  } catch (e) {
    next(e);
  }
});

rotasAmigos.post('/pedidos/:id/aceitar', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const { id } = idSchema.parse(req.params);

    const pedido = await aceitarPedido(id, perfil.id);
    if (!pedido) throw new AppError('NAO_ENCONTRADO', 'pedido não encontrado');

    const novoAmigo = await buscarUsuarioSocial(pedido.solicitante_id);
    if (!novoAmigo) throw new AppError('NAO_ENCONTRADO', 'essa conta não existe mais');
    res.json({ perfil: paraPerfilPublico(novoAmigo) });
  } catch (e) {
    next(e);
  }
});

rotasAmigos.delete('/pedidos/:id', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const { id } = idSchema.parse(req.params);
    if (!(await apagarPedido(id, perfil.id))) {
      throw new AppError('NAO_ENCONTRADO', 'pedido não encontrado');
    }
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

rotasAmigos.delete('/:id', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const { id } = idSchema.parse(req.params);
    if (!(await desfazerAmizade(perfil.id, id))) {
      throw new AppError('NAO_ENCONTRADO', 'vocês não são amigos');
    }
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
