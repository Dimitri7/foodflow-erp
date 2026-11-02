import { useState, useEffect, useCallback } from 'react';
import http from '../../api/http.js';
import { formatDataLocal, formatMoeda } from '../../utils/format.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

const COLUNAS = [
  { status: 'aguardando_separacao', titulo: 'Aguardando separação', cor: 'warning' },
  { status: 'em_separacao',        titulo: 'Em separação',          cor: 'info'    },
  { status: 'separado',            titulo: 'Separado',              cor: 'primary' },
  { status: 'expedido',            titulo: 'Expedido',              cor: 'success' },
];

const PROXIMO = {
  aguardando_separacao: 'em_separacao',
  em_separacao: 'separado',
  separado: 'expedido',
};

export default function Expedicao() {
  const [pedidos, setPedidos] = useState([]);
  const [avancarId, setAvancarId] = useState(null);
  const { socket, registrarReconexao } = useAuth();

  const carregar = useCallback(async () => {
    const paginas = await Promise.all(
      COLUNAS.map(({ status }) =>
        http.get('/api/pedidos', { params: { status, limite: 50 } }).then((r) => r.data.dados)
      )
    );
    setPedidos(paginas.flat());
  }, []);

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

  async function avancar(pedido) {
    const novoStatus = PROXIMO[pedido.status];
    if (!novoStatus) return;
    setAvancarId(pedido.id_pedido);
    try {
      await http.patch(`/api/pedidos/${pedido.id_pedido}/status`, { status: novoStatus });
      await carregar();
    } finally {
      setAvancarId(null);
    }
  }

  const porStatus = (status) => pedidos.filter((p) => p.status === status);

  return (
    <div>
      <h2 className="h5 fw-bold mb-3">Painel de Expedição</h2>
      <div className="d-flex gap-3 overflow-auto pb-2" style={{ alignItems: 'flex-start' }}>
        {COLUNAS.map(({ status, titulo, cor }) => (
          <div key={status} className="kanban-col flex-shrink-0">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className={`badge bg-${cor}`}>{porStatus(status).length}</span>
              <span className="fw-semibold small">{titulo}</span>
            </div>
            {porStatus(status).length === 0 && (
              <p className="text-muted small text-center mt-3">Nenhum pedido</p>
            )}
            {porStatus(status).map((p) => (
              <div key={p.id_pedido} className={`kanban-card ${status === 'expedido' ? 'expedido' : ''}`}>
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <strong className="small">#{p.id_pedido}</strong>
                  <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                    {formatDataLocal(p.data_criacao)}
                  </span>
                </div>
                <div className="small text-truncate mb-1" title={p.razao_social}>
                  {p.razao_social}
                </div>
                <div className="text-muted small mb-2">{formatMoeda(p.valor_total)}</div>
                {PROXIMO[p.status] && (
                  <button
                    className="btn btn-sm btn-primary w-100"
                    onClick={() => avancar(p)}
                    disabled={avancarId === p.id_pedido}
                  >
                    {avancarId === p.id_pedido ? '...' : 'Avançar'}
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
