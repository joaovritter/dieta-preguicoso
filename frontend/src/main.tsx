import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/base.css';
import './styles/home.css';
import './styles/forms.css';
import './styles/overlay.css';

const raiz = document.getElementById('root');
if (raiz === null) throw new Error('elemento #root não encontrado');

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
