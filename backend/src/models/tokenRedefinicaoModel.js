async function criar(client, idUsuario, tokenHash, expiraEm) {
  await client.query(
    `INSERT INTO tokens_redefinicao_senha (id_usuario, token_hash, expira_em)
     VALUES ($1, $2, $3)`,
    [idUsuario, tokenHash, expiraEm]
  );
}

async function buscarPorHash(pool, tokenHash) {
  const { rows } = await pool.query(
    `SELECT t.id, t.id_usuario, t.expira_em, t.usado
     FROM tokens_redefinicao_senha t
     WHERE t.token_hash = $1`,
    [tokenHash]
  );
  return rows[0] ?? null;
}

async function marcarUsado(client, id) {
  await client.query(
    `UPDATE tokens_redefinicao_senha SET usado = true WHERE id = $1`,
    [id]
  );
}

module.exports = { criar, buscarPorHash, marcarUsado };
