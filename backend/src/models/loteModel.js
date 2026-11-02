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

async function buscarParaLock(client, id) {
  const { rows } = await client.query(
    'SELECT * FROM lotes WHERE id_lote = $1 FOR UPDATE',
    [id]
  );
  return rows[0] || null;
}

async function ajustar(client, id, quantidade) {
  const { rows } = await client.query(
    'UPDATE lotes SET quantidade_disponivel = $1 WHERE id_lote = $2 RETURNING *',
    [quantidade, id]
  );
  return rows[0] || null;
}

async function buscarVencendo(db, dias) {
  const { rows } = await db.query(
    `SELECT l.id_lote, l.id_produto, p.nome AS nome_produto, p.unidade,
            l.codigo_lote, l.data_validade, l.quantidade_disponivel, l.data_entrada
     FROM lotes l
     JOIN produtos p ON p.id_produto = l.id_produto
     WHERE l.quantidade_disponivel > 0
       AND l.data_validade >= ${HOJE_FORTALEZA}
       AND l.data_validade <= ${HOJE_FORTALEZA} + ($1 || ' days')::interval
     ORDER BY l.data_validade, l.id_lote`,
    [dias]
  );
  return rows;
}

async function buscarRastreio(db, idLote) {
  const { rows } = await db.query(
    `SELECT p.id_pedido, p.data_criacao, p.status,
            c.razao_social, c.cnpj,
            i.quantidade, i.preco_unitario
     FROM itens_pedido i
     JOIN pedidos p  ON p.id_pedido  = i.id_pedido
     JOIN clientes c ON c.id_cliente = p.id_cliente
     WHERE i.id_lote = $1
       AND p.status != 'cancelado'
     ORDER BY p.data_criacao`,
    [idLote]
  );
  return rows;
}

module.exports = { listar, buscarPorId, criar, buscarLotesVigentesFefo, buscarParaLock, ajustar, buscarVencendo, buscarRastreio };
