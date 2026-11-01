import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function RotaProtegida({ perfisPermitidos, children }) {
  const { token, perfil } = useAuth();

  if (!token) return <Navigate to="/login" replace />;

  if (perfisPermitidos && !perfisPermitidos.includes(perfil)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
