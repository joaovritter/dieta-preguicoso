import 'dotenv/config';

function obrigatoria(nome: string): string {
  const v = process.env[nome];
  if (!v || v.trim() === '') {
    throw new Error(`Variável de ambiente obrigatória ausente: ${nome}`);
  }
  return v;
}

function opcional(nome: string, padrao: string): string {
  const v = process.env[nome];
  return v && v.trim() !== '' ? v : padrao;
}

function numero(nome: string, padrao: number): number {
  const v = process.env[nome];
  if (!v) return padrao;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`Variável ${nome} não é um número: ${v}`);
  return n;
}

export const env = {
  porta: numero('PORT', 3001),
  databaseUrl: obrigatoria('DATABASE_URL'),
  jwtSecret: obrigatoria('JWT_SECRET'),
  jwtExpiracao: opcional('JWT_EXPIRACAO', '30d'),
  openaiApiKey: obrigatoria('OPENAI_API_KEY'),
  modeloTexto: opcional('OPENAI_MODEL_TEXTO', 'gpt-4o'),
  modeloVisao: opcional('OPENAI_MODEL_VISAO', 'gpt-4o'),
  modeloAudio: opcional('OPENAI_MODEL_AUDIO', 'whisper-1'),
  dirUploads: opcional('DIR_UPLOADS', './uploads'),
  /** Dias de retenção de fotos/áudios. 0 = apaga logo após processar. */
  retencaoMidiaDias: numero('RETENCAO_MIDIA_DIAS', 30),
  origensPermitidas: opcional('ORIGENS_PERMITIDAS', '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  timezonePadrao: opcional('TIMEZONE_PADRAO', 'America/Sao_Paulo'),
  /** Bloqueia `POST /auth/register` depois que a conta pessoal já existe. */
  permitirCadastro: opcional('PERMITIR_CADASTRO', 'true') === 'true',
} as const;
