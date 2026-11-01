const loteService = require('../services/loteService');

async function listar(req, res, next) {
  try {
    res.json(await loteService.listar(req.query));
  } catch (err) { next(err); }
}

async function buscarPorId(req, res, next) {
  try {
    res.json(await loteService.buscarPorId(parseInt(req.params.id)));
  } catch (err) { next(err); }
}

async function criar(req, res, next) {
  try {
    const lote = await loteService.criar(req.body, req.usuario.id);
    res.status(201).json(lote);
  } catch (err) { next(err); }
}

module.exports = { listar, buscarPorId, criar };
