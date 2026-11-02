const router = require('express').Router();
const autenticar = require('../middlewares/autenticar');
const permitirPerfis = require('../middlewares/permitirPerfis');
const c = require('../controllers/pedidoController');

router.get('/',    autenticar, permitirPerfis('vendedor', 'operador', 'admin'), c.listar);
router.post('/',   autenticar, permitirPerfis('vendedor'), c.criar);
router.get('/:id', autenticar, permitirPerfis('vendedor', 'operador', 'admin'), c.buscarPorId);
router.patch('/:id/status',   autenticar, permitirPerfis('operador', 'admin'), c.atualizarStatus);
router.patch('/:id/cancelar', autenticar, permitirPerfis('vendedor', 'admin'), c.cancelar);

module.exports = router;
