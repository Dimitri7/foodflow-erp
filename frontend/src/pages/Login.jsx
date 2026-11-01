import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await login(email, senha);
      navigate('/');
    } catch (err) {
      setErro(err.response?.data?.erro ?? 'Erro ao conectar ao servidor');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="card shadow-lg border-0">
          <div className="card-body p-4">
            <h1 className="h4 fw-bold mb-1" style={{ color: '#1b4332' }}>FoodFlow ERP</h1>
            <p className="text-muted small mb-4">Sistema de distribuição de alimentos</p>

            {erro && <div className="alert alert-danger py-2">{erro}</div>}

            <form onSubmit={enviar}>
              <div className="mb-3">
                <label className="form-label">E-mail</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label className="form-label">Senha</label>
                <input
                  type="password"
                  className="form-control"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={carregando}>
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
