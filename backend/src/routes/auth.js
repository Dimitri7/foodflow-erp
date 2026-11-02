const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { erro: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', limiteLogin, authController.login);
router.post('/recuperar-senha', authController.recuperarSenha);
router.post('/redefinir-senha', authController.redefinirSenha);

module.exports = router;
