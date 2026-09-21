import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import Typography from '@mui/material/Typography';
import { AuthProvider } from './auth/AuthContext';
import { useAuth } from './auth/useAuth';
import { RefeicoesProvider } from './lib/RefeicoesContext';
import { CapturaProvider } from './captura/CapturaContext';
import Casca from './layout/Casca';
import Login from './pages/Login';
import Home from './pages/Home';
import Relatorio from './pages/Relatorio';
import CalendarioPage from './pages/CalendarioPage';
import PerfilPage from './pages/Perfil';
import ConfiguracoesPage from './pages/Configuracoes';
import GrupoPage from './pages/Grupo';
import PerfilPublico from './pages/PerfilPublico';
import Social from './pages/Social';
import DetalheItemPage from './pages/DetalheItemPage';
import MetasPage from './pages/perfil/MetasPage';
import DadosPage from './pages/perfil/DadosPage';
import RefeicoesPage from './pages/perfil/RefeicoesPage';
import SenhaPage from './pages/perfil/SenhaPage';

function Protegida({ children }: { children: ReactElement }) {
  const { perfil, carregando } = useAuth();
  if (carregando)
    return <Typography sx={{ p: '48px 22px', textAlign: 'center', color: 'text.secondary' }}>carregando...</Typography>;
  if (perfil === null) return <Navigate to="/login" replace />;
  return children;
}

function Rotas() {
  const { perfil, carregando } = useAuth();
  return (
    <Routes>
      <Route
        path="/login"
        element={carregando || perfil === null ? <Login /> : <Navigate to="/" replace />}
      />

      <Route
        element={
          <Protegida>
            <CapturaProvider>
              <Casca />
            </CapturaProvider>
          </Protegida>
        }
      >
        <Route index element={<Home />} />
        <Route path="relatorio" element={<Relatorio />} />
        <Route path="calendario" element={<CalendarioPage />} />
        <Route path="social" element={<Social />} />
        <Route path="grupos/:id" element={<GrupoPage />} />
        <Route path="u/:id" element={<PerfilPublico />} />
        <Route path="perfil" element={<PerfilPage />} />
      </Route>

      <Route
        path="/registros/:id/alimentos/:indice"
        element={
          <Protegida>
            <DetalheItemPage />
          </Protegida>
        }
      />

      <Route path="/configuracoes" element={<Protegida><ConfiguracoesPage /></Protegida>} />
      <Route path="/perfil/metas" element={<Protegida><MetasPage /></Protegida>} />
      <Route path="/perfil/dados" element={<Protegida><DadosPage /></Protegida>} />
      <Route path="/perfil/refeicoes" element={<Protegida><RefeicoesPage /></Protegida>} />
      <Route path="/perfil/senha" element={<Protegida><SenhaPage /></Protegida>} />

      <Route path="/amigos" element={<Navigate to="/social?aba=amigos" replace />} />
      <Route path="/grupos" element={<Navigate to="/social?aba=grupos" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RefeicoesProvider>
        <BrowserRouter>
          <Rotas />
        </BrowserRouter>
      </RefeicoesProvider>
    </AuthProvider>
  );
}
