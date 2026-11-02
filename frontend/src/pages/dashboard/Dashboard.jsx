import { useState, useEffect, useCallback } from 'react';
import http from '../../api/http.js';
import { formatMoeda, formatQuantidade } from '../../utils/format.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

function completarSemana(vendasPorDia) {
  const mapa = {};
  vendasPorDia.forEach((d) => {
    const chave = String(d.dia).slice(0, 10);
    mapa[chave] = Number(d.faturamento);
  });
  const dias = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    const chave = dt.toLocaleDateString('sv', { timeZone: 'America/Fortaleza' });
    dias.push({ dia: chave, faturamento: mapa[chave] ?? 0 });
  }
  return dias;
}

function formatCurto(v) {
  const n = Number(v);
  if (n >= 1000) return 'R$' + (n / 1000).toFixed(1) + 'k';
  return 'R$' + n.toFixed(0);
}

function GraficoBarras({ dias }) {
  const PADDING_L = 40;
  const PADDING_B = 30;
  const CHART_H = 150;
  const CHART_W = 480;
  const N = dias.length;
  const BAR_GAP = 6;
  const BAR_W = N > 0 ? (CHART_W - BAR_GAP * (N - 1)) / N : 60;
  const maxVal = Math.max(...dias.map((d) => d.faturamento), 1);

  return (
    <svg
      viewBox={`0 0 ${PADDING_L + CHART_W + 10} ${CHART_H + PADDING_B + 20}`}
      width="100%"
    >
      <line
        x1={PADDING_L} y1={CHART_H}
        x2={PADDING_L + CHART_W} y2={CHART_H}
        stroke="#dee2e6" strokeWidth="1"
      />
      {dias.map((d, i) => {
        const barH = Math.max((d.faturamento / maxVal) * CHART_H, d.faturamento > 0 ? 2 : 0);
        const x = PADDING_L + i * (BAR_W + BAR_GAP);
        const y = CHART_H - barH;
        const label = d.dia.slice(8, 10) + '/' + d.dia.slice(5, 7);
        return (
          <g key={d.dia}>
            <rect x={x} y={y} width={BAR_W} height={barH} fill="#2d6a4f" rx="2" />
            {d.faturamento > 0 && (
              <text x={x + BAR_W / 2} y={y - 4} textAnchor="middle" fontSize="9" fill="#495057">
                {formatCurto(d.faturamento)}
              </text>
            )}
            <text x={x + BAR_W / 2} y={CHART_H + 16} textAnchor="middle" fontSize="10" fill="#6c757d">
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Dashboard() {
  const [dados, setDados] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [erro, setErro] = useState('');
  const { socket, registrarReconexao } = useAuth();

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const [resDash, resAlertas] = await Promise.all([
        http.get('/api/dashboard'),
        http.get('/api/produtos/alertas'),
      ]);
      setDados(resDash.data);
      setAlertas(resAlertas.data);
    } catch (err) {
      setErro(err.response?.data?.erro ?? 'Erro ao carregar dashboard');
    }
  }, []);

  useEffect(() => {
    carregar();
    return registrarReconexao(carregar);
  }, [carregar, registrarReconexao]);

  useEffect(() => {
    if (!socket) return;
    socket.on('pedido:criado', carregar);
    socket.on('pedido:status', carregar);
    socket.on('estoque:atualizado', carregar);
    return () => {
      socket.off('pedido:criado', carregar);
      socket.off('pedido:status', carregar);
      socket.off('estoque:atualizado', carregar);
    };
  }, [socket, carregar]);

  const diasCompletos = dados ? completarSemana(dados.vendasPorDia) : [];

  return (
    <div>
      <h2 className="h5 fw-bold mb-3">Dashboard</h2>

      {erro && <div className="alert alert-danger">{erro}</div>}
      {!dados && !erro && <div className="text-muted">Carregando...</div>}

      {dados && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-muted small fw-semibold mb-1">FATURAMENTO DO DIA</div>
                  <div className="h4 fw-bold mb-0">{formatMoeda(dados.faturamentoDia)}</div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-muted small fw-semibold mb-1">VALOR EM ESTOQUE</div>
                  <div className="h4 fw-bold mb-0">{formatMoeda(dados.valorEstoque)}</div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-muted small fw-semibold mb-1">LOTES A VENCER</div>
                  <div className="h4 fw-bold mb-0">{dados.lotesAVencer}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white fw-semibold">Vendas dos últimos 7 dias</div>
            <div className="card-body">
              <GraficoBarras dias={diasCompletos} />
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white fw-semibold">Produtos mais vendidos</div>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Unidade</th>
                    <th className="text-end">Qtd vendida</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.maisVendidos.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center text-muted py-3">Nenhuma venda registrada</td>
                    </tr>
                  ) : (
                    dados.maisVendidos.map((p) => (
                      <tr key={p.id_produto}>
                        <td>{p.nome}</td>
                        <td>{p.unidade}</td>
                        <td className="text-end">{formatQuantidade(p.total_vendido)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {alertas.length > 0 && (
            <div className="card border-0 shadow-sm border-danger">
              <div className="card-header bg-white fw-semibold text-danger">
                Produtos abaixo do estoque mínimo ({alertas.length})
              </div>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th className="text-end">Saldo vigente</th>
                      <th className="text-end">Estoque mínimo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertas.map((a) => (
                      <tr key={a.id_produto}>
                        <td>{a.nome}</td>
                        <td className="text-end">{formatQuantidade(a.saldo_vigente)} {a.unidade}</td>
                        <td className="text-end">{formatQuantidade(a.estoque_minimo)} {a.unidade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
