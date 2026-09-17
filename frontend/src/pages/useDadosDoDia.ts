import { useCallback, useEffect, useState } from 'react';
import { api, mensagemDoErro } from '../lib/api';
import type { RegistrosDoDia, ResumoDia } from '../lib/types';

interface Dados {
  resumo: ResumoDia | null;
  registros: RegistrosDoDia | null;
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
  limparErro: () => void;
  reportarErro: (falha: unknown) => void;
}

/** Resumo e registros da data. `versao` vem do CapturaContext: muda a cada registro gravado. */
export function useDadosDoDia(data: string, versao: number): Dados {
  const [resumo, setResumo] = useState<ResumoDia | null>(null);
  const [registros, setRegistros] = useState<RegistrosDoDia | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [novoResumo, novosRegistros] = await Promise.all([api.resumoDia(data), api.registrosDoDia(data)]);
      setResumo(novoResumo);
      setRegistros(novosRegistros);
      setErro(null);
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    } finally {
      setCarregando(false);
    }
  }, [data]);

  useEffect(() => {
    void recarregar();
  }, [recarregar, versao]);

  return {
    resumo,
    registros,
    carregando,
    erro,
    recarregar,
    limparErro: () => setErro(null),
    reportarErro: (falha: unknown) => setErro(mensagemDoErro(falha)),
  };
}
