function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}

function validarSenha(senha) {
  return typeof senha === 'string' && senha.length >= 8;
}

function validarQuantidade(valor) {
  return typeof valor === 'number' && valor > 0;
}

module.exports = { validarEmail, validarSenha, validarQuantidade };
