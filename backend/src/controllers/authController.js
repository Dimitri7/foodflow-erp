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

async function recuperarSenha(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ erro: 'E-mail obrigatório' });
    await authService.recuperarSenha(email);
    res.json({ mensagem: 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.' });
  } catch (err) {
    next(err);
  }
}

async function redefinirSenha(req, res, next) {
  try {
    const { token, novaSenha } = req.body;
    if (!token || !novaSenha) return res.status(400).json({ erro: 'Token e nova senha obrigatórios' });
    await authService.redefinirSenha(token, novaSenha);
    res.json({ mensagem: 'Senha redefinida com sucesso.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, recuperarSenha, redefinirSenha };
