import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import http from '../../api/http.js';

export default function LoteForm() {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState([]);
  const [form, setForm] = useState({
    idProduto: '',
    codigoLote: '',
    dataValidade: '',
    quantidadeDisponivel: '',
    dataEntrada: '',
  });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    http.get('/api/produtos', { params: { limite: 100 } }).then(({ data }) => {
      setProdutos(data.dados.filter((p) => p.ativo));
    });
  }, []);

  function mudar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setCarregando(true);
    try {
      const payload = {
        idProduto: Number(form.idProduto),
        codigoLote: form.codigoLote,
        dataValidade: form.dataValidade,
        quantidadeDisponivel: parseFloat(form.quantidadeDisponivel),
        ...(form.dataEntrada ? { dataEntrada: form.dataEntrada } : {}),
      };
      await http.post('/api/lotes', payload);
      setSucesso('Lote cadastrado com sucesso.');
      setForm({ idProduto: '', codigoLote: '', dataValidade: '', quantidadeDisponivel: '', dataEntrada: '' });
    } catch (err) {
      setErro(err.response?.data?.erro ?? 'Erro ao salvar');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <div className="d-flex align-items-center gap-2 mb-3">
        <Link to="/lotes" className="btn btn-outline-secondary btn-sm">&larr; Voltar</Link>
        <h2 className="h5 fw-bold mb-0">Novo lote</h2>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          {erro && <div className="alert alert-danger">{erro}</div>}
          {sucesso && <div className="alert alert-success">{sucesso}</div>}

          <form onSubmit={enviar}>
            <div className="mb-3">
              <label className="form-label">Produto *</label>
              <select name="idProduto" className="form-select" value={form.idProduto} onChange={mudar} required>
                <option value="">Selecione...</option>
                {produtos.map((p) => (
                  <option key={p.id_produto} value={p.id_produto}>{p.nome}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Código do lote *</label>
              <input name="codigoLote" className="form-control" value={form.codigoLote} onChange={mudar} required />
            </div>
            <div className="row mb-3">
              <div className="col">
                <label className="form-label">Data de validade *</label>
                <input
                  name="dataValidade"
                  type="date"
                  className="form-control"
                  value={form.dataValidade}
                  onChange={mudar}
                  required
                />
              </div>
              <div className="col">
                <label className="form-label">Data de entrada</label>
                <input
                  name="dataEntrada"
                  type="date"
                  className="form-control"
                  value={form.dataEntrada}
                  onChange={mudar}
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label">Quantidade *</label>
              <input
                name="quantidadeDisponivel"
                type="number"
                step="1"
                min="1"
                className="form-control"
                value={form.quantidadeDisponivel}
                onChange={mudar}
                required
              />
            </div>
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={carregando}>
                {carregando ? 'Salvando...' : 'Salvar'}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/lotes')}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
