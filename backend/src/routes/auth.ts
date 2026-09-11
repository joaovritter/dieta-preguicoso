import { Router } from 'express';
import { z } from 'zod';
import { env } from '../env.js';
import { conferirSenha, gerarToken, hashSenha } from '../lib/auth.js';
import { AppError } from '../lib/erros.js';
import { buscarPorEmail, contarUsuarios, criarUsuario, paraPerfil } from '../repos/usuarios.js';

export const rotasAuth: Router = Router();

const cadastroSchema = z.object({
  email: z.email('e-mail inválido'),
  senha: z.string().min(8, 'a senha precisa de pelo menos 8 caracteres').max(200),
  nome: z.string().trim().min(1, 'informe o nome').max(120),
});

const loginSchema = z.object({
  email: z.email('e-mail inválido'),
  senha: z.string().min(1, 'informe a senha').max(200),
});

rotasAuth.post('/register', async (req, res, next) => {
  try {
    // App de uso pessoal: depois que a conta existe, o cadastro fica fechado por padrão.
    if (!env.permitirCadastro && (await contarUsuarios()) > 0) {
      throw new AppError('CADASTRO_DESABILITADO', 'cadastro fechado neste servidor');
    }

    const { email, senha, nome } = cadastroSchema.parse(req.body);
    if (await buscarPorEmail(email)) {
      throw new AppError('EMAIL_EM_USO', 'já existe uma conta com esse e-mail');
    }

    const linha = await criarUsuario(email, await hashSenha(senha), nome, env.timezonePadrao);
    res.status(201).json({ token: gerarToken(linha.id), perfil: paraPerfil(linha) });
  } catch (e) {
    next(e);
  }
});

rotasAuth.post('/login', async (req, res, next) => {
  try {
    const { email, senha } = loginSchema.parse(req.body);
    const linha = await buscarPorEmail(email);

    // Mesma mensagem para e-mail inexistente e senha errada — não entrega quais
    // e-mails têm conta neste servidor.
    const ok = linha ? await conferirSenha(senha, linha.password_hash) : false;
    if (!linha || !ok) {
      throw new AppError('CREDENCIAIS_INVALIDAS', 'e-mail ou senha incorretos');
    }

    res.json({ token: gerarToken(linha.id), perfil: paraPerfil(linha) });
  } catch (e) {
    next(e);
  }
});
