async function listar(db, { pagina = 1, limite = 20, busca = '', categoria = '' } = {}) {
  const offset = (pagina - 1) * limite;
  const termo = `%${busca}%`;
  const conditions = ['(nome ILIKE $1 OR categoria ILIKE $1)'];
  const params = [termo];

  if (categoria) {
    conditions.push(`categoria = $${params.length + 1}`);
    params.push(categoria);
  }

  const where = 'WHERE ' + conditions.join(' AND ');
  const [dados, count] = await Promise.all([
    db.query(
      `SELECT id_produto, nome, categoria, unidade, preco_unitario, estoque_minimo, ativo, created_at
       FROM produtos ${where}
       ORDER BY nome LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limite, offset]
    ),
    db.query(`SELECT COUNT(*) FROM produtos ${where}`, params),
  ]);
  return { dados: dados.rows, total: parseInt(count.rows[0].count) };
}

async function buscarPorId(db, id) {
  const { rows } = await db.query(
    'SELECT id_produto, nome, categoria, unidade, preco_unitario, estoque_minimo, ativo, created_at FROM produtos WHERE id_produto = $1',
    [id]
  );
  return rows[0] || null;
}

async function criar(db, { nome, categoria, unidade, precoUnitario, estoqueMinimo }) {
  const { rows } = await db.query(
    `INSERT INTO produtos (nome, categoria, unidade, preco_unitario, estoque_minimo)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id_produto, nome, categoria, unidade, preco_unitario, estoque_minimo, ativo, created_at`,
    [nome, categoria || null, unidade, precoUnitario, estoqueMinimo ?? 0]
  );
  return rows[0];
}

async function atualizar(db, id, { nome, categoria, unidade, precoUnitario, estoqueMinimo, ativo }) {
  const { rows } = await db.query(
    `UPDATE produtos
     SET nome = COALESCE($1, nome),
         categoria = COALESCE($2, categoria),
         unidade = COALESCE($3, unidade),
         preco_unitario = COALESCE($4, preco_unitario),
         estoque_minimo = COALESCE($5, estoque_minimo),
         ativo = COALESCE($6, ativo)
     WHERE id_produto = $7
     RETURNING id_produto, nome, categoria, unidade, preco_unitario, estoque_minimo, ativo, created_at`,
    [nome || null, categoria || null, unidade || null, precoUnitario || null, estoqueMinimo ?? null, ativo ?? null, id]
  );
  return rows[0] || null;
}

async function listarAlertas(db) {
  const HOJE = `(NOW() AT TIME ZONE 'America/Fortaleza')::date`;
  const { rows } = await db.query(
    `SELECT p.id_produto, p.nome, p.categoria, p.unidade,
            p.preco_unitario, p.estoque_minimo,
            COALESCE(SUM(l.quantidade_disponivel)
              FILTER (WHERE l.data_validade >= ${HOJE}), 0) AS saldo_vigente
     FROM produtos p
     LEFT JOIN lotes l ON l.id_produto = p.id_produto
     WHERE p.ativo = true AND p.estoque_minimo > 0
     GROUP BY p.id_produto
     HAVING COALESCE(SUM(l.quantidade_disponivel)
              FILTER (WHERE l.data_validade >= ${HOJE}), 0) <= p.estoque_minimo
     ORDER BY p.nome`
  );
  return rows;
}

module.exports = { listar, buscarPorId, criar, atualizar, listarAlertas };
