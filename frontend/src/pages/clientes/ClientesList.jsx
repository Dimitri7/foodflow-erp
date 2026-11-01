import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import http from '../../api/http.js';
import Paginacao from '../../components/Paginacao.jsx';
import { formatCNPJ } from '../../utils/format.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function ClientesList() {
  const [dados, setDados] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState('');
  const [buscaInput, setBuscaInput] = useState('');
  const limite = 20;
  const { registrarReconexao } = useAuth();

  const carregar = useCallback(async () => {
    const params = { pagina, limite };
    if (busca) params.busca = busca;
    const { data } = await http.get('/api/clientes', { params });
    setDados(data.dados);
    setTotal(data.total);
  }, [pagina, busca]);

  useEffect(() => {
    carregar();
    return registrarReconexao(carregar);
  }, [carregar, registrarReconexao]);

  function pesquisar(e) {
    e.preventDefault();
    setPagina(1);
    setBusca(buscaInput);
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h5 fw-bold mb-0">Clientes</h2>
        <Link to="/clientes/novo" className="btn btn-primary btn-sm">
          Novo cliente
        </Link>
      </div>

      <form className="d-flex gap-2 mb-3" onSubmit={pesquisar}>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Buscar por razão social ou CNPJ"
          value={buscaInput}
          onChange={(e) => setBuscaInput(e.target.value)}
        />
        <button type="submit" className="btn btn-outline-primary btn-sm">Buscar</button>
        {busca && (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => { setBusca(''); setBuscaInput(''); setPagina(1); }}
          >
            Limpar
          </button>
        )}
      </form>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Razão social</th>
                <th>CNPJ</th>
                <th>Telefone</th>
                <th>Situação</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {dados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              ) : (
                dados.map((c) => (
                  <tr key={c.id_cliente}>
                    <td>{c.razao_social}</td>
                    <td>{formatCNPJ(c.cnpj)}</td>
                    <td>{c.telefone ?? '—'}</td>
                    <td>
                      <span className={`badge ${c.ativo ? 'bg-success' : 'bg-secondary'}`}>
                        {c.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <Link to={`/clientes/${c.id_cliente}/editar`} className="btn btn-outline-primary btn-sm">
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="card-footer d-flex justify-content-between align-items-center bg-white">
          <span className="text-muted small">{total} registro(s)</span>
          <Paginacao pagina={pagina} limite={limite} total={total} onChange={setPagina} />
        </div>
      </div>
    </div>
  );
}
