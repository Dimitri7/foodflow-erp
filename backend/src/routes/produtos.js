const router = require('express').Router();
const autenticar = require('../middlewares/autenticar');
const permitirPerfis = require('../middlewares/permitirPerfis');
const c = require('../controllers/produtoController');

router.get('/',         autenticar, c.listar);
router.get('/alertas',  autenticar, permitirPerfis('operador', 'admin'), c.alertas);
router.get('/:id',      autenticar, c.buscarPorId);
router.post('/',   autenticar, permitirPerfis('admin'), c.criar);
router.put('/:id', autenticar, permitirPerfis('admin'), c.atualizar);

module.exports = router;
