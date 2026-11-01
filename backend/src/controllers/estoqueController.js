const estoqueService = require('../services/estoqueService');

async function consultarEstoque(req, res, next) {
  try {
    res.json(await estoqueService.consultarEstoque(parseInt(req.params.idProduto)));
  } catch (err) { next(err); }
}

module.exports = { consultarEstoque };
