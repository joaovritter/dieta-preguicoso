import type { ReactNode } from 'react';

interface Props {
  titulo: string;
  aoFechar: () => void;
  children: ReactNode;
}

export default function Overlay({ titulo, aoFechar, children }: Props) {
  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) aoFechar();
      }}
    >
      <div className="overlay-painel">
        <h2 className="overlay-titulo">{titulo}</h2>
        {children}
      </div>
    </div>
  );
}

export function OverlayCarregando({ texto }: { texto: string }) {
  return (
    <div className="overlay-carregando" role="status" aria-live="polite">
      <div className="pulso" />
      <p>{texto}</p>
    </div>
  );
}
