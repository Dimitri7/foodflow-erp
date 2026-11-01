const router = require('express').Router();
const autenticar = require('../middlewares/autenticar');
const permitirPerfis = require('../middlewares/permitirPerfis');
const c = require('../controllers/clienteController');

router.use(autenticar, permitirPerfis('vendedor', 'admin'));

router.get('/',    c.listar);
router.post('/',   c.criar);
router.get('/:id', c.buscarPorId);
router.put('/:id', c.atualizar);

module.exports = router;
