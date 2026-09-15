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

/** Qual IA o app usa. Decide qual chave é obrigatória. */
const provedorIA = opcional('IA_PROVEDOR', 'openai') === 'gemini' ? 'gemini' : 'openai';

export const env = {
  provedorIA,
  porta: numero('PORT', 3001),
  databaseUrl: obrigatoria('DATABASE_URL'),
  jwtSecret: obrigatoria('JWT_SECRET'),
  jwtExpiracao: opcional('JWT_EXPIRACAO', '30d'),
  // Só a chave do provedor escolhido é exigida — o outro pode ficar em branco.
  openaiApiKey: provedorIA === 'openai' ? obrigatoria('OPENAI_API_KEY') : opcional('OPENAI_API_KEY', ''),
  geminiApiKey: provedorIA === 'gemini' ? obrigatoria('GEMINI_API_KEY') : opcional('GEMINI_API_KEY', ''),
  /**
   * Modelos Gemini em ordem de preferência, separados por vírgula. O primeiro
   * atende; os seguintes só entram quando o de cima está sobrecarregado, sem
   * cota ou indisponível na conta.
   */
  modelosGemini: opcional('GEMINI_MODEL', 'gemini-3.6-flash,gemini-2.5-flash')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
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
  /**
   * Quantos proxies estão na frente da API. 1 = só o nginx do compose.
   * 2 = tem um proxy de TLS (Caddy, Traefik) na frente do nginx. Errar esse número
   * faz o rate limit enxergar o IP do proxy e contar todo mundo no mesmo balde.
   */
  proxiesConfiaveis: numero('TRUST_PROXY', 1),
  /** Bloqueia `POST /auth/register` depois que a conta pessoal já existe. */
  permitirCadastro: opcional('PERMITIR_CADASTRO', 'true') === 'true',
} as const;
