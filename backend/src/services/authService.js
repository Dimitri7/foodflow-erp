const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuarioModel = require('../models/usuarioModel');
const pool = require('../config/db');

async function login(email, senha) {
  const usuario = await usuarioModel.buscarPorEmail(pool, email);

  // mensagem genérica para não revelar se o e-mail existe
  const erroCredenciais = Object.assign(new Error('E-mail ou senha inválidos'), { status: 401 });

  if (!usuario) throw erroCredenciais;
  if (!usuario.ativo) throw Object.assign(new Error('Usuário inativo'), { status: 401 });

  const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
  if (!senhaValida) throw erroCredenciais;

  const token = jwt.sign(
    { id: usuario.id_usuario, perfil: usuario.perfil },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return { token, perfil: usuario.perfil, nome: usuario.nome };
}

module.exports = { login };
