import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import http from '../../api/http.js';

export default function UsuarioForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editando = Boolean(id);

  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    perfil: 'vendedor',
  });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!editando) return;
    http.get(`/api/usuarios/${id}`).then(({ data }) => {
      setForm({ nome: data.nome, email: data.email, senha: '', perfil: data.perfil });
    });
  }, [id, editando]);

  function mudar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setCarregando(true);
    try {
      const payload = { ...form };
      if (editando && !payload.senha) delete payload.senha;
      if (editando) {
        await http.put(`/api/usuarios/${id}`, payload);
        setSucesso('Usuário atualizado com sucesso.');
      } else {
        await http.post('/api/usuarios', payload);
        setSucesso('Usuário cadastrado com sucesso.');
        setForm({ nome: '', email: '', senha: '', perfil: 'vendedor' });
      }
    } catch (err) {
      setErro(err.response?.data?.erro ?? 'Erro ao salvar');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <div className="d-flex align-items-center gap-2 mb-3">
        <Link to="/usuarios" className="btn btn-outline-secondary btn-sm">&larr; Voltar</Link>
        <h2 className="h5 fw-bold mb-0">{editando ? 'Editar usuário' : 'Novo usuário'}</h2>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          {erro && <div className="alert alert-danger">{erro}</div>}
          {sucesso && <div className="alert alert-success">{sucesso}</div>}

          <form onSubmit={enviar}>
            <div className="mb-3">
              <label className="form-label">Nome *</label>
              <input name="nome" className="form-control" value={form.nome} onChange={mudar} required minLength={3} />
            </div>
            <div className="mb-3">
              <label className="form-label">E-mail *</label>
              <input name="email" type="email" className="form-control" value={form.email} onChange={mudar} required />
            </div>
            <div className="mb-3">
              <label className="form-label">{editando ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}</label>
              <input
                name="senha"
                type="password"
                className="form-control"
                value={form.senha}
                onChange={mudar}
                minLength={8}
                required={!editando}
              />
            </div>
            <div className="mb-4">
              <label className="form-label">Perfil *</label>
              <select name="perfil" className="form-select" value={form.perfil} onChange={mudar} required>
                <option value="vendedor">Vendedor</option>
                <option value="operador">Operador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={carregando}>
                {carregando ? 'Salvando...' : 'Salvar'}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/usuarios')}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
