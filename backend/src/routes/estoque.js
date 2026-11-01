const router = require('express').Router();
const autenticar = require('../middlewares/autenticar');
const c = require('../controllers/estoqueController');

router.get('/:idProduto/previa', autenticar, c.previa);
router.get('/:idProduto', autenticar, c.consultarEstoque);

module.exports = router;
