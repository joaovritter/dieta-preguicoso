import { useRef } from 'react';

interface Props {
  aoEscolher: (arquivo: File) => void;
  desabilitado: boolean;
}

/** Abre a câmera traseira no celular; no desktop cai no seletor de arquivo. */
export default function CapturaFoto({ aoEscolher, desabilitado }: Props) {
  const entrada = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        type="button"
        className="acao"
        disabled={desabilitado}
        onClick={() => entrada.current?.click()}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 8h4l2-3h6l2 3h4v11H3z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
        foto
      </button>
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(evento) => {
          const arquivo = evento.target.files?.[0];
          evento.target.value = ''; // permite escolher a mesma foto de novo
          if (arquivo !== undefined) aoEscolher(arquivo);
        }}
      />
    </>
  );
}
