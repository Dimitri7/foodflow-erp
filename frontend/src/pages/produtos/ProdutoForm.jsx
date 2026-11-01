import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import http from '../../api/http.js';

export default function ProdutoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editando = Boolean(id);

  const [form, setForm] = useState({
    nome: '',
    categoria: '',
    unidade: '',
    precoUnitario: '',
    estoqueMinimo: '0',
    ativo: true,
  });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!editando) return;
    http.get(`/api/produtos/${id}`).then(({ data }) => {
      setForm({
        nome: data.nome,
        categoria: data.categoria ?? '',
        unidade: data.unidade,
        precoUnitario: String(data.preco_unitario),
        estoqueMinimo: String(data.estoque_minimo),
        ativo: data.ativo,
      });
    });
  }, [id, editando]);

  function mudar(e) {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  }

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setCarregando(true);
    try {
      const payload = {
        ...form,
        precoUnitario: parseFloat(form.precoUnitario),
        estoqueMinimo: parseFloat(form.estoqueMinimo) || 0,
      };
      if (editando) {
        await http.put(`/api/produtos/${id}`, payload);
        setSucesso('Produto atualizado com sucesso.');
      } else {
        await http.post('/api/produtos', payload);
        setSucesso('Produto cadastrado com sucesso.');
        setForm({ nome: '', categoria: '', unidade: '', precoUnitario: '', estoqueMinimo: '0', ativo: true });
      }
    } catch (err) {
      setErro(err.response?.data?.erro ?? 'Erro ao salvar');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="d-flex align-items-center gap-2 mb-3">
        <Link to="/produtos" className="btn btn-outline-secondary btn-sm">&larr; Voltar</Link>
        <h2 className="h5 fw-bold mb-0">{editando ? 'Editar produto' : 'Novo produto'}</h2>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          {erro && <div className="alert alert-danger">{erro}</div>}
          {sucesso && <div className="alert alert-success">{sucesso}</div>}

          <form onSubmit={enviar}>
            <div className="mb-3">
              <label className="form-label">Nome *</label>
              <input name="nome" className="form-control" value={form.nome} onChange={mudar} required />
            </div>
            <div className="row mb-3">
              <div className="col">
                <label className="form-label">Categoria</label>
                <input name="categoria" className="form-control" value={form.categoria} onChange={mudar} />
              </div>
              <div className="col">
                <label className="form-label">Unidade *</label>
                <input name="unidade" className="form-control" value={form.unidade} onChange={mudar} required />
              </div>
            </div>
            <div className="row mb-3">
              <div className="col">
                <label className="form-label">Preço unitário (R$) *</label>
                <input
                  name="precoUnitario"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control"
                  value={form.precoUnitario}
                  onChange={mudar}
                  required
                />
              </div>
              <div className="col">
                <label className="form-label">Estoque mínimo</label>
                <input
                  name="estoqueMinimo"
                  type="number"
                  step="1"
                  min="0"
                  className="form-control"
                  value={form.estoqueMinimo}
                  onChange={mudar}
                />
              </div>
            </div>
            {editando && (
              <div className="mb-4 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="ativo"
                  name="ativo"
                  checked={form.ativo}
                  onChange={mudar}
                />
                <label className="form-check-label" htmlFor="ativo">Produto ativo</label>
              </div>
            )}
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={carregando}>
                {carregando ? 'Salvando...' : 'Salvar'}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/produtos')}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
