import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import http from '../../api/http.js';
import Paginacao from '../../components/Paginacao.jsx';
import { formatMoeda, formatQuantidade } from '../../utils/format.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function ProdutosList() {
  const [dados, setDados] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState('');
  const [buscaInput, setBuscaInput] = useState('');
  const limite = 20;
  const { perfil, registrarReconexao } = useAuth();

  const carregar = useCallback(async () => {
    const params = { pagina, limite };
    if (busca) params.busca = busca;
    const { data } = await http.get('/api/produtos', { params });
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
        <h2 className="h5 fw-bold mb-0">Produtos</h2>
        {perfil === 'admin' && (
          <Link to="/produtos/novo" className="btn btn-primary btn-sm">
            Novo produto
          </Link>
        )}
      </div>

      <form className="d-flex gap-2 mb-3" onSubmit={pesquisar}>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Buscar por nome ou categoria"
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
                <th>Nome</th>
                <th>Categoria</th>
                <th>Unidade</th>
                <th>Preço unit.</th>
                <th>Estoque mín.</th>
                <th>Situação</th>
                {perfil === 'admin' && <th></th>}
              </tr>
            </thead>
            <tbody>
              {dados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                dados.map((p) => (
                  <tr key={p.id_produto}>
                    <td>{p.nome}</td>
                    <td>{p.categoria ?? '—'}</td>
                    <td>{p.unidade}</td>
                    <td>{formatMoeda(p.preco_unitario)}</td>
                    <td>{formatQuantidade(p.estoque_minimo)}</td>
                    <td>
                      <span className={`badge ${p.ativo ? 'bg-success' : 'bg-secondary'}`}>
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    {perfil === 'admin' && (
                      <td>
                        <Link to={`/produtos/${p.id_produto}/editar`} className="btn btn-outline-primary btn-sm">
                          Editar
                        </Link>
                      </td>
                    )}
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
