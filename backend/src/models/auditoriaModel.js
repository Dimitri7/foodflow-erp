async function registrar(client, { idUsuario, acao, tabela, idRegistro, valorAnterior = null, valorNovo = null }) {
  await client.query(
    `INSERT INTO logs_auditoria (id_usuario, acao, tabela_afetada, id_registro, valor_anterior, valor_novo)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [idUsuario, acao, tabela, idRegistro, valorAnterior, valorNovo]
  );
}

async function listar(db, { pagina = 1, limite = 20, idUsuario = null, tabela = null, acao = null, dataInicio = null, dataFim = null } = {}) {
  const offset = (pagina - 1) * limite;
  const [dados, count] = await Promise.all([
    db.query(
      `SELECT la.id_log, la.acao, la.tabela_afetada, la.id_registro,
              la.data_hora, la.valor_anterior, la.valor_novo,
              u.nome AS nome_usuario, u.email AS email_usuario
       FROM logs_auditoria la
       LEFT JOIN usuarios u ON u.id_usuario = la.id_usuario
       WHERE ($1::int IS NULL OR la.id_usuario = $1)
         AND ($2::text IS NULL OR la.tabela_afetada = $2)
         AND ($3::text IS NULL OR la.acao = $3)
         AND ($4::timestamptz IS NULL OR la.data_hora >= $4)
         AND ($5::timestamptz IS NULL OR la.data_hora <= $5)
       ORDER BY la.data_hora DESC
       LIMIT $6 OFFSET $7`,
      [idUsuario, tabela, acao, dataInicio, dataFim, limite, offset]
    ),
    db.query(
      `SELECT COUNT(*) FROM logs_auditoria la
       WHERE ($1::int IS NULL OR la.id_usuario = $1)
         AND ($2::text IS NULL OR la.tabela_afetada = $2)
         AND ($3::text IS NULL OR la.acao = $3)
         AND ($4::timestamptz IS NULL OR la.data_hora >= $4)
         AND ($5::timestamptz IS NULL OR la.data_hora <= $5)`,
      [idUsuario, tabela, acao, dataInicio, dataFim]
    ),
  ]);
  return { dados: dados.rows, total: parseInt(count.rows[0].count) };
}

module.exports = { registrar, listar };
