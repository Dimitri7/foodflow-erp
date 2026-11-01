const usuarioService = require('../services/usuarioService');

async function listar(req, res, next) {
  try {
    res.json(await usuarioService.listar(req.query));
  } catch (err) { next(err); }
}

async function buscarPorId(req, res, next) {
  try {
    res.json(await usuarioService.buscarPorId(parseInt(req.params.id)));
  } catch (err) { next(err); }
}

async function criar(req, res, next) {
  try {
    const usuario = await usuarioService.criar(req.body, req.usuario.id);
    res.status(201).json(usuario);
  } catch (err) { next(err); }
}

async function atualizar(req, res, next) {
  try {
    res.json(await usuarioService.atualizar(parseInt(req.params.id), req.body, req.usuario.id));
  } catch (err) { next(err); }
}

async function atualizarStatus(req, res, next) {
  try {
    const { ativo } = req.body;
    res.json(await usuarioService.atualizarStatus(parseInt(req.params.id), ativo, req.usuario.id));
  } catch (err) { next(err); }
}

module.exports = { listar, buscarPorId, criar, atualizar, atualizarStatus };
