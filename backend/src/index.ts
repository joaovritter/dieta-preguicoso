import { unlink } from 'node:fs/promises';
import { criarApp } from './app.js';
import { env } from './env.js';
import { pool } from './db/index.js';
import { caminhoDaMidia } from './lib/uploads.js';
import { limparMidiasAntigas, midiasAntigas } from './repos/registros.js';

const UM_DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Fotos e áudios só servem para o usuário conferir o que a IA leu. Passada a janela
 * de retenção eles viram peso morto no disco da VPS — o registro nutricional fica.
 */
async function limparMidias(): Promise<void> {
  try {
    const limite = new Date(Date.now() - env.retencaoMidiaDias * UM_DIA_MS);
    const urls = await midiasAntigas(limite);
    if (urls.length === 0) return;

    for (const url of urls) {
      const caminho = caminhoDaMidia(url);
      if (caminho) await unlink(caminho).catch(() => undefined);
    }
    await limparMidiasAntigas(limite);
    console.log(`[limpeza] ${urls.length} mídia(s) removida(s)`);
  } catch (e) {
    console.error('[limpeza]', e);
  }
}

const servidor = criarApp().listen(env.porta, () => {
  console.log(`[api] ouvindo na porta ${env.porta}`);
});

void limparMidias();
const timerLimpeza = setInterval(() => void limparMidias(), UM_DIA_MS);
timerLimpeza.unref();

async function encerrar(sinal: string): Promise<void> {
  console.log(`[api] ${sinal} recebido, encerrando`);
  servidor.close();
  await pool.end().catch(() => undefined);
  process.exit(0);
}

process.on('SIGTERM', () => void encerrar('SIGTERM'));
process.on('SIGINT', () => void encerrar('SIGINT'));
