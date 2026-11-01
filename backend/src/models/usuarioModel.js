const CAMPOS_PUBLICOS = 'id_usuario, nome, email, perfil, ativo, created_at';

async function buscarPorEmail(db, email) {
  const { rows } = await db.query(
    'SELECT id_usuario, nome, email, senha_hash, perfil, ativo FROM usuarios WHERE email = $1',
    [email]
  );
  return rows[0] || null;
}

async function buscarPorId(db, id) {
  const { rows } = await db.query(
    `SELECT ${CAMPOS_PUBLICOS} FROM usuarios WHERE id_usuario = $1`,
    [id]
  );
  return rows[0] || null;
}

async function listar(db, { pagina = 1, limite = 20, busca = '' } = {}) {
  const offset = (pagina - 1) * limite;
  const termo = `%${busca}%`;
  const [dados, count] = await Promise.all([
    db.query(
      `SELECT ${CAMPOS_PUBLICOS} FROM usuarios
       WHERE nome ILIKE $1 OR email ILIKE $1
       ORDER BY nome LIMIT $2 OFFSET $3`,
      [termo, limite, offset]
    ),
    db.query(
      'SELECT COUNT(*) FROM usuarios WHERE nome ILIKE $1 OR email ILIKE $1',
      [termo]
    ),
  ]);
  return { dados: dados.rows, total: parseInt(count.rows[0].count) };
}

async function criar(db, { nome, email, senhaHash, perfil }) {
  const { rows } = await db.query(
    `INSERT INTO usuarios (nome, email, senha_hash, perfil)
     VALUES ($1, $2, $3, $4)
     RETURNING ${CAMPOS_PUBLICOS}`,
    [nome, email, senhaHash, perfil]
  );
  return rows[0];
}

async function atualizar(db, id, campos) {
  const { nome, email, senhaHash, perfil } = campos;
  const { rows } = await db.query(
    `UPDATE usuarios
     SET nome = COALESCE($1, nome),
         email = COALESCE($2, email),
         senha_hash = COALESCE($3, senha_hash),
         perfil = COALESCE($4, perfil)
     WHERE id_usuario = $5
     RETURNING ${CAMPOS_PUBLICOS}`,
    [nome || null, email || null, senhaHash || null, perfil || null, id]
  );
  return rows[0] || null;
}

async function atualizarStatus(db, id, ativo) {
  const { rows } = await db.query(
    `UPDATE usuarios SET ativo = $1 WHERE id_usuario = $2 RETURNING ${CAMPOS_PUBLICOS}`,
    [ativo, id]
  );
  return rows[0] || null;
}

async function contarAdminsAtivos(db) {
  const { rows } = await db.query(
    "SELECT COUNT(*) FROM usuarios WHERE perfil = 'admin' AND ativo = true"
  );
  return parseInt(rows[0].count);
}

module.exports = { buscarPorEmail, buscarPorId, listar, criar, atualizar, atualizarStatus, contarAdminsAtivos };
