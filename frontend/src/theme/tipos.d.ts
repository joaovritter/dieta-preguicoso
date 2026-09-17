import '@mui/material/styles';

interface CoresPilula {
  bg: string;
  fg: string;
}

interface TokensDieta {
  neutro: { fraco: string; linha: string; borda: string; cartao: string };
  status: { meta: string; sobrou: string; passou: string; vazio: string };
  pilula: { meta: CoresPilula; sobrou: CoresPilula; passou: CoresPilula };
  macro: { carbo: string; proteina: string; gordura: string };
  agua: { gradiente: string; trilha: string };
  refeicao: { cafe: string; almoco: string; lanche: string; janta: string; ceia: string };
}

declare module '@mui/material/styles' {
  interface Palette extends TokensDieta {}
  interface PaletteOptions extends Partial<TokensDieta> {}
  interface PaletteColor {
    vivo?: string;
  }
  interface SimplePaletteColorOptions {
    vivo?: string;
  }
  // MUI 9 só tipa `theme.colorSchemes`/`theme.vars` quando essa flag é ligada via
  // augmentação (ver createThemeNoVars.d.ts). Sem isso, `createTheme` com
  // `cssVariables` continua funcionando em runtime, mas o tipo `Theme` não expõe
  // `colorSchemes`.
  interface CssThemeVariables {
    enabled: true;
  }
}
