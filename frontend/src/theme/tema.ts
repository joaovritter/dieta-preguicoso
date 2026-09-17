import { createTheme } from '@mui/material/styles';
import type { PaletteOptions, Theme } from '@mui/material/styles';

const claro = {
  fundo: '#FFFFFF',
  texto: '#14120F',
  mudo: '#63635D',
  fraco: '#B8B4AA',
  linha: '#F0EEE9',
  borda: '#E6E4DF',
  cartao: '#F7F6F3',
  meta: '#0CA85D',
  sobrou: '#2B87E3',
  passou: '#FF2146',
  vazio: '#E6E4DF',
  carbo: '#2B87E3',
  proteina: '#9F43CC',
  gordura: '#EBA10F',
  rosa: '#D6457A',
};

const escuro = {
  fundo: '#0d0f12',
  texto: '#e7eaee',
  mudo: '#8a919d',
  fraco: '#525a66',
  linha: '#262b34',
  borda: '#262b34',
  cartao: '#15181d',
  meta: '#3fa87c',
  sobrou: '#4B93D6',
  passou: '#e5837a',
  vazio: '#33383f',
  carbo: '#4B93D6',
  proteina: '#A06BC4',
  gordura: '#D99B2E',
  rosa: '#D98AA8',
};

const paletaClara: PaletteOptions = {
  background: { default: claro.fundo, paper: claro.fundo },
  text: { primary: claro.texto, secondary: claro.mudo },
  divider: claro.linha,
  primary: { main: '#0B7A46', dark: '#096338', contrastText: '#FFFFFF', vivo: '#0CA85D' },
  error: { main: '#FF2146' },
  neutro: { fraco: claro.fraco, linha: claro.linha, borda: claro.borda, cartao: claro.cartao },
  status: { meta: claro.meta, sobrou: claro.sobrou, passou: claro.passou, vazio: claro.vazio },
  pilula: {
    meta: { bg: '#DFF3E8', fg: '#0B7A46' },
    sobrou: { bg: '#E4EEFB', fg: '#1B69B8' },
    passou: { bg: '#FCE4E7', fg: '#C4002A' },
  },
  macro: { carbo: claro.carbo, proteina: claro.proteina, gordura: claro.gordura },
  agua: { gradiente: 'linear-gradient(90deg,#2B87E3,#5AA9F0)', trilha: '#F0EEE9' },
  refeicao: {
    cafe: claro.gordura,
    almoco: claro.sobrou,
    lanche: claro.proteina,
    janta: claro.meta,
    ceia: claro.rosa,
  },
};

const paletaEscura: PaletteOptions = {
  background: { default: escuro.fundo, paper: escuro.cartao },
  text: { primary: escuro.texto, secondary: escuro.mudo },
  divider: escuro.linha,
  primary: { main: '#3fa87c', dark: '#47b989', contrastText: '#07130e', vivo: '#3fa87c' },
  error: { main: '#e5837a' },
  neutro: { fraco: escuro.fraco, linha: escuro.linha, borda: escuro.borda, cartao: escuro.cartao },
  status: { meta: escuro.meta, sobrou: escuro.sobrou, passou: escuro.passou, vazio: escuro.vazio },
  pilula: {
    meta: { bg: '#0e2b1e', fg: '#3fa87c' },
    sobrou: { bg: '#0f1f30', fg: '#4B93D6' },
    passou: { bg: '#2c1416', fg: '#e5837a' },
  },
  macro: { carbo: escuro.carbo, proteina: escuro.proteina, gordura: escuro.gordura },
  agua: { gradiente: 'linear-gradient(90deg,#4B93D6,#79B7EF)', trilha: '#262b34' },
  refeicao: {
    cafe: escuro.gordura,
    almoco: escuro.sobrou,
    lanche: escuro.proteina,
    janta: escuro.meta,
    ceia: escuro.rosa,
  },
};

export const tema = createTheme({
  // O mesmo atributo é gravado pelo script inline do index.html antes do React montar.
  cssVariables: { colorSchemeSelector: '[data-esquema="%s"]' },
  colorSchemes: {
    light: { palette: paletaClara },
    dark: { palette: paletaEscura },
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans Variable', system-ui, sans-serif",
  },
  shape: { borderRadius: 12 },
});

export function paleta(theme: Theme): Theme['palette'] {
  return (theme.vars ?? theme).palette as Theme['palette'];
}
