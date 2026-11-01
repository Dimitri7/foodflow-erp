async function listar(db, { pagina = 1, limite = 20, busca = '', status = '', idCliente = null, dataInicio = null, dataFim = null, idUsuario = null, perfil = null } = {}) {
  const offset = (pagina - 1) * limite;
  const conditions = [];
  const params = [];

  if (perfil === 'vendedor') {
    conditions.push(`p.id_usuario = $${params.length + 1}`);
    params.push(idUsuario);
  }
  if (status) {
    conditions.push(`p.status = $${params.length + 1}`);
    params.push(status);
  }
  if (idCliente) {
    conditions.push(`p.id_cliente = $${params.length + 1}`);
    params.push(idCliente);
  }
  if (dataInicio) {
    conditions.push(`p.data_criacao >= $${params.length + 1}`);
    params.push(dataInicio);
  }
  if (dataFim) {
    conditions.push(`p.data_criacao <= $${params.length + 1}`);
    params.push(dataFim + 'T23:59:59Z');
  }
  if (busca) {
    conditions.push(`c.razao_social ILIKE $${params.length + 1}`);
    params.push(`%${busca}%`);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const [dados, count] = await Promise.all([
    db.query(
      `SELECT p.id_pedido, p.data_criacao, p.status, p.valor_total,
              c.id_cliente, c.razao_social,
              u.id_usuario, u.nome AS nome_vendedor
       FROM pedidos p
       JOIN clientes c ON c.id_cliente = p.id_cliente
       JOIN usuarios u ON u.id_usuario = p.id_usuario
       ${where}
       ORDER BY p.data_criacao DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limite, offset]
    ),
    db.query(
      `SELECT COUNT(*) FROM pedidos p
       JOIN clientes c ON c.id_cliente = p.id_cliente
       JOIN usuarios u ON u.id_usuario = p.id_usuario
       ${where}`,
      params
    ),
  ]);
  return { dados: dados.rows, total: parseInt(count.rows[0].count) };
}

async function buscarPorId(db, id) {
  const { rows } = await db.query(
    `SELECT p.id_pedido, p.data_criacao, p.status, p.valor_total,
            p.motivo_cancelamento, p.data_cancelamento,
            c.id_cliente, c.razao_social, c.cnpj,
            u.id_usuario, u.nome AS nome_vendedor
     FROM pedidos p
     JOIN clientes c ON c.id_cliente = p.id_cliente
     JOIN usuarios u ON u.id_usuario = p.id_usuario
     WHERE p.id_pedido = $1`,
    [id]
  );
  return rows[0] || null;
}

async function buscarItens(db, idPedido) {
  const { rows } = await db.query(
    `SELECT i.id_item, i.id_lote, l.codigo_lote, l.data_validade,
            pr.id_produto, pr.nome AS nome_produto,
            i.quantidade, i.preco_unitario
     FROM itens_pedido i
     JOIN lotes l ON l.id_lote = i.id_lote
     JOIN produtos pr ON pr.id_produto = l.id_produto
     WHERE i.id_pedido = $1
     ORDER BY i.id_item`,
    [idPedido]
  );
  return rows;
}

async function buscarHistoricoStatus(db, idPedido) {
  const { rows } = await db.query(
    `SELECT h.id, h.status_anterior, h.novo_status, h.data_hora,
            u.nome AS nome_usuario
     FROM historico_status_pedido h
     JOIN usuarios u ON u.id_usuario = h.id_usuario
     WHERE h.id_pedido = $1
     ORDER BY h.data_hora`,
    [idPedido]
  );
  return rows;
}

async function criar(client, { idCliente, idUsuario, valorTotal }) {
  const { rows } = await client.query(
    `INSERT INTO pedidos (id_cliente, id_usuario, status, valor_total)
     VALUES ($1, $2, 'aguardando_separacao', $3)
     RETURNING *`,
    [idCliente, idUsuario, valorTotal]
  );
  return rows[0];
}

async function criarItem(client, { idPedido, idLote, quantidade, precoUnitario }) {
  await client.query(
    'INSERT INTO itens_pedido (id_pedido, id_lote, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)',
    [idPedido, idLote, quantidade, precoUnitario]
  );
}

async function registrarHistoricoStatus(client, { idPedido, statusAnterior, novoStatus, idUsuario }) {
  await client.query(
    'INSERT INTO historico_status_pedido (id_pedido, status_anterior, novo_status, id_usuario) VALUES ($1, $2, $3, $4)',
    [idPedido, statusAnterior || null, novoStatus, idUsuario]
  );
}

async function atualizarStatus(client, id, { status, motivoCancelamento, dataCancelamento }) {
  const { rows } = await client.query(
    `UPDATE pedidos
     SET status = $1,
         motivo_cancelamento = COALESCE($2, motivo_cancelamento),
         data_cancelamento = COALESCE($3, data_cancelamento)
     WHERE id_pedido = $4
     RETURNING *`,
    [status, motivoCancelamento || null, dataCancelamento || null, id]
  );
  return rows[0] || null;
}

async function buscarParaLock(client, id) {
  const { rows } = await client.query(
    'SELECT * FROM pedidos WHERE id_pedido = $1 FOR UPDATE',
    [id]
  );
  return rows[0] || null;
}

module.exports = {
  listar, buscarPorId, buscarItens, buscarHistoricoStatus,
  criar, criarItem, registrarHistoricoStatus, atualizarStatus, buscarParaLock,
};
