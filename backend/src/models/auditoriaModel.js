async function registrar(client, { idUsuario, acao, tabela, idRegistro, valorAnterior = null, valorNovo = null }) {
  await client.query(
    `INSERT INTO logs_auditoria (id_usuario, acao, tabela_afetada, id_registro, valor_anterior, valor_novo)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [idUsuario, acao, tabela, idRegistro, valorAnterior, valorNovo]
  );
}

module.exports = { registrar };
