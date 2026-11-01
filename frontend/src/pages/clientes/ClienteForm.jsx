import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import http from '../../api/http.js';
import { formatCNPJ } from '../../utils/format.js';

export default function ClienteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editando = Boolean(id);

  const [form, setForm] = useState({
    razaoSocial: '',
    cnpj: '',
    telefone: '',
    endereco: '',
  });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!editando) return;
    http.get(`/api/clientes/${id}`).then(({ data }) => {
      setForm({
        razaoSocial: data.razao_social,
        cnpj: formatCNPJ(data.cnpj),
        telefone: data.telefone ?? '',
        endereco: data.endereco ?? '',
      });
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
      if (editando) {
        await http.put(`/api/clientes/${id}`, form);
        setSucesso('Cliente atualizado com sucesso.');
      } else {
        await http.post('/api/clientes', form);
        setSucesso('Cliente cadastrado com sucesso.');
        setForm({ razaoSocial: '', cnpj: '', telefone: '', endereco: '' });
      }
    } catch (err) {
      setErro(err.response?.data?.erro ?? 'Erro ao salvar');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="d-flex align-items-center gap-2 mb-3">
        <Link to="/clientes" className="btn btn-outline-secondary btn-sm">
          &larr; Voltar
        </Link>
        <h2 className="h5 fw-bold mb-0">{editando ? 'Editar cliente' : 'Novo cliente'}</h2>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          {erro && <div className="alert alert-danger">{erro}</div>}
          {sucesso && <div className="alert alert-success">{sucesso}</div>}

          <form onSubmit={enviar}>
            <div className="mb-3">
              <label className="form-label">Razão social *</label>
              <input
                name="razaoSocial"
                className="form-control"
                value={form.razaoSocial}
                onChange={mudar}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">CNPJ *</label>
              <input
                name="cnpj"
                className="form-control"
                value={form.cnpj}
                onChange={mudar}
                placeholder="00.000.000/0000-00"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Telefone</label>
              <input
                name="telefone"
                className="form-control"
                value={form.telefone}
                onChange={mudar}
              />
            </div>
            <div className="mb-4">
              <label className="form-label">Endereço</label>
              <input
                name="endereco"
                className="form-control"
                value={form.endereco}
                onChange={mudar}
              />
            </div>
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={carregando}>
                {carregando ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate('/clientes')}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
