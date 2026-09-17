import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { mensagemDoErro } from '../lib/api';
import { useEntradaIA } from './useEntradaIA';
import EntradaTexto from '../components/EntradaTexto';
import GravadorAudio from '../components/GravadorAudio';
import ConfirmacaoRegistro from '../components/ConfirmacaoRegistro';
import { OverlayCarregando } from '../components/Overlay';

export interface Captura {
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
  const [versao, setVersao] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  const aoGravar = useCallback(async () => {
    setModal(null);
    setVersao((atual) => atual + 1);
    navegar('/');
  }, [navegar]);

  const aoFalhar = useCallback((falha: unknown) => setErro(mensagemDoErro(falha)), []);

  const entrada = useEntradaIA(aoGravar, aoFalhar);

  const valor: Captura = {
    enviarFoto: (arquivo) => void entrada.enviarFoto(arquivo),
    abrirAudio: () => setModal('audio'),
    abrirTexto: () => setModal('texto'),
    ocupado: entrada.textoCarregando !== null,
    versao,
  };

  return (
    <CapturaContexto.Provider value={valor}>
      {children}

      {modal === 'texto' && (
        <EntradaTexto
          aoFechar={() => setModal(null)}
          aoEnviar={(texto) => {
            setModal(null);
            void entrada.enviarTexto(texto);
          }}
        />
      )}

      {modal === 'audio' && (
        <GravadorAudio
          aoFechar={() => setModal(null)}
          aoEnviar={(audio) => {
            setModal(null);
            void entrada.enviarAudio(audio);
          }}
        />
      )}

      {entrada.interpretacao !== null && (
        <ConfirmacaoRegistro
          interpretacao={entrada.interpretacao}
          aoConfirmar={entrada.confirmar}
          aoDescartar={entrada.descartar}
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
