const authService = require('../services/authService');

async function login(req, res, next) {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: 'E-mail e senha obrigatórios' });
    const resultado = await authService.login(email, senha);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = { login };
