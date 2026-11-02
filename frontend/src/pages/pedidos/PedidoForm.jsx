import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import http from '../../api/http.js';
import { formatData, formatMoeda, formatQuantidade } from '../../utils/format.js';

export default function PedidoForm() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [idCliente, setIdCliente] = useState('');
  const [itens, setItens] = useState([{ idProduto: '', quantidade: '', previa: null }]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    http.get('/api/clientes', { params: { limite: 200 } }).then(({ data }) =>
      setClientes(data.dados.filter((c) => c.ativo))
    );
    http.get('/api/produtos', { params: { limite: 200 } }).then(({ data }) =>
      setProdutos(data.dados.filter((p) => p.ativo))
    );
  }, []);

  function adicionarItem() {
    setItens([...itens, { idProduto: '', quantidade: '', previa: null }]);
  }

  function removerItem(idx) {
    setItens(itens.filter((_, i) => i !== idx));
  }

  function mudarItem(idx, campo, valor) {
    const novos = itens.map((item, i) =>
      i === idx ? { ...item, [campo]: valor, previa: campo === 'idProduto' ? null : item.previa } : item
    );
    setItens(novos);
  }

  async function buscarPrevia(idx) {
    const item = itens[idx];
    if (!item.idProduto || !item.quantidade || Number(item.quantidade) <= 0) return;
    try {
      const { data } = await http.get(`/api/estoque/${item.idProduto}/previa`, {
        params: { quantidade: item.quantidade },
      });
      const novos = itens.map((it, i) => (i === idx ? { ...it, previa: data } : it));
      setItens(novos);
    } catch (err) {
      const novos = itens.map((it, i) =>
        i === idx ? { ...it, previa: { erro: err.response?.data?.erro ?? 'Saldo insuficiente' } } : it
      );
      setItens(novos);
    }
  }

  function totalEstimado() {
    let total = 0;
    for (const item of itens) {
      const produto = produtos.find((p) => String(p.id_produto) === String(item.idProduto));
      if (produto && item.quantidade) {
        total += produto.preco_unitario * Number(item.quantidade);
      }
    }
    return total;
  }

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const payload = {
        idCliente: Number(idCliente),
        itens: itens
          .filter((i) => i.idProduto && i.quantidade)
          .map((i) => ({ idProduto: Number(i.idProduto), quantidade: Number(i.quantidade) })),
      };
      const { data } = await http.post('/api/pedidos', payload);
      navigate(`/pedidos/${data.id_pedido}`);
    } catch (err) {
      setErro(err.response?.data?.erro ?? 'Erro ao criar pedido');
      setCarregando(false);
    }
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="d-flex align-items-center gap-2 mb-3">
        <Link to="/pedidos" className="btn btn-outline-secondary btn-sm">&larr; Voltar</Link>
        <h2 className="h5 fw-bold mb-0">Novo pedido</h2>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          {erro && <div className="alert alert-danger">{erro}</div>}

          <form onSubmit={enviar}>
            <div className="mb-4">
              <label className="form-label">Cliente *</label>
              <select
                className="form-select"
                value={idCliente}
                onChange={(e) => setIdCliente(e.target.value)}
                required
              >
                <option value="">Selecione o cliente...</option>
                {clientes.map((c) => (
                  <option key={c.id_cliente} value={c.id_cliente}>{c.razao_social}</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Itens do pedido</label>
              {itens.map((item, idx) => (
                <div key={idx} className="border rounded p-3 mb-3 bg-light">
                  <div className="row g-2 align-items-end">
                    <div className="col-6">
                      <label className="form-label small">Produto *</label>
                      <select
                        className="form-select form-select-sm"
                        value={item.idProduto}
                        onChange={(e) => mudarItem(idx, 'idProduto', e.target.value)}
                        required
                      >
                        <option value="">Selecione...</option>
                        {produtos.map((p) => (
                          <option key={p.id_produto} value={p.id_produto}>{p.nome}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-4">
                      <label className="form-label small">Quantidade *</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="form-control form-control-sm"
                        value={item.quantidade}
                        onChange={(e) => mudarItem(idx, 'quantidade', e.target.value)}
                        onBlur={() => buscarPrevia(idx)}
                        required
                      />
                    </div>
                    <div className="col-2 text-end">
                      {itens.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removerItem(idx)}
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  </div>

                  {item.previa && !item.previa.erro && (
                    <div className="mt-2">
                      <small className="text-muted fw-semibold">Distribuição FEFO:</small>
                      <table className="table table-sm table-bordered mb-0 mt-1" style={{ fontSize: '0.8rem' }}>
                        <thead className="table-light">
                          <tr>
                            <th>Lote</th>
                            <th>Validade</th>
                            <th>Qtd</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.previa.distribuicao.map((d) => (
                            <tr key={d.idLote}>
                              <td>{d.codigoLote}</td>
                              <td>{formatData(d.dataValidade)}</td>
                              <td>{formatQuantidade(d.quantidade)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {item.previa?.erro && (
                    <div className="mt-2 text-danger small">{item.previa.erro}</div>
                  )}
                </div>
              ))}

              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={adicionarItem}>
                + Adicionar produto
              </button>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3 pt-2 border-top">
              <span className="text-muted small">Total estimado</span>
              <strong>{formatMoeda(totalEstimado())}</strong>
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={carregando}>
                {carregando ? 'Confirmando...' : 'Confirmar pedido'}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/pedidos')}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
