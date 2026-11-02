const router = require('express').Router();
const autenticar = require('../middlewares/autenticar');
const permitirPerfis = require('../middlewares/permitirPerfis');
const c = require('../controllers/auditoriaController');

router.get('/', autenticar, permitirPerfis('admin'), c.listar);

module.exports = router;
