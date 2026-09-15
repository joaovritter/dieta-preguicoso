import { describe, expect, it } from 'vitest';
import { normalizarMime, parsearAudio, parsearVisao, textoDaResposta } from './respostaGemini.js';

const envelope = (texto: string) => ({ candidates: [{ content: { parts: [{ text: texto }] } }] });

describe('textoDaResposta', () => {
  it('tira o texto de dentro do envelope', () => {
    expect(textoDaResposta(envelope('{"alimentos":[]}'))).toBe('{"alimentos":[]}');
  });

  it('junta as partes quando a resposta vem picada', () => {
    const corpo = { candidates: [{ content: { parts: [{ text: '{"ali' }, { text: 'mentos":[]}' }] } }] };
    expect(textoDaResposta(corpo)).toBe('{"alimentos":[]}');
  });

  it('recusa resposta vazia, sem candidato ou fora do formato', () => {
    expect(() => textoDaResposta(envelope('   '))).toThrow();
    expect(() => textoDaResposta({ candidates: [] })).toThrow();
    expect(() => textoDaResposta(null)).toThrow();
  });
});

describe('parsearVisao', () => {
  it('lê alimentos e descrição', () => {
    const bruto = '{"descricao":"prato feito","alimentos":[{"nome":"arroz","quantidade_estimada":"150g","calorias":195,"carboidrato_g":42,"proteina_g":4,"gordura_g":0.4}]}';
    const r = parsearVisao(bruto);
    expect(r.descricao).toBe('prato feito');
    expect(r.alimentos).toHaveLength(1);
  });

  it('sem descrição, monta uma a partir dos nomes', () => {
    const bruto = '{"alimentos":[{"nome":"arroz","quantidade_estimada":"150g","calorias":195,"carboidrato_g":42,"proteina_g":4,"gordura_g":0.4},{"nome":"feijão","quantidade_estimada":"1 concha","calorias":80,"carboidrato_g":14,"proteina_g":5,"gordura_g":0.5}]}';
    expect(parsearVisao(bruto).descricao).toBe('arroz, feijão');
  });

  it('foto sem comida não fica sem descrição', () => {
    expect(parsearVisao('{"alimentos":[]}').descricao).toBe('foto sem alimento identificado');
  });
});

describe('parsearAudio', () => {
  it('separa transcrição e alimentos da mesma resposta', () => {
    const bruto = '{"transcricao":"comi dois ovos","alimentos":[{"nome":"ovo cozido","quantidade_estimada":"2 unidades","calorias":140,"carboidrato_g":1,"proteina_g":12,"gordura_g":10}]}';
    const r = parsearAudio(bruto);
    expect(r.transcricao).toBe('comi dois ovos');
    expect(r.alimentos[0]?.nome).toBe('ovo cozido');
  });

  it('aguenta o JSON embrulhado em cerca de markdown', () => {
    const bruto = '```json\n{"transcricao":"um pão","alimentos":[]}\n```';
    expect(parsearAudio(bruto).transcricao).toBe('um pão');
  });

  it('transcrição ausente vira string vazia, e a rota decide o que fazer', () => {
    expect(parsearAudio('{"alimentos":[]}').transcricao).toBe('');
  });
});

describe('normalizarMime', () => {
  it('trata o webm de áudio que o Chrome rotula como vídeo', () => {
    expect(normalizarMime('video/webm')).toBe('audio/webm');
  });

  it('descarta o codec grudado no tipo', () => {
    expect(normalizarMime('audio/webm;codecs=opus')).toBe('audio/webm');
  });

  it('normaliza os apelidos de m4a e wav', () => {
    expect(normalizarMime('audio/x-m4a')).toBe('audio/mp4');
    expect(normalizarMime('audio/x-wav')).toBe('audio/wav');
  });

  it('deixa passar o que já está certo', () => {
    expect(normalizarMime('image/jpeg')).toBe('image/jpeg');
  });
});
