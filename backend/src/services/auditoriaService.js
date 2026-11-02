const pool = require('../config/db');
const auditoriaModel = require('../models/auditoriaModel');

async function listar(query) {
  const pagina = parseInt(query.pagina) || 1;
  const limite = parseInt(query.limite) || 20;
  const idUsuario = query.idUsuario ? parseInt(query.idUsuario) : null;
  const tabela = query.tabela || null;
  const acao = query.acao || null;
  const dataInicio = query.dataInicio || null;
  const dataFim = query.dataFim || null;
  const result = await auditoriaModel.listar(pool, { pagina, limite, idUsuario, tabela, acao, dataInicio, dataFim });
  return { ...result, pagina, limite };
}

module.exports = { listar };
