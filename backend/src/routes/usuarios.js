const router = require('express').Router();
const autenticar = require('../middlewares/autenticar');
const permitirPerfis = require('../middlewares/permitirPerfis');
const c = require('../controllers/usuarioController');

router.use(autenticar, permitirPerfis('admin'));

router.get('/',           c.listar);
router.post('/',          c.criar);
router.get('/:id',        c.buscarPorId);
router.put('/:id',        c.atualizar);
router.patch('/:id/status', c.atualizarStatus);

module.exports = router;
