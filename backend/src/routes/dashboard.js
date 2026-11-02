const router = require('express').Router();
const autenticar = require('../middlewares/autenticar');
const permitirPerfis = require('../middlewares/permitirPerfis');
const c = require('../controllers/dashboardController');

router.get('/', autenticar, permitirPerfis('admin'), c.consultar);

module.exports = router;
