const router = require('express').Router();
const autenticar = require('../middlewares/autenticar');
const permitirPerfis = require('../middlewares/permitirPerfis');
const c = require('../controllers/loteController');

router.use(autenticar, permitirPerfis('operador', 'admin'));

router.get('/',    c.listar);
router.post('/',   c.criar);
router.get('/:id', c.buscarPorId);

module.exports = router;
