import { useCallback, useEffect, useState } from 'react';
import { api, mensagemDoErro } from '../lib/api';
import type { RegistrosDoDia, ResumoDia, ResumoSemana } from '../lib/types';

interface Dados {
  resumo: ResumoDia | null;
  registros: RegistrosDoDia | null;
  semana: ResumoSemana | null;
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
  limparErro: () => void;
  reportarErro: (falha: unknown) => void;
}

/** Busca resumo, registros e a faixa semanal da data selecionada. */
export function useDadosDoDia(data: string, fimDaSemana: string): Dados {
  const [resumo, setResumo] = useState<ResumoDia | null>(null);
  const [registros, setRegistros] = useState<RegistrosDoDia | null>(null);
  const [semana, setSemana] = useState<ResumoSemana | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [novoResumo, novosRegistros, novaSemana] = await Promise.all([
        api.resumoDia(data),
        api.registrosDoDia(data),
        api.resumoSemana(fimDaSemana),
      ]);
      setResumo(novoResumo);
      setRegistros(novosRegistros);
      setSemana(novaSemana);
      setErro(null);
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    } finally {
      setCarregando(false);
    }
  }, [data, fimDaSemana]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  return {
    resumo,
    registros,
    semana,
    carregando,
    erro,
    recarregar,
    limparErro: () => setErro(null),
    reportarErro: (falha: unknown) => setErro(mensagemDoErro(falha)),
  };
}
