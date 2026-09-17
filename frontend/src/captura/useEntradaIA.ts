import { useCallback, useState } from 'react';
import { api } from '../lib/api';
import type { EntradaConfirmacao, Interpretacao } from '../lib/types';

interface Entrada {
  interpretacao: Interpretacao | null;
  textoCarregando: string | null;
  enviarFoto: (arquivo: File, criadoEm?: string) => Promise<void>;
  enviarAudio: (audio: Blob, criadoEm?: string) => Promise<void>;
  enviarTexto: (texto: string, criadoEm?: string) => Promise<void>;
  confirmar: (entrada: EntradaConfirmacao) => Promise<void>;
  descartar: () => void;
}

interface Pendente {
  interpretacao: Interpretacao;
  /** Dia escolhido no calendário; repassado ao confirmar. */
  criadoEm: string | undefined;
}

/**
 * Fluxo das três entradas. Quando o perfil está em modo preguiçoso a API já devolve
 * `registro` gravado — nesse caso pulamos a confirmação e só avisamos quem chamou.
 */
export function useEntradaIA(aoGravar: () => Promise<void>, aoFalhar: (erro: unknown) => void): Entrada {
  const [pendente, setPendente] = useState<Pendente | null>(null);
  const [textoCarregando, setTextoCarregando] = useState<string | null>(null);

  const executar = useCallback(
    async (texto: string, criadoEm: string | undefined, chamada: () => Promise<Interpretacao>) => {
      setTextoCarregando(texto);
      try {
        const resultado = await chamada();
        if (resultado.registro !== undefined) await aoGravar();
        else setPendente({ interpretacao: resultado, criadoEm });
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
      await api.confirmar({ ...entrada, criado_em: entrada.criado_em ?? pendente?.criadoEm });
      setPendente(null);
      await aoGravar();
    },
    [aoGravar, pendente],
  );

  return {
    interpretacao: pendente?.interpretacao ?? null,
    textoCarregando,
    enviarFoto: (arquivo, criadoEm) =>
      executar('analisando a foto...', criadoEm, () => api.registroFoto(arquivo, criadoEm)),
    enviarAudio: (audio, criadoEm) =>
      executar('transcrevendo o áudio...', criadoEm, () => api.registroAudio(audio, criadoEm)),
    enviarTexto: (texto, criadoEm) =>
      executar('interpretando o texto...', criadoEm, () => api.registroTexto(texto, criadoEm)),
    confirmar,
    descartar: () => setPendente(null),
  };
}
