import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { extname, join, resolve } from 'node:path';
import multer from 'multer';
import { env } from '../env.js';
import { AppError } from './erros.js';

export const DIR_UPLOADS = resolve(env.dirUploads);
mkdirSync(DIR_UPLOADS, { recursive: true });

const MIMES_IMAGEM = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);
const MIMES_AUDIO = new Set([
  'audio/webm',
  'audio/ogg',
  'audio/mpeg',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/wav',
  'audio/x-wav',
  'video/webm', // MediaRecorder do Chrome rotula webm de áudio como video/webm
]);

const EXTENSAO_PADRAO: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
  'audio/webm': '.webm',
  'video/webm': '.webm',
  'audio/ogg': '.ogg',
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  'audio/m4a': '.m4a',
  'audio/x-m4a': '.m4a',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
};

function armazenamento() {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, DIR_UPLOADS),
    filename: (_req, file, cb) => {
      // Nome sempre gerado pelo servidor: o nome original do cliente nunca toca o disco.
      const ext = EXTENSAO_PADRAO[file.mimetype] ?? extname(file.originalname).slice(0, 8) ?? '';
      cb(null, `${randomUUID()}${ext}`);
    },
  });
}

function filtro(permitidos: Set<string>, rotulo: string): multer.Options['fileFilter'] {
  return (_req, file, cb) => {
    if (permitidos.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new AppError('ARQUIVO_INVALIDO', `esse formato de ${rotulo} não dá para usar aqui`));
  };
}

export const uploadImagem = multer({
  storage: armazenamento(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: filtro(MIMES_IMAGEM, 'imagem'),
}).single('arquivo');

export const uploadAudio = multer({
  storage: armazenamento(),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
  fileFilter: filtro(MIMES_AUDIO, 'áudio'),
}).single('arquivo');

/** URL pública servida por `GET /uploads/:nome`. */
export function urlDaMidia(nomeArquivo: string): string {
  return `/uploads/${nomeArquivo}`;
}

/** Caminho em disco de uma `midia_url`, ou null se a URL não for nossa. */
export function caminhoDaMidia(midiaUrl: string): string | null {
  const prefixo = '/uploads/';
  if (!midiaUrl.startsWith(prefixo)) return null;
  const nome = midiaUrl.slice(prefixo.length);
  // Barra a travessia de diretório vinda de um valor gravado torto no banco.
  if (nome === '' || nome.includes('/') || nome.includes('\\') || nome.includes('..')) return null;
  return join(DIR_UPLOADS, nome);
}
