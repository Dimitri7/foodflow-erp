import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import http from '../api/http.js';

export default function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [novaSenha, setNovaSenha] = useState('');
  const [redefinido, setRedefinido] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await http.post('/api/auth/redefinir-senha', { token, novaSenha });
      setRedefinido(true);
    } catch (err) {
      setErro(err.response?.data?.erro ?? 'Erro ao conectar ao servidor. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  if (!token) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
          <div className="card shadow-lg border-0">
            <div className="card-body p-4">
              <div className="alert alert-danger py-2">Link inválido ou incompleto.</div>
              <div className="text-center mt-3">
                <Link to="/login" className="small text-muted">Voltar ao login</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="card shadow-lg border-0">
          <div className="card-body p-4">
            <h1 className="h4 fw-bold mb-1" style={{ color: '#1b4332' }}>Nova senha</h1>
            <p className="text-muted small mb-4">Escolha uma senha com ao menos 8 caracteres</p>

            {erro && <div className="alert alert-danger py-2">{erro}</div>}

            {redefinido ? (
              <>
                <div className="alert alert-success py-2">Senha redefinida com sucesso.</div>
                <div className="text-center mt-3">
                  <Link to="/login" className="small text-muted">Ir para o login</Link>
                </div>
              </>
            ) : (
              <form onSubmit={enviar}>
                <div className="mb-4">
                  <label className="form-label">Nova senha</label>
                  <input
                    type="password"
                    className="form-control"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    minLength={8}
                    required
                    autoFocus
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={carregando}>
                  {carregando ? 'Salvando...' : 'Redefinir senha'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
