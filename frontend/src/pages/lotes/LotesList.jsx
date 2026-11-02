import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const [situacao, setSituacao] = useState('');
  const [modalAjuste, setModalAjuste] = useState(false);
  const [loteAjuste, setLoteAjuste] = useState(null);
  const [ajusteQtd, setAjusteQtd] = useState('');
  const [ajusteJust, setAjusteJust] = useState('');
  const [erroAjuste, setErroAjuste] = useState('');
  const [justInvalida, setJustInvalida] = useState(false);
  const [salvandoAjuste, setSalvandoAjuste] = useState(false);
  const limite = 20;
  const { perfil, registrarReconexao, socket } = useAuth();
  const navigate = useNavigate();

  const carregar = useCallback(async () => {
    const params = { pagina, limite };
    if (busca) params.busca = busca;
    if (situacao) params.situacao = situacao;
    const { data } = await http.get('/api/lotes', { params });
    setDados(data.dados);
    setTotal(data.total);
  }, [pagina, busca, situacao]);

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

  async function salvarAjuste() {
    if (!ajusteJust || ajusteJust.trim().length < 10) {
      setJustInvalida(true); return;
    }
    setErroAjuste(''); setSalvandoAjuste(true);
    try {
      await http.put(`/api/lotes/${loteAjuste.id_lote}/ajuste`, {
        quantidade: Number(ajusteQtd), justificativa: ajusteJust.trim(),
      });
      setModalAjuste(false); setLoteAjuste(null); setAjusteQtd(''); setAjusteJust(''); setJustInvalida(false);
      await carregar();
    } catch (err) {
      setErroAjuste(err.response?.data?.erro ?? 'Erro ao ajustar estoque');
    } finally { setSalvandoAjuste(false); }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h5 fw-bold mb-0">Lotes</h2>
        <Link to="/lotes/novo" className="btn btn-primary btn-sm">Novo lote</Link>
      </div>

      <div className="btn-group mb-3">
        {[
          { key: '', label: 'Todos' },
          { key: 'vencendo', label: 'Vencendo' },
          { key: 'vencido', label: 'Vencidos' },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`btn btn-sm ${situacao === key ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => { setSituacao(key); setPagina(1); }}
          >
            {label}
          </button>
        ))}
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
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {dados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
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
                    <td className="d-flex gap-1">
                      {(perfil === 'admin' || perfil === 'operador') && (
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => {
                            setLoteAjuste({ id_lote: l.id_lote, codigo_lote: l.codigo_lote });
                            setAjusteQtd(String(l.quantidade_disponivel));
                            setAjusteJust(''); setErroAjuste(''); setModalAjuste(true);
                          }}
                        >
                          Ajustar
                        </button>
                      )}
                      {perfil === 'admin' && (
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => navigate(`/lotes/${l.id_lote}/rastreio`)}
                        >
                          Rastrear
                        </button>
                      )}
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

      {modalAjuste && loteAjuste && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Ajustar estoque — {loteAjuste.codigo_lote}</h5>
                <button type="button" className="btn-close" onClick={() => { setModalAjuste(false); setJustInvalida(false); }} />
              </div>
              <div className="modal-body">
                {erroAjuste && <div className="alert alert-danger py-2">{erroAjuste}</div>}
                <div className="mb-3">
                  <label className="form-label">Nova quantidade *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    className="form-control"
                    value={ajusteQtd}
                    onChange={(e) => setAjusteQtd(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Justificativa *</label>
                  <textarea
                    className={`form-control${justInvalida ? ' is-invalid' : ''}`}
                    rows={3}
                    value={ajusteJust}
                    onChange={(e) => { setAjusteJust(e.target.value); setJustInvalida(false); }}
                    placeholder="Descreva o motivo do ajuste..."
                  />
                  <div className="invalid-feedback">Mínimo de 10 caracteres.</div>
                  <div className="form-text">Mínimo de 10 caracteres.</div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => { setModalAjuste(false); setJustInvalida(false); }}
                  disabled={salvandoAjuste}
                >
                  Fechar
                </button>
                <button className="btn btn-primary" onClick={salvarAjuste} disabled={salvandoAjuste}>
                  {salvandoAjuste ? 'Salvando...' : 'Salvar ajuste'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {modalAjuste && <div className="modal-backdrop show" />}
    </div>
  );
}
