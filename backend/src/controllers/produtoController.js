const produtoService = require('../services/produtoService');

async function listar(req, res, next) {
  try {
    res.json(await produtoService.listar(req.query));
  } catch (err) { next(err); }
}

async function buscarPorId(req, res, next) {
  try {
    res.json(await produtoService.buscarPorId(parseInt(req.params.id)));
  } catch (err) { next(err); }
}

async function criar(req, res, next) {
  try {
    const produto = await produtoService.criar(req.body, req.usuario.id);
    res.status(201).json(produto);
  } catch (err) { next(err); }
}

async function atualizar(req, res, next) {
  try {
    res.json(await produtoService.atualizar(parseInt(req.params.id), req.body, req.usuario.id));
  } catch (err) { next(err); }
}

module.exports = { listar, buscarPorId, criar, atualizar };
