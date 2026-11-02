const dashboardService = require('../services/dashboardService');

async function consultar(req, res, next) {
  try {
    res.json(await dashboardService.consultar());
  } catch (err) { next(err); }
}

module.exports = { consultar };
