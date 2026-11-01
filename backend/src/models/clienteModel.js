async function listar(db, { pagina = 1, limite = 20, busca = '' } = {}) {
  const offset = (pagina - 1) * limite;
  const termo = `%${busca}%`;
  const [dados, count] = await Promise.all([
    db.query(
      `SELECT id_cliente, razao_social, cnpj, telefone, endereco, ativo, created_at
       FROM clientes
       WHERE razao_social ILIKE $1 OR cnpj ILIKE $1
       ORDER BY razao_social LIMIT $2 OFFSET $3`,
      [termo, limite, offset]
    ),
    db.query(
      'SELECT COUNT(*) FROM clientes WHERE razao_social ILIKE $1 OR cnpj ILIKE $1',
      [termo]
    ),
  ]);
  return { dados: dados.rows, total: parseInt(count.rows[0].count) };
}

async function buscarPorId(db, id) {
  const { rows } = await db.query(
    'SELECT id_cliente, razao_social, cnpj, telefone, endereco, ativo, created_at FROM clientes WHERE id_cliente = $1',
    [id]
  );
  return rows[0] || null;
}

async function buscarPorCnpj(db, cnpj) {
  const { rows } = await db.query(
    'SELECT id_cliente FROM clientes WHERE cnpj = $1',
    [cnpj]
  );
  return rows[0] || null;
}

async function criar(db, { razaoSocial, cnpj, telefone, endereco }) {
  const { rows } = await db.query(
    `INSERT INTO clientes (razao_social, cnpj, telefone, endereco)
     VALUES ($1, $2, $3, $4)
     RETURNING id_cliente, razao_social, cnpj, telefone, endereco, ativo, created_at`,
    [razaoSocial, cnpj, telefone || null, endereco || null]
  );
  return rows[0];
}

async function atualizar(db, id, { razaoSocial, cnpj, telefone, endereco }) {
  const { rows } = await db.query(
    `UPDATE clientes
     SET razao_social = COALESCE($1, razao_social),
         cnpj = COALESCE($2, cnpj),
         telefone = COALESCE($3, telefone),
         endereco = COALESCE($4, endereco)
     WHERE id_cliente = $5
     RETURNING id_cliente, razao_social, cnpj, telefone, endereco, ativo, created_at`,
    [razaoSocial || null, cnpj || null, telefone || null, endereco || null, id]
  );
  return rows[0] || null;
}

module.exports = { listar, buscarPorId, buscarPorCnpj, criar, atualizar };
