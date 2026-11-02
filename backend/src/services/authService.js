const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const usuarioModel = require('../models/usuarioModel');
const tokenRedefinicaoModel = require('../models/tokenRedefinicaoModel');
const { getTransportador } = require('../config/email');
const { validarSenha } = require('../validators/campos');
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

async function recuperarSenha(email) {
  const usuario = await usuarioModel.buscarPorEmail(pool, email);
  // não revelar se o e-mail existe — sempre retorna sem lançar erro
  if (!usuario || !usuario.ativo) return;

  const tokenRaw = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');
  const expiraEm = new Date(Date.now() + 30 * 60 * 1000);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await tokenRedefinicaoModel.criar(client, usuario.id_usuario, tokenHash, expiraEm);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const link = `${frontendUrl}/redefinir-senha?token=${tokenRaw}`;
  const transportador = await getTransportador();
  const info = await transportador.sendMail({
    from: '"FoodFlow ERP" <noreply@foodflow.local>',
    to: usuario.email,
    subject: 'Redefinição de senha — FoodFlow ERP',
    text: `Acesse o link para redefinir sua senha (válido por 30 minutos):\n\n${link}`,
    html: `<p>Acesse o link para redefinir sua senha (válido por 30 minutos):</p><p><a href="${link}">${link}</a></p>`,
  });
  console.log('Visualize o e-mail:', nodemailer.getTestMessageUrl(info));
}

async function redefinirSenha(token, novaSenha) {
  if (!validarSenha(novaSenha)) {
    throw Object.assign(new Error('Senha deve ter ao menos 8 caracteres'), { status: 400 });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const registro = await tokenRedefinicaoModel.buscarPorHash(pool, tokenHash);

  if (!registro) throw Object.assign(new Error('Token inválido'), { status: 400 });
  if (registro.usado) throw Object.assign(new Error('Token já utilizado'), { status: 400 });
  if (new Date(registro.expira_em) < new Date()) {
    throw Object.assign(new Error('Token expirado'), { status: 400 });
  }

  const senhaHash = await bcrypt.hash(novaSenha, 10);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE usuarios SET senha_hash = $1 WHERE id_usuario = $2`,
      [senhaHash, registro.id_usuario]
    );
    await tokenRedefinicaoModel.marcarUsado(client, registro.id);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { login, recuperarSenha, redefinirSenha };
