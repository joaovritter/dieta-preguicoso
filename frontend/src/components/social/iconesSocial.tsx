import type { ReactNode } from 'react';

function Icone({ tamanho = 19, traco = 1.8, children }: { tamanho?: number; traco?: number; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      fill="none"
      stroke="currentColor"
      strokeWidth={traco}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function IconeFeed() {
  return (
    <Icone>
      <circle cx="5" cy="6" r="1" />
      <path d="M10 6h10" />
      <circle cx="5" cy="12" r="1" />
      <path d="M10 12h10" />
      <circle cx="5" cy="18" r="1" />
      <path d="M10 18h6" />
    </Icone>
  );
}

export function IconeGrupos() {
  return (
    <Icone>
      <circle cx="9" cy="9" r="4.5" />
      <circle cx="15" cy="9" r="4.5" />
      <circle cx="12" cy="15" r="4.5" />
    </Icone>
  );
}

export function IconeAmigos() {
  return (
    <Icone>
      <circle cx="7.5" cy="8" r="3" />
      <path d="M2.5 19c0-3 2.2-5 5-5s5 2 5 5" />
      <circle cx="16.5" cy="8" r="3" />
      <path d="M11.5 19c0-3 2.2-5 5-5s5 2 5 5" />
    </Icone>
  );
}
