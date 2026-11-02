const router = require('express').Router();
const autenticar = require('../middlewares/autenticar');
const permitirPerfis = require('../middlewares/permitirPerfis');
const c = require('../controllers/loteController');

router.use(autenticar, permitirPerfis('operador', 'admin'));

router.get('/',             c.listar);
router.post('/',            c.criar);
router.get('/vencendo',     c.vencendo);
router.get('/:id',          c.buscarPorId);
router.put('/:id/ajuste',   c.ajustar);
router.get('/:id/rastreio', permitirPerfis('admin'), c.rastreio);

module.exports = router;
