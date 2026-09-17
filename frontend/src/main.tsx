import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import '@fontsource-variable/plus-jakarta-sans/index.css';
import App from './App';
import { tema } from './theme/tema';

const raiz = document.getElementById('root');
if (raiz === null) throw new Error('elemento #root não encontrado');

createRoot(raiz).render(
  <StrictMode>
    <ThemeProvider
      theme={tema}
      defaultMode="system"
      modeStorageKey="dieta.tema"
      disableTransitionOnChange
    >
      <CssBaseline enableColorScheme />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
