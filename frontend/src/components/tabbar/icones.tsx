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

export function IconeInicio() {
  return (
    <Icone>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9h12v-9" />
    </Icone>
  );
}

export function IconeSocial() {
  return (
    <Icone>
      <circle cx="9" cy="9" r="3" />
      <circle cx="16.5" cy="10" r="2.4" />
      <path d="M3.5 20c0-3.3 2.6-5.6 5.5-5.6s5.5 2.3 5.5 5.6" />
      <path d="M15 14.7c2.4.4 4 2.3 4 5.3" />
    </Icone>
  );
}

export function IconeCalendario() {
  return (
    <Icone>
      <rect x="4" y="5" width="16" height="15" rx="2.6" />
      <path d="M4 9.5h16" />
      <path d="M8 3v4M16 3v4" />
    </Icone>
  );
}

export function IconePerfil() {
  return (
    <Icone>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </Icone>
  );
}

export function IconeMais() {
  return (
    <Icone tamanho={22} traco={2.1}>
      <path d="M12 5v14M5 12h14" />
    </Icone>
  );
}
