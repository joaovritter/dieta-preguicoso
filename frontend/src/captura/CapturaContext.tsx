import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { mensagemDoErro } from '../lib/api';
import { paraISO } from '../lib/format';
import { useEntradaIA } from './useEntradaIA';
import { criadoEmParaDia } from './retroativo';
import EntradaTexto from '../components/EntradaTexto';
import GravadorAudio from '../components/GravadorAudio';
import ConfirmacaoRegistro from '../components/ConfirmacaoRegistro';
import { OverlayCarregando } from '../components/Overlay';

export interface Captura {
  /** Abre o menu do `+`. `data` (YYYY-MM-DD, hoje ou passado) faz o registro nascer naquele dia. */
  abrirMenu(data?: string): void;
  /** Fecha o menu. `manterDia` = true quando a pessoa escolheu foto/áudio/texto e o dia ainda vale. */
  fecharMenu(manterDia?: boolean): void;
  menuAberto: boolean;
  /** Dia escolhido no calendário; `null` = agora. */
  dataAlvo: string | null;
  enviarFoto(arquivo: File): void;
  abrirAudio(): void;
  abrirTexto(): void;
  ocupado: boolean;
  /** Incrementa a cada registro gravado — páginas usam como dependência para recarregar. */
  versao: number;
}

const CapturaContexto = createContext<Captura | null>(null);

type Modal = 'texto' | 'audio' | null;

export function CapturaProvider({ children }: { children: ReactNode }) {
  const navegar = useNavigate();
  const [modal, setModal] = useState<Modal>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [dataAlvo, setDataAlvoEstado] = useState<string | null>(null);
  const [versao, setVersao] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  // Ref espelha o estado: `aoGravar` roda depois de um await e precisa do dia mais recente.
  const dataAlvoRef = useRef<string | null>(null);
  const definirDataAlvo = useCallback((data: string | null) => {
    dataAlvoRef.current = data;
    setDataAlvoEstado(data);
  }, []);

  const aoGravar = useCallback(async () => {
    const dia = dataAlvoRef.current;
    definirDataAlvo(null);
    setModal(null);
    setVersao((atual) => atual + 1);
    navegar(dia === null ? '/' : `/?data=${dia}`);
  }, [navegar, definirDataAlvo]);

  const aoFalhar = useCallback(
    (falha: unknown) => {
      definirDataAlvo(null);
      setErro(mensagemDoErro(falha));
    },
    [definirDataAlvo],
  );

  const entrada = useEntradaIA(aoGravar, aoFalhar);
  const instante = () => criadoEmParaDia(dataAlvoRef.current, new Date());

  const valor: Captura = {
    abrirMenu: (data) => {
      // Hoje é o mesmo que "agora": sem dica de dia e volta para `/`.
      definirDataAlvo(data === undefined || data === paraISO(new Date()) ? null : data);
      setMenuAberto(true);
    },
    fecharMenu: (manterDia = false) => {
      setMenuAberto(false);
      if (!manterDia) definirDataAlvo(null);
    },
    menuAberto,
    dataAlvo,
    enviarFoto: (arquivo) => void entrada.enviarFoto(arquivo, instante()),
    abrirAudio: () => setModal('audio'),
    abrirTexto: () => setModal('texto'),
    ocupado: entrada.textoCarregando !== null,
    versao,
  };

  function fecharModal() {
    setModal(null);
    definirDataAlvo(null);
  }

  return (
    <CapturaContexto.Provider value={valor}>
      {children}

      {modal === 'texto' && (
        <EntradaTexto
          aoFechar={fecharModal}
          aoEnviar={(texto) => {
            setModal(null);
            void entrada.enviarTexto(texto, instante());
          }}
        />
      )}

      {modal === 'audio' && (
        <GravadorAudio
          aoFechar={fecharModal}
          aoEnviar={(audio) => {
            setModal(null);
            void entrada.enviarAudio(audio, instante());
          }}
        />
      )}

      {entrada.interpretacao !== null && (
        <ConfirmacaoRegistro
          interpretacao={entrada.interpretacao}
          aoConfirmar={entrada.confirmar}
          aoDescartar={() => {
            entrada.descartar();
            definirDataAlvo(null);
          }}
        />
      )}

      {entrada.textoCarregando !== null && <OverlayCarregando texto={entrada.textoCarregando} />}

      <Snackbar
        open={erro !== null}
        autoHideDuration={6000}
        onClose={() => setErro(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setErro(null)}>
          {erro}
        </Alert>
      </Snackbar>
    </CapturaContexto.Provider>
  );
}

export function useCaptura(): Captura {
  const ctx = useContext(CapturaContexto);
  if (ctx === null) throw new Error('useCaptura precisa estar dentro de <CapturaProvider>');
  return ctx;
}
