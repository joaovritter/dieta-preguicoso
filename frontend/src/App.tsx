import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import { AuthProvider } from './auth/AuthContext';
import { useAuth } from './auth/useAuth';
import Login from './pages/Login';
import Home from './pages/Home';
import PerfilPage from './pages/Perfil';

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
