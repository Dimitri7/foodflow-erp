import { useState } from 'react';
import { Link } from 'react-router-dom';
import http from '../api/http.js';

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await http.post('/api/auth/recuperar-senha', { email });
      setEnviado(true);
    } catch {
      setErro('Erro ao conectar ao servidor. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="card shadow-lg border-0">
          <div className="card-body p-4">
            <h1 className="h4 fw-bold mb-1" style={{ color: '#1b4332' }}>Recuperar senha</h1>
            <p className="text-muted small mb-4">Informe seu e-mail para receber as instruções</p>

            {erro && <div className="alert alert-danger py-2">{erro}</div>}

            {enviado ? (
              <div className="alert alert-success py-2">
                Se o e-mail estiver cadastrado, você receberá as instruções em breve.
              </div>
            ) : (
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
                <button type="submit" className="btn btn-primary w-100" disabled={carregando}>
                  {carregando ? 'Enviando...' : 'Enviar instruções'}
                </button>
              </form>
            )}

            <div className="text-center mt-3">
              <Link to="/login" className="small text-muted">Voltar ao login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
