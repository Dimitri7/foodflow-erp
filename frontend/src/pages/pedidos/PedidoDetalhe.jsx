import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import http from '../../api/http.js';
import { formatData, formatDataHora, formatMoeda, formatQuantidade, formatStatus, corStatus, formatCNPJ } from '../../utils/format.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

const PROXIMO_STATUS = {
  aguardando_separacao: 'em_separacao',
  em_separacao: 'separado',
  separado: 'expedido',
};

export default function PedidoDetalhe() {
  const { id } = useParams();
  const [pedido, setPedido] = useState(null);
  const [erro, setErro] = useState('');
  const [avancar, setAvancar] = useState(false);
  const [modalCancelar, setModalCancelar] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [cancelando, setCancelando] = useState(false);
  const [erroCancelar, setErroCancelar] = useState('');
  const [motivoInvalido, setMotivoInvalido] = useState(false);
  const { perfil, socket, registrarReconexao } = useAuth();

  const carregar = useCallback(async () => {
    const { data } = await http.get(`/api/pedidos/${id}`);
    setPedido(data);
  }, [id]);

  useEffect(() => {
    carregar();
    return registrarReconexao(carregar);
  }, [carregar, registrarReconexao]);

  useEffect(() => {
    if (!socket) return;
    function atualizar(ev) {
      if (ev.idPedido === Number(id)) carregar();
    }
    socket.on('pedido:status', atualizar);
    return () => socket.off('pedido:status', atualizar);
  }, [socket, id, carregar]);

  async function avancarStatus() {
    if (!pedido) return;
    const novoStatus = PROXIMO_STATUS[pedido.status];
    if (!novoStatus) return;
    setErro('');
    setAvancar(true);
    try {
      await http.patch(`/api/pedidos/${id}/status`, { status: novoStatus });
      await carregar();
    } catch (err) {
      setErro(err.response?.data?.erro ?? 'Erro ao atualizar status');
    } finally {
      setAvancar(false);
    }
  }

  async function cancelarPedido() {
    if (!motivo.trim()) { setMotivoInvalido(true); return; }
    setErroCancelar(''); setCancelando(true);
    try {
      await http.patch(`/api/pedidos/${id}/cancelar`, { motivo: motivo.trim() });
      setModalCancelar(false); setMotivo(''); setMotivoInvalido(false); await carregar();
    } catch (err) {
      setErroCancelar(err.response?.data?.erro ?? 'Erro ao cancelar pedido');
    } finally { setCancelando(false); }
  }

  if (!pedido) return <div className="text-muted">Carregando...</div>;

  const podeAvancar = (perfil === 'operador' || perfil === 'admin') && PROXIMO_STATUS[pedido.status];
  const podeCancelar =
    pedido.status !== 'expedido' &&
    pedido.status !== 'cancelado' &&
    (perfil === 'admin' || perfil === 'vendedor');

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="d-flex align-items-center gap-2 mb-3">
        <Link to="/pedidos" className="btn btn-outline-secondary btn-sm">&larr; Voltar</Link>
        <h2 className="h5 fw-bold mb-0">Pedido #{pedido.id_pedido}</h2>
        <span className={`badge bg-${corStatus(pedido.status)}`}>{formatStatus(pedido.status)}</span>
      </div>

      {erro && <div className="alert alert-danger">{erro}</div>}

      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted small fw-semibold mb-2">CLIENTE</h6>
              <div className="fw-semibold">{pedido.razao_social}</div>
              <div className="text-muted small">{formatCNPJ(pedido.cnpj)}</div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted small fw-semibold mb-2">PEDIDO</h6>
              <div className="small">Vendedor: <strong>{pedido.nome_vendedor}</strong></div>
              <div className="small">Data: <strong>{formatDataHora(pedido.data_criacao)}</strong></div>
              <div className="small">Total: <strong>{formatMoeda(pedido.valor_total)}</strong></div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-header bg-white fw-semibold">Itens</div>
        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Lote</th>
                <th>Validade</th>
                <th className="text-end">Qtd</th>
                <th className="text-end">Preço unit.</th>
                <th className="text-end">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {pedido.itens.map((item) => (
                <tr key={item.id_item}>
                  <td>{item.nome_produto}</td>
                  <td>{item.codigo_lote}</td>
                  <td>{formatData(item.data_validade)}</td>
                  <td className="text-end">{formatQuantidade(item.quantidade)}</td>
                  <td className="text-end">{formatMoeda(item.preco_unitario)}</td>
                  <td className="text-end">{formatMoeda(Number(item.preco_unitario) * Number(item.quantidade))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} className="text-end fw-semibold">Total</td>
                <td className="text-end fw-semibold">{formatMoeda(pedido.valor_total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {pedido.status === 'cancelado' && (pedido.motivo_cancelamento || pedido.data_cancelamento) && (
        <div className="card border-0 shadow-sm mb-3 border-danger">
          <div className="card-header bg-white fw-semibold text-danger">Cancelamento</div>
          <div className="card-body">
            {pedido.motivo_cancelamento && (
              <div className="mb-1">
                <span className="text-muted small">Motivo: </span>{pedido.motivo_cancelamento}
              </div>
            )}
            {pedido.data_cancelamento && (
              <div>
                <span className="text-muted small">Cancelado em: </span>{formatDataHora(pedido.data_cancelamento)}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-header bg-white fw-semibold">Histórico de status</div>
        <ul className="list-group list-group-flush">
          {pedido.historico.map((h) => (
            <li key={h.id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                {h.status_anterior ? (
                  <span>
                    <span className={`badge bg-${corStatus(h.status_anterior)}`}>{formatStatus(h.status_anterior)}</span>
                    {' '}&rarr;{' '}
                    <span className={`badge bg-${corStatus(h.novo_status)}`}>{formatStatus(h.novo_status)}</span>
                  </span>
                ) : (
                  <span className={`badge bg-${corStatus(h.novo_status)}`}>Pedido criado — {formatStatus(h.novo_status)}</span>
                )}
                <span className="text-muted small ms-2">por {h.nome_usuario}</span>
              </div>
              <span className="text-muted small">{formatDataHora(h.data_hora)}</span>
            </li>
          ))}
        </ul>
      </div>

      {podeAvancar && (
        <button className="btn btn-primary" onClick={avancarStatus} disabled={avancar}>
          {avancar ? 'Aguarde...' : `Avançar para: ${formatStatus(PROXIMO_STATUS[pedido.status])}`}
        </button>
      )}
      {podeCancelar && (
        <button
          className="btn btn-outline-danger ms-2"
          onClick={() => { setErroCancelar(''); setMotivo(''); setMotivoInvalido(false); setModalCancelar(true); }}
        >
          Cancelar pedido
        </button>
      )}

      {modalCancelar && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Cancelar pedido #{pedido.id_pedido}</h5>
                <button type="button" className="btn-close" onClick={() => { setModalCancelar(false); setMotivoInvalido(false); }} />
              </div>
              <div className="modal-body">
                {erroCancelar && <div className="alert alert-danger py-2">{erroCancelar}</div>}
                <label className="form-label">Motivo do cancelamento *</label>
                <textarea
                  className={`form-control${motivoInvalido ? ' is-invalid' : ''}`}
                  rows={3}
                  value={motivo}
                  onChange={(e) => { setMotivo(e.target.value); setMotivoInvalido(false); }}
                  placeholder="Informe o motivo..."
                />
                <div className="invalid-feedback">Motivo é obrigatório.</div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => { setModalCancelar(false); setMotivoInvalido(false); }}
                  disabled={cancelando}
                >
                  Fechar
                </button>
                <button className="btn btn-danger" onClick={cancelarPedido} disabled={cancelando}>
                  {cancelando ? 'Cancelando...' : 'Confirmar cancelamento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {modalCancelar && <div className="modal-backdrop show" />}
    </div>
  );
}
