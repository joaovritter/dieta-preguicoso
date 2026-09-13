import express, { type Express } from 'express';
import cors from 'cors';
import { env } from './env.js';
import { DIR_UPLOADS } from './lib/uploads.js';
import { autenticar } from './middleware/autenticar.js';
import { naoEncontrado, tratarErro } from './middleware/erro.js';
import { limiteTaxa, porIp } from './middleware/limiteTaxa.js';
import { rotasAgua } from './routes/agua.js';
import { rotasAuth } from './routes/auth.js';
import { rotasMe } from './routes/me.js';
import { rotasRegistros } from './routes/registros.js';
import { rotasResumo } from './routes/resumo.js';

export function criarApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  // Só o nginx do compose fala com o backend: confia no X-Forwarded-For dele
  // para o rate limit enxergar o IP real do cliente.
  app.set('trust proxy', 1);
  app.use(
    cors({
      origin: env.origensPermitidas.includes('*') ? true : env.origensPermitidas,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Sem HTTPS/firewall restrito, login e cadastro ficam expostos a brute force
  // vindo de qualquer IP: limita tentativas por IP antes de chegar na rota.
  app.use(
    '/api/auth',
    limiteTaxa({
      janelaMs: 15 * 60 * 1000,
      maximo: 15,
      chave: porIp,
      mensagem: 'muitas tentativas de login, aguarde alguns minutos',
    }),
    rotasAuth,
  );

  // Tudo daqui pra baixo exige token.
  app.use('/api/me', autenticar, rotasMe);
  app.use('/api/registros', autenticar, rotasRegistros);
  app.use('/api/agua', autenticar, rotasAgua);
  app.use('/api/resumo', autenticar, rotasResumo);

  // Fotos e áudios. Servidos sem auth por simplicidade: os nomes são UUIDs
  // aleatórios e o servidor é de uso pessoal atrás de firewall.
  app.use('/uploads', express.static(DIR_UPLOADS, { maxAge: '7d', index: false }));

  app.use(naoEncontrado);
  app.use(tratarErro);

  return app;
}
