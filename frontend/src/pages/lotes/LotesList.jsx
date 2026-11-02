import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import http from '../../api/http.js';
import Paginacao from '../../components/Paginacao.jsx';
import { formatData, formatQuantidade } from '../../utils/format.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

const DIAS_ALERTA = Number(import.meta.env.VITE_DIAS_ALERTA_VENCIMENTO ?? 30);

function badgeLote(lote) {
  if (lote.vencido) return <span className="badge badge-vencido text-white">Vencido</span>;
  const diasRestantes = Math.ceil(
    (new Date(lote.data_validade) - new Date()) / (1000 * 60 * 60 * 24)
  );
  if (diasRestantes <= DIAS_ALERTA) {
    return <span className="badge badge-proximo text-white">Vence em {diasRestantes}d</span>;
  }
  return <span className="badge bg-success">OK</span>;
}

export default function LotesList() {
  const [dados, setDados] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState('');
  const [buscaInput, setBuscaInput] = useState('');
  const limite = 20;
  const { registrarReconexao, socket } = useAuth();

  const carregar = useCallback(async () => {
    const params = { pagina, limite };
    if (busca) params.busca = busca;
    const { data } = await http.get('/api/lotes', { params });
    setDados(data.dados);
    setTotal(data.total);
  }, [pagina, busca]);

  useEffect(() => {
    carregar();
    return registrarReconexao(carregar);
  }, [carregar, registrarReconexao]);

  useEffect(() => {
    if (!socket) return;
    socket.on('estoque:atualizado', carregar);
    return () => socket.off('estoque:atualizado', carregar);
  }, [socket, carregar]);

  function pesquisar(e) {
    e.preventDefault();
    setPagina(1);
    setBusca(buscaInput);
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h5 fw-bold mb-0">Lotes</h2>
        <Link to="/lotes/novo" className="btn btn-primary btn-sm">Novo lote</Link>
      </div>

      <form className="d-flex gap-2 mb-3" onSubmit={pesquisar}>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Buscar por código do lote ou produto"
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
                <th>Código</th>
                <th>Produto</th>
                <th>Validade</th>
                <th>Qtd. disponível</th>
                <th>Entrada</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {dados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    Nenhum lote encontrado
                  </td>
                </tr>
              ) : (
                dados.map((l) => (
                  <tr key={l.id_lote} className={l.vencido ? 'table-danger' : ''}>
                    <td>{l.codigo_lote}</td>
                    <td>{l.nome_produto}</td>
                    <td>{formatData(l.data_validade)}</td>
                    <td>{formatQuantidade(l.quantidade_disponivel)}</td>
                    <td>{formatData(l.data_entrada)}</td>
                    <td>{badgeLote(l)}</td>
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
