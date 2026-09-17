export type IdAba = 'inicio' | 'social' | 'calendario' | 'perfil';

export const ROTA_DA_ABA: Record<IdAba, string> = {
  inicio: '/',
  social: '/social',
  calendario: '/calendario',
  perfil: '/perfil',
};

const dentroDe = (caminho: string, base: string) => caminho === base || caminho.startsWith(`${base}/`);

export function abaDaRota(caminho: string): IdAba | null {
  if (caminho === '/') return 'inicio';
  if (dentroDe(caminho, '/social') || caminho.startsWith('/grupos/') || caminho.startsWith('/u/')) return 'social';
  if (dentroDe(caminho, '/calendario')) return 'calendario';
  if (dentroDe(caminho, '/perfil')) return 'perfil';
  return null;
}

export function ehIdAba(valor: string): valor is IdAba {
  return valor in ROTA_DA_ABA;
}
