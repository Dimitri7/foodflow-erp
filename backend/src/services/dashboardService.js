const pool = require('../config/db');
const dashboardModel = require('../models/dashboardModel');

async function consultar() {
  const dias = parseInt(process.env.DIAS_ALERTA_VENCIMENTO) || 30;
  return dashboardModel.consultar(pool, dias);
}

module.exports = { consultar };
