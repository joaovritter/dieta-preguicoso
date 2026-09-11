import { useEffect, useRef, useState } from 'react';
import Overlay from './Overlay';
import Erro from './Erro';
import { duracao } from '../lib/format';

interface Props {
  aoEnviar: (audio: Blob) => void;
  aoFechar: () => void;
}

function suportado(): boolean {
  return typeof MediaRecorder !== 'undefined' && navigator.mediaDevices?.getUserMedia !== undefined;
}

function mensagemDePermissao(erro: unknown): string {
  const nome = erro instanceof DOMException ? erro.name : '';
  if (nome === 'NotAllowedError' || nome === 'SecurityError') {
    return 'permissão de microfone negada — libere nas configurações do navegador e tente de novo';
  }
  if (nome === 'NotFoundError' || nome === 'DevicesNotFoundError') {
    return 'nenhum microfone encontrado neste aparelho';
  }
  return 'não consegui acessar o microfone';
}

export default function GravadorAudio({ aoEnviar, aoFechar }: Props) {
  const [gravando, setGravando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [erro, setErro] = useState<string | null>(
    suportado() ? null : 'este navegador não suporta gravação de áudio — use texto ou foto',
  );

  const gravadorRef = useRef<MediaRecorder | null>(null);
  const pedacosRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!gravando) return;
    const id = window.setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [gravando]);

  // Garante que o microfone é liberado se o overlay fechar no meio da gravação.
  useEffect(() => {
    return () => {
      const gravador = gravadorRef.current;
      if (gravador !== null && gravador.state !== 'inactive') gravador.stop();
      gravador?.stream.getTracks().forEach((faixa) => faixa.stop());
    };
  }, []);

  async function iniciar() {
    setErro(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const tipo = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const gravador = new MediaRecorder(stream, tipo === '' ? undefined : { mimeType: tipo });
      pedacosRef.current = [];

      gravador.ondataavailable = (evento) => {
        if (evento.data.size > 0) pedacosRef.current.push(evento.data);
      };
      gravador.onstop = () => {
        stream.getTracks().forEach((faixa) => faixa.stop());
        const blob = new Blob(pedacosRef.current, { type: gravador.mimeType || 'audio/webm' });
        if (blob.size === 0) {
          setErro('a gravação saiu vazia — tente de novo');
          return;
        }
        aoEnviar(blob);
      };

      gravadorRef.current = gravador;
      gravador.start();
      setSegundos(0);
      setGravando(true);
    } catch (falha: unknown) {
      setErro(mensagemDePermissao(falha));
    }
  }

  function parar() {
    setGravando(false);
    gravadorRef.current?.stop();
  }

  return (
    <Overlay titulo="gravar áudio" aoFechar={aoFechar}>
      {erro !== null && <Erro mensagem={erro} />}

      <div className="gravador">
        <span className="gravador-tempo num">
          {gravando && <span className="gravador-ponto" aria-hidden="true" />}
          {duracao(segundos)}
        </span>
        <p className="mudo" style={{ margin: 0, fontSize: 13 }}>
          {gravando ? 'gravando... fale o que você comeu' : 'toque em gravar e descreva a refeição'}
        </p>
      </div>

      <div className="acoes-rodape">
        <button type="button" className="botao" onClick={aoFechar}>
          cancelar
        </button>
        {gravando ? (
          <button type="button" className="botao botao-primario" onClick={parar}>
            parar e enviar
          </button>
        ) : (
          <button
            type="button"
            className="botao botao-primario"
            disabled={!suportado()}
            onClick={() => void iniciar()}
          >
            gravar
          </button>
        )}
      </div>
    </Overlay>
  );
}
