import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import { AuthProvider } from './auth/AuthContext';
import { useAuth } from './auth/useAuth';
import Login from './pages/Login';
import Home from './pages/Home';
import PerfilPage from './pages/Perfil';
import Amigos from './pages/Amigos';
import Grupos from './pages/Grupos';
import GrupoPage from './pages/Grupo';
import PerfilPublico from './pages/PerfilPublico';

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
        path="/"
        element={
          <Protegida>
            <Home />
          </Protegida>
        }
      />
      <Route
        path="/perfil"
        element={
          <Protegida>
            <PerfilPage />
          </Protegida>
        }
      />
      <Route
        path="/amigos"
        element={
          <Protegida>
            <Amigos />
          </Protegida>
        }
      />
      <Route
        path="/grupos"
        element={
          <Protegida>
            <Grupos />
          </Protegida>
        }
      />
      <Route
        path="/grupos/:id"
        element={
          <Protegida>
            <GrupoPage />
          </Protegida>
        }
      />
      <Route
        path="/u/:id"
        element={
          <Protegida>
            <PerfilPublico />
          </Protegida>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Rotas />
      </BrowserRouter>
    </AuthProvider>
  );
}
