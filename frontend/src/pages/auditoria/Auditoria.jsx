import { useState, useEffect, useCallback } from 'react';
import http from '../../api/http.js';
import Paginacao from '../../components/Paginacao.jsx';
import { formatDataHora, formatQuantidade } from '../../utils/format.js';

const TABELAS = ['clientes', 'historico_status_pedido', 'lotes', 'pedidos', 'produtos', 'usuarios'];
const limite = 20;

function formatarValor(v) {
  if (typeof v === 'number') return formatQuantidade(v);
  return String(v);
}

function ValorJSON({ valor }) {
  if (valor == null) return <span className="text-muted">—</span>;
  if (typeof valor !== 'object') return <span className="small">{formatarValor(valor)}</span>;
  return (
    <ul className="list-unstyled mb-0 small">
      {Object.entries(valor).map(([k, v]) => (
        <li key={k}><span className="text-muted">{k}:</span> {formatarValor(v)}</li>
      ))}
    </ul>
  );
}

export default function Auditoria() {
  const [dados, setDados] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [erro, setErro] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [idUsuario, setIdUsuario] = useState('');
  const [tabela, setTabela] = useState('');
  const [acao, setAcao] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    http.get('/api/usuarios', { params: { limite: 200 } })
      .then(({ data }) => setUsuarios(data.dados))
      .catch(() => {});
  }, []);

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const params = { pagina, limite };
      if (idUsuario) params.idUsuario = idUsuario;
      if (tabela) params.tabela = tabela;
      if (acao) params.acao = acao;
      if (dataInicio) params.dataInicio = dataInicio;
      if (dataFim) params.dataFim = dataFim;
      const { data } = await http.get('/api/auditoria', { params });
      setDados(data.dados);
      setTotal(data.total);
    } catch (err) {
      setErro(err.response?.data?.erro ?? 'Erro ao carregar auditoria');
    }
  }, [pagina, idUsuario, tabela, acao, dataInicio, dataFim]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <div>
      <h2 className="h5 fw-bold mb-3">Auditoria</h2>

      <div className="d-flex gap-2 mb-3 flex-wrap align-items-end">
        <div>
          <label className="form-label small mb-1">Usuário</label>
          <select
            className="form-select form-select-sm"
            style={{ minWidth: 160 }}
            value={idUsuario}
            onChange={(e) => { setIdUsuario(e.target.value); setPagina(1); }}
          >
            <option value="">Todos</option>
            {usuarios.map((u) => (
              <option key={u.id_usuario} value={u.id_usuario}>{u.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label small mb-1">Tabela</label>
          <select
            className="form-select form-select-sm"
            style={{ minWidth: 160 }}
            value={tabela}
            onChange={(e) => { setTabela(e.target.value); setPagina(1); }}
          >
            <option value="">Todas</option>
            {TABELAS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label small mb-1">Ação</label>
          <select
            className="form-select form-select-sm"
            style={{ minWidth: 120 }}
            value={acao}
            onChange={(e) => { setAcao(e.target.value); setPagina(1); }}
          >
            <option value="">Todas</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
          </select>
        </div>
        <div>
          <label className="form-label small mb-1">De</label>
          <input
            type="date"
            className="form-control form-control-sm"
            style={{ minWidth: 150 }}
            value={dataInicio}
            onChange={(e) => { setDataInicio(e.target.value); setPagina(1); }}
          />
        </div>
        <div>
          <label className="form-label small mb-1">Até</label>
          <input
            type="date"
            className="form-control form-control-sm"
            style={{ minWidth: 150 }}
            value={dataFim}
            onChange={(e) => { setDataFim(e.target.value); setPagina(1); }}
          />
        </div>
      </div>

      {erro && <div className="alert alert-danger">{erro}</div>}

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0" style={{ fontSize: '0.875rem' }}>
            <thead>
              <tr>
                <th>Data/hora</th>
                <th>Usuário</th>
                <th>Ação</th>
                <th>Tabela</th>
                <th>Registro</th>
                <th>Valor anterior</th>
                <th>Valor novo</th>
              </tr>
            </thead>
            <tbody>
              {dados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                dados.map((log) => (
                  <tr key={log.id_log}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDataHora(log.data_hora)}</td>
                    <td>{log.nome_usuario}</td>
                    <td>
                      <span className={`badge bg-${log.acao === 'INSERT' ? 'success' : 'warning'}`}>
                        {log.acao}
                      </span>
                    </td>
                    <td><code>{log.tabela_afetada}</code></td>
                    <td>{log.id_registro}</td>
                    <td style={{ maxWidth: 200 }}>
                      <ValorJSON valor={log.valor_anterior} />
                    </td>
                    <td style={{ maxWidth: 200 }}>
                      <ValorJSON valor={log.valor_novo} />
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
