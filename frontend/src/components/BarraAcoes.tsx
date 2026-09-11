import CapturaFoto from './CapturaFoto';

interface Props {
  aoEscolherFoto: (arquivo: File) => void;
  aoAbrirAudio: () => void;
  aoAbrirTexto: () => void;
  desabilitado: boolean;
}

export default function BarraAcoes({
  aoEscolherFoto,
  aoAbrirAudio,
  aoAbrirTexto,
  desabilitado,
}: Props) {
  return (
    <nav className="barra-acoes" aria-label="registrar refeição">
      <div className="barra-acoes-interna">
        <CapturaFoto aoEscolher={aoEscolherFoto} desabilitado={desabilitado} />

        <button type="button" className="acao" disabled={desabilitado} onClick={aoAbrirAudio}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </svg>
          áudio
        </button>

        <button type="button" className="acao" disabled={desabilitado} onClick={aoAbrirTexto}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h10" />
          </svg>
          texto
        </button>
      </div>
    </nav>
  );
}
