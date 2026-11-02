import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import http from '../../api/http.js';
import { formatDataHora, formatMoeda, formatQuantidade, formatCNPJ, formatStatus, corStatus } from '../../utils/format.js';

export default function LoteRastreio() {
  const { id } = useParams();
  const [rastreio, setRastreio] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    http.get(`/api/lotes/${id}/rastreio`)
      .then(({ data }) => setRastreio(data))
      .catch((err) => setErro(err.response?.data?.erro ?? 'Erro ao carregar rastreio'))
      .finally(() => setCarregando(false));
  }, [id]);

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="d-flex align-items-center gap-2 mb-3">
        <Link to="/lotes" className="btn btn-outline-secondary btn-sm">&larr; Voltar</Link>
        <h2 className="h5 fw-bold mb-0">Rastreio do lote #{id}</h2>
      </div>

      {erro && <div className="alert alert-danger">{erro}</div>}
      {carregando && <div className="text-muted">Carregando...</div>}

      {rastreio && (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Cliente</th>
                  <th>CNPJ</th>
                  <th className="text-end">Qtd</th>
                  <th className="text-end">Preço unit.</th>
                </tr>
              </thead>
              <tbody>
                {rastreio.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      Nenhum pedido encontrado para este lote
                    </td>
                  </tr>
                ) : (
                  rastreio.map((r) => (
                    <tr key={r.id_pedido}>
                      <td>
                        <Link to={`/pedidos/${r.id_pedido}`}>#{r.id_pedido}</Link>
                      </td>
                      <td>{formatDataHora(r.data_criacao)}</td>
                      <td>
                        <span className={`badge bg-${corStatus(r.status)}`}>
                          {formatStatus(r.status)}
                        </span>
                      </td>
                      <td>{r.razao_social}</td>
                      <td>{formatCNPJ(r.cnpj)}</td>
                      <td className="text-end">{formatQuantidade(r.quantidade)}</td>
                      <td className="text-end">{formatMoeda(r.preco_unitario)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="card-footer bg-white text-muted small">
            {rastreio.length} pedido(s) encontrado(s)
          </div>
        </div>
      )}
    </div>
  );
}
