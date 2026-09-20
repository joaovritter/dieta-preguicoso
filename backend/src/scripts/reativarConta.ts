import { pool } from '../db/index.js';
import { reativarPorEmail } from '../repos/usuarios.js';
import { emailDosArgumentos } from './argumentos.js';

const MENSAGENS = {
  reativada: 'conta reativada — a pessoa já pode entrar de novo',
  ja_ativa: 'essa conta já está ativa, nada mudou',
  nao_encontrada: 'nenhuma conta com esse e-mail',
} as const;

async function principal(): Promise<number> {
  const email = emailDosArgumentos(process.argv.slice(2));
  if (email === null) {
    console.error('uso: npm run conta:reativar -- <email>');
    return 2;
  }
  const resultado = await reativarPorEmail(email);
  console.log(`[reativar] ${email}: ${MENSAGENS[resultado]}`);
  return resultado === 'nao_encontrada' ? 1 : 0;
}

principal()
  .then(async (codigo) => {
    await pool.end();
    process.exit(codigo);
  })
  .catch(async (e: unknown) => {
    console.error('[reativar]', e);
    await pool.end();
    process.exit(1);
  });
