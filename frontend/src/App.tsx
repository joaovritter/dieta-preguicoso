import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import { AuthProvider } from './auth/AuthContext';
import { useAuth } from './auth/useAuth';
import { RefeicoesProvider } from './lib/RefeicoesContext';
import { CapturaProvider } from './captura/CapturaContext';
import Casca from './layout/Casca';
import Login from './pages/Login';
import Home from './pages/Home';
import PerfilPage from './pages/Perfil';
import GrupoPage from './pages/Grupo';
import PerfilPublico from './pages/PerfilPublico';
import TelaProvisoria from './pages/TelaProvisoria';
import SocialProvisorio from './pages/SocialProvisorio';

function Protegida({ children }: { children: ReactElement }) {
  const { perfil, carregando } = useAuth();
  if (carregando) return <p className="carregando-pagina">carregando...</p>;
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
        <Route path="relatorio" element={<TelaProvisoria titulo="relatório" />} />
        <Route path="calendario" element={<TelaProvisoria titulo="calendário" />} />
        <Route path="social" element={<SocialProvisorio />} />
        <Route path="grupos/:id" element={<GrupoPage />} />
        <Route path="u/:id" element={<PerfilPublico />} />
        <Route path="perfil" element={<PerfilPage />} />
      </Route>

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
