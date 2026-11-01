const HOJE_FORTALEZA = `(NOW() AT TIME ZONE 'America/Fortaleza')::date`;

async function listar(db, { pagina = 1, limite = 20, busca = '', idProduto = null } = {}) {
  const offset = (pagina - 1) * limite;
  const termo = `%${busca}%`;
  const conditions = ['(l.codigo_lote ILIKE $1 OR p.nome ILIKE $1)'];
  const params = [termo];

  if (idProduto) {
    conditions.push(`l.id_produto = $${params.length + 1}`);
    params.push(idProduto);
  }

  const where = 'WHERE ' + conditions.join(' AND ');
  const [dados, count] = await Promise.all([
    db.query(
      `SELECT l.id_lote, l.id_produto, p.nome AS nome_produto,
              l.codigo_lote, l.data_validade, l.quantidade_disponivel, l.data_entrada,
              l.data_validade < ${HOJE_FORTALEZA} AS vencido
       FROM lotes l
       JOIN produtos p ON p.id_produto = l.id_produto
       ${where}
       ORDER BY l.data_validade, l.id_lote
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limite, offset]
    ),
    db.query(
      `SELECT COUNT(*) FROM lotes l JOIN produtos p ON p.id_produto = l.id_produto ${where}`,
      params
    ),
  ]);
  return { dados: dados.rows, total: parseInt(count.rows[0].count) };
}

async function buscarPorId(db, id) {
  const { rows } = await db.query(
    `SELECT l.id_lote, l.id_produto, p.nome AS nome_produto,
            l.codigo_lote, l.data_validade, l.quantidade_disponivel, l.data_entrada,
            l.data_validade < ${HOJE_FORTALEZA} AS vencido
     FROM lotes l
     JOIN produtos p ON p.id_produto = l.id_produto
     WHERE l.id_lote = $1`,
    [id]
  );
  return rows[0] || null;
}

async function criar(db, { idProduto, codigoLote, dataValidade, quantidadeDisponivel, dataEntrada }) {
  const { rows } = await db.query(
    `INSERT INTO lotes (id_produto, codigo_lote, data_validade, quantidade_disponivel, data_entrada)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id_lote, id_produto, codigo_lote, data_validade, quantidade_disponivel, data_entrada`,
    [idProduto, codigoLote, dataValidade, quantidadeDisponivel, dataEntrada || new Date().toISOString().slice(0, 10)]
  );
  return rows[0];
}

// Retorna lotes vigentes para FEFO com lock (passa client de transação)
async function buscarLotesVigentesFefo(client, idProduto) {
  const { rows } = await client.query(
    `SELECT id_lote, codigo_lote, data_validade, quantidade_disponivel
     FROM lotes
     WHERE id_produto = $1
       AND data_validade >= ${HOJE_FORTALEZA}
       AND quantidade_disponivel > 0
     ORDER BY data_validade, data_entrada, id_lote
     FOR UPDATE`,
    [idProduto]
  );
  return rows;
}

module.exports = { listar, buscarPorId, criar, buscarLotesVigentesFefo };
