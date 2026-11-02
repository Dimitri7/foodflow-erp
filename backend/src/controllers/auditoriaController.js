const auditoriaService = require('../services/auditoriaService');

async function listar(req, res, next) {
  try {
    res.json(await auditoriaService.listar(req.query));
  } catch (err) { next(err); }
}

module.exports = { listar };
