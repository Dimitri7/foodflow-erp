const estoqueService = require('../services/estoqueService');

async function consultarEstoque(req, res, next) {
  try {
    res.json(await estoqueService.consultarEstoque(parseInt(req.params.idProduto)));
  } catch (err) { next(err); }
}

async function previa(req, res, next) {
  try {
    const quantidade = parseFloat(req.query.quantidade);
    res.json(await estoqueService.calcularPrevia(parseInt(req.params.idProduto), quantidade));
  } catch (err) { next(err); }
}

module.exports = { consultarEstoque, previa };
