const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const usuarioModel = require('../models/usuarioModel');
const auditoriaModel = require('../models/auditoriaModel');
const { validarEmail, validarSenha } = require('../validators/campos');

async function listar(query) {
  const pagina = parseInt(query.pagina) || 1;
  const limite = parseInt(query.limite) || 20;
  const busca = query.busca || '';
  const result = await usuarioModel.listar(pool, { pagina, limite, busca });
  return { ...result, pagina, limite };
}

async function buscarPorId(id) {
  const usuario = await usuarioModel.buscarPorId(pool, id);
  if (!usuario) throw Object.assign(new Error('Usuário não encontrado'), { status: 404 });
  return usuario;
}

async function criar(dados, idAdmin) {
  const { nome, email, senha, perfil } = dados;
  if (!nome || nome.trim().length < 3) throw Object.assign(new Error('Nome deve ter pelo menos 3 caracteres'), { status: 400 });
  if (!validarEmail(email)) throw Object.assign(new Error('E-mail inválido'), { status: 400 });
  if (!validarSenha(senha)) throw Object.assign(new Error('Senha deve ter pelo menos 8 caracteres'), { status: 400 });
  if (!['admin', 'vendedor', 'operador'].includes(perfil)) throw Object.assign(new Error('Perfil inválido'), { status: 400 });

  const existente = await usuarioModel.buscarPorEmail(pool, email);
  if (existente) throw Object.assign(new Error('E-mail já cadastrado'), { status: 409 });

  const senhaHash = await bcrypt.hash(senha, 10);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const usuario = await usuarioModel.criar(client, { nome: nome.trim(), email, senhaHash, perfil });
    await auditoriaModel.registrar(client, {
      idUsuario: idAdmin, acao: 'INSERT', tabela: 'usuarios',
      idRegistro: usuario.id_usuario, valorNovo: { nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
    });
    await client.query('COMMIT');
    return usuario;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function atualizar(id, dados, idAdmin) {
  const usuario = await usuarioModel.buscarPorId(pool, id);
  if (!usuario) throw Object.assign(new Error('Usuário não encontrado'), { status: 404 });

  const { nome, email, senha, perfil } = dados;
  if (email && !validarEmail(email)) throw Object.assign(new Error('E-mail inválido'), { status: 400 });
  if (senha && !validarSenha(senha)) throw Object.assign(new Error('Senha deve ter pelo menos 8 caracteres'), { status: 400 });
  if (perfil && !['admin', 'vendedor', 'operador'].includes(perfil)) throw Object.assign(new Error('Perfil inválido'), { status: 400 });

  if (email && email !== usuario.email) {
    const existente = await usuarioModel.buscarPorEmail(pool, email);
    if (existente) throw Object.assign(new Error('E-mail já cadastrado'), { status: 409 });
  }

  const senhaHash = senha ? await bcrypt.hash(senha, 10) : undefined;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const atualizado = await usuarioModel.atualizar(client, id, { nome, email, senhaHash, perfil });
    await auditoriaModel.registrar(client, {
      idUsuario: idAdmin, acao: 'UPDATE', tabela: 'usuarios',
      idRegistro: id, valorAnterior: { nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
      valorNovo: { nome: atualizado.nome, email: atualizado.email, perfil: atualizado.perfil },
    });
    await client.query('COMMIT');
    return atualizado;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function atualizarStatus(id, ativo, idAdmin) {
  if (typeof ativo !== 'boolean') throw Object.assign(new Error('Campo "ativo" deve ser true ou false'), { status: 400 });

  const usuario = await usuarioModel.buscarPorId(pool, id);
  if (!usuario) throw Object.assign(new Error('Usuário não encontrado'), { status: 404 });

  if (usuario.perfil === 'admin' && !ativo) {
    const total = await usuarioModel.contarAdminsAtivos(pool);
    if (total <= 1) throw Object.assign(new Error('Não é possível desativar o único administrador ativo'), { status: 409 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const atualizado = await usuarioModel.atualizarStatus(client, id, ativo);
    await auditoriaModel.registrar(client, {
      idUsuario: idAdmin, acao: 'UPDATE', tabela: 'usuarios',
      idRegistro: id,
      valorAnterior: { ativo: usuario.ativo },
      valorNovo: { ativo },
    });
    await client.query('COMMIT');
    return atualizado;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, atualizarStatus };
