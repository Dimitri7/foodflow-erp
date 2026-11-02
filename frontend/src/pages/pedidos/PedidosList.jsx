import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import http from '../../api/http.js';
import Paginacao from '../../components/Paginacao.jsx';
import { formatDataHora, formatMoeda, formatStatus, corStatus } from '../../utils/format.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

const STATUS_OPCOES = [
  { value: '', label: 'Todos' },
  { value: 'aguardando_separacao', label: 'Aguardando separação' },
  { value: 'em_separacao', label: 'Em separação' },
  { value: 'separado', label: 'Separado' },
  { value: 'expedido', label: 'Expedido' },
  { value: 'cancelado', label: 'Cancelado' },
];

export default function PedidosList() {
  const [dados, setDados] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState('');
  const [buscaInput, setBuscaInput] = useState('');
  const [status, setStatus] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const limite = 20;
  const { perfil, socket, registrarReconexao } = useAuth();

  const carregar = useCallback(async () => {
    const params = { pagina, limite };
    if (busca) params.busca = busca;
    if (status) params.status = status;
    if (dataInicio) params.dataInicio = dataInicio;
    if (dataFim) params.dataFim = dataFim;
    const { data } = await http.get('/api/pedidos', { params });
    setDados(data.dados);
    setTotal(data.total);
  }, [pagina, busca, status, dataInicio, dataFim]);

  useEffect(() => {
    carregar();
    return registrarReconexao(carregar);
  }, [carregar, registrarReconexao]);

  useEffect(() => {
    if (!socket) return;
    socket.on('pedido:criado', carregar);
    socket.on('pedido:status', carregar);
    return () => {
      socket.off('pedido:criado', carregar);
      socket.off('pedido:status', carregar);
    };
  }, [socket, carregar]);

  function pesquisar(e) {
    e.preventDefault();
    setPagina(1);
    setBusca(buscaInput);
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h5 fw-bold mb-0">Pedidos</h2>
        {perfil === 'vendedor' && (
          <Link to="/pedidos/novo" className="btn btn-primary btn-sm">Novo pedido</Link>
        )}
      </div>

      <div className="d-flex gap-2 mb-3 flex-wrap">
        <form className="d-flex gap-2" onSubmit={pesquisar}>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Buscar por cliente"
            value={buscaInput}
            onChange={(e) => setBuscaInput(e.target.value)}
            style={{ minWidth: 200 }}
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
        <select
          className="form-select form-select-sm"
          style={{ maxWidth: 200 }}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPagina(1); }}
        >
          {STATUS_OPCOES.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input
          type="date"
          className="form-control form-control-sm"
          style={{ maxWidth: 160 }}
          value={dataInicio}
          onChange={(e) => { setDataInicio(e.target.value); setPagina(1); }}
        />
        <input
          type="date"
          className="form-control form-control-sm"
          style={{ maxWidth: 160 }}
          value={dataFim}
          onChange={(e) => { setDataFim(e.target.value); setPagina(1); }}
        />
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                {perfil !== 'vendedor' && <th>Vendedor</th>}
                <th>Data</th>
                <th>Status</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {dados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    Nenhum pedido encontrado
                  </td>
                </tr>
              ) : (
                dados.map((p) => (
                  <tr key={p.id_pedido}>
                    <td>#{p.id_pedido}</td>
                    <td>{p.razao_social}</td>
                    {perfil !== 'vendedor' && <td>{p.nome_vendedor}</td>}
                    <td>{formatDataHora(p.data_criacao)}</td>
                    <td>
                      <span className={`badge bg-${corStatus(p.status)}`}>
                        {formatStatus(p.status)}
                      </span>
                    </td>
                    <td>{formatMoeda(p.valor_total)}</td>
                    <td>
                      <Link to={`/pedidos/${p.id_pedido}`} className="btn btn-outline-primary btn-sm">
                        Ver
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
