import { useCallback, useState } from 'react';
import { api } from '../lib/api';
import type { EntradaConfirmacao, Interpretacao } from '../lib/types';

interface Entrada {
  interpretacao: Interpretacao | null;
  textoCarregando: string | null;
  enviarFoto: (arquivo: File) => Promise<void>;
  enviarAudio: (audio: Blob) => Promise<void>;
  enviarTexto: (texto: string) => Promise<void>;
  confirmar: (entrada: EntradaConfirmacao) => Promise<void>;
  descartar: () => void;
}

/**
 * Fluxo das três entradas. Quando o perfil está em modo preguiçoso a API já devolve
 * `registro` gravado — nesse caso pulamos a confirmação e só atualizamos a Home.
 */
export function useEntradaIA(aoGravar: () => Promise<void>, aoFalhar: (erro: unknown) => void): Entrada {
  const [interpretacao, setInterpretacao] = useState<Interpretacao | null>(null);
  const [textoCarregando, setTextoCarregando] = useState<string | null>(null);

  const executar = useCallback(
    async (texto: string, chamada: () => Promise<Interpretacao>) => {
      setTextoCarregando(texto);
      try {
        const resultado = await chamada();
        if (resultado.registro !== undefined) await aoGravar();
        else setInterpretacao(resultado);
      } catch (falha: unknown) {
        aoFalhar(falha);
      } finally {
        setTextoCarregando(null);
      }
    },
    [aoGravar, aoFalhar],
  );

  const confirmar = useCallback(
    async (entrada: EntradaConfirmacao) => {
      await api.confirmar(entrada);
      setInterpretacao(null);
      await aoGravar();
    },
    [aoGravar],
  );

  return {
    interpretacao,
    textoCarregando,
    enviarFoto: (arquivo) => executar('analisando a foto...', () => api.registroFoto(arquivo)),
    enviarAudio: (audio) => executar('transcrevendo o áudio...', () => api.registroAudio(audio)),
    enviarTexto: (texto) => executar('interpretando o texto...', () => api.registroTexto(texto)),
    confirmar,
    descartar: () => setInterpretacao(null),
  };
}
