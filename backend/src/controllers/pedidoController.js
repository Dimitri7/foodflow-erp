const pedidoService = require('../services/pedidoService');

async function listar(req, res, next) {
  try {
    res.json(await pedidoService.listar(req.query, req.usuario.id, req.usuario.perfil));
  } catch (err) { next(err); }
}

async function buscarPorId(req, res, next) {
  try {
    res.json(await pedidoService.buscarPorId(parseInt(req.params.id), req.usuario.id, req.usuario.perfil));
  } catch (err) { next(err); }
}

async function criar(req, res, next) {
  try {
    const pedido = await pedidoService.criarPedido(req.usuario.id, req.body);
    res.status(201).json(pedido);
  } catch (err) { next(err); }
}

async function atualizarStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ erro: 'Campo "status" obrigatório' });
    res.json(await pedidoService.atualizarStatus(parseInt(req.params.id), status, req.usuario.id, req.usuario.perfil));
  } catch (err) { next(err); }
}

async function cancelar(req, res, next) {
  try {
    const { motivo } = req.body;
    res.json(await pedidoService.cancelarPedido(parseInt(req.params.id), motivo, req.usuario.id, req.usuario.perfil));
  } catch (err) { next(err); }
}

module.exports = { listar, buscarPorId, criar, atualizarStatus, cancelar };
