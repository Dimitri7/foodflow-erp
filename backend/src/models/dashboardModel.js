const HOJE_FORTALEZA = `(NOW() AT TIME ZONE 'America/Fortaleza')::date`;

async function consultar(db, dias) {
  const [faturamento, estoque, vencendo, vendasPorDia, maisVendidos] = await Promise.all([
    db.query(
      `SELECT COALESCE(SUM(valor_total), 0) AS faturamento
       FROM pedidos
       WHERE status != 'cancelado'
         AND (data_criacao AT TIME ZONE 'America/Fortaleza')::date = ${HOJE_FORTALEZA}`
    ),
    db.query(
      `SELECT COALESCE(SUM(l.quantidade_disponivel * p.preco_unitario), 0) AS valor_estoque
       FROM lotes l
       JOIN produtos p ON p.id_produto = l.id_produto
       WHERE l.quantidade_disponivel > 0
         AND l.data_validade >= ${HOJE_FORTALEZA}`
    ),
    db.query(
      `SELECT COUNT(*)::int AS total
       FROM lotes
       WHERE quantidade_disponivel > 0
         AND data_validade >= ${HOJE_FORTALEZA}
         AND data_validade <= ${HOJE_FORTALEZA} + ($1 || ' days')::interval`,
      [dias]
    ),
    db.query(
      `SELECT (data_criacao AT TIME ZONE 'America/Fortaleza')::date AS dia,
              COUNT(*)::int AS pedidos,
              COALESCE(SUM(valor_total), 0) AS faturamento
       FROM pedidos
       WHERE status != 'cancelado'
         AND data_criacao AT TIME ZONE 'America/Fortaleza' >= ${HOJE_FORTALEZA} - INTERVAL '6 days'
       GROUP BY dia ORDER BY dia`
    ),
    db.query(
      `SELECT p.id_produto, p.nome, p.unidade, SUM(i.quantidade)::numeric AS total_vendido
       FROM itens_pedido i
       JOIN lotes l    ON l.id_lote    = i.id_lote
       JOIN produtos p ON p.id_produto = l.id_produto
       JOIN pedidos ped ON ped.id_pedido = i.id_pedido
       WHERE ped.status != 'cancelado'
       GROUP BY p.id_produto, p.nome, p.unidade
       ORDER BY total_vendido DESC LIMIT 5`
    ),
  ]);

  return {
    faturamentoDia: parseFloat(faturamento.rows[0].faturamento),
    valorEstoque: parseFloat(estoque.rows[0].valor_estoque),
    lotesAVencer: vencendo.rows[0].total,
    vendasPorDia: vendasPorDia.rows,
    maisVendidos: maisVendidos.rows,
  };
}

module.exports = { consultar };
