const clienteService = require('../services/clienteService');

async function listar(req, res, next) {
  try {
    res.json(await clienteService.listar(req.query));
  } catch (err) { next(err); }
}

async function buscarPorId(req, res, next) {
  try {
    res.json(await clienteService.buscarPorId(parseInt(req.params.id)));
  } catch (err) { next(err); }
}

async function criar(req, res, next) {
  try {
    const cliente = await clienteService.criar(req.body, req.usuario.id);
    res.status(201).json(cliente);
  } catch (err) { next(err); }
}

async function atualizar(req, res, next) {
  try {
    res.json(await clienteService.atualizar(parseInt(req.params.id), req.body, req.usuario.id));
  } catch (err) { next(err); }
}

module.exports = { listar, buscarPorId, criar, atualizar };
