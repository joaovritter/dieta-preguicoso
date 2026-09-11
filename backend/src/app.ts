import express, { type Express } from 'express';
import cors from 'cors';
import { env } from './env.js';
import { DIR_UPLOADS } from './lib/uploads.js';
import { autenticar } from './middleware/autenticar.js';
import { naoEncontrado, tratarErro } from './middleware/erro.js';
import { rotasAgua } from './routes/agua.js';
import { rotasAuth } from './routes/auth.js';
import { rotasMe } from './routes/me.js';
import { rotasRegistros } from './routes/registros.js';
import { rotasResumo } from './routes/resumo.js';

export function criarApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    cors({
      origin: env.origensPermitidas.includes('*') ? true : env.origensPermitidas,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', rotasAuth);

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
