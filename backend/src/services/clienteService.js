const pool = require('../config/db');
const clienteModel = require('../models/clienteModel');
const auditoriaModel = require('../models/auditoriaModel');
const { validarCNPJ } = require('../validators/cnpj');

async function listar(query) {
  const pagina = parseInt(query.pagina) || 1;
  const limite = parseInt(query.limite) || 20;
  const busca = query.busca || '';
  const result = await clienteModel.listar(pool, { pagina, limite, busca });
  return { ...result, pagina, limite };
}

async function buscarPorId(id) {
  const cliente = await clienteModel.buscarPorId(pool, id);
  if (!cliente) throw Object.assign(new Error('Cliente não encontrado'), { status: 404 });
  return cliente;
}

async function criar(dados, idUsuario) {
  const { razaoSocial, cnpj, telefone, endereco } = dados;
  if (!razaoSocial) throw Object.assign(new Error('Razão social obrigatória'), { status: 400 });

  const cnpjLimpo = cnpj ? cnpj.replace(/\D/g, '') : '';
  if (!validarCNPJ(cnpjLimpo)) throw Object.assign(new Error('CNPJ inválido'), { status: 400 });

  const existente = await clienteModel.buscarPorCnpj(pool, cnpjLimpo);
  if (existente) throw Object.assign(new Error('CNPJ já cadastrado'), { status: 409 });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cliente = await clienteModel.criar(client, { razaoSocial, cnpj: cnpjLimpo, telefone, endereco });
    await auditoriaModel.registrar(client, {
      idUsuario, acao: 'INSERT', tabela: 'clientes',
      idRegistro: cliente.id_cliente, valorNovo: { razao_social: cliente.razao_social, cnpj: cliente.cnpj },
    });
    await client.query('COMMIT');
    return cliente;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function atualizar(id, dados, idUsuario) {
  const cliente = await clienteModel.buscarPorId(pool, id);
  if (!cliente) throw Object.assign(new Error('Cliente não encontrado'), { status: 404 });

  const { razaoSocial, cnpj, telefone, endereco } = dados;
  let cnpjLimpo = undefined;
  if (cnpj) {
    cnpjLimpo = cnpj.replace(/\D/g, '');
    if (!validarCNPJ(cnpjLimpo)) throw Object.assign(new Error('CNPJ inválido'), { status: 400 });
    if (cnpjLimpo !== cliente.cnpj) {
      const existente = await clienteModel.buscarPorCnpj(pool, cnpjLimpo);
      if (existente) throw Object.assign(new Error('CNPJ já cadastrado'), { status: 409 });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const atualizado = await clienteModel.atualizar(client, id, { razaoSocial, cnpj: cnpjLimpo, telefone, endereco });
    await auditoriaModel.registrar(client, {
      idUsuario, acao: 'UPDATE', tabela: 'clientes',
      idRegistro: id, valorAnterior: { razao_social: cliente.razao_social, cnpj: cliente.cnpj },
      valorNovo: { razao_social: atualizado.razao_social, cnpj: atualizado.cnpj },
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

module.exports = { listar, buscarPorId, criar, atualizar };
