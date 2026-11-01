const pool = require('../config/db');
const produtoModel = require('../models/produtoModel');
const auditoriaModel = require('../models/auditoriaModel');

async function listar(query) {
  const pagina = parseInt(query.pagina) || 1;
  const limite = parseInt(query.limite) || 20;
  const busca = query.busca || '';
  const categoria = query.categoria || '';
  const result = await produtoModel.listar(pool, { pagina, limite, busca, categoria });
  return { ...result, pagina, limite };
}

async function buscarPorId(id) {
  const produto = await produtoModel.buscarPorId(pool, id);
  if (!produto) throw Object.assign(new Error('Produto não encontrado'), { status: 404 });
  return produto;
}

async function criar(dados, idAdmin) {
  const { nome, categoria, unidade, precoUnitario, estoqueMinimo } = dados;
  if (!nome) throw Object.assign(new Error('Nome obrigatório'), { status: 400 });
  if (!unidade) throw Object.assign(new Error('Unidade obrigatória'), { status: 400 });
  if (!precoUnitario || precoUnitario <= 0) throw Object.assign(new Error('Preço deve ser maior que zero'), { status: 400 });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const produto = await produtoModel.criar(client, { nome, categoria, unidade, precoUnitario, estoqueMinimo });
    await auditoriaModel.registrar(client, {
      idUsuario: idAdmin, acao: 'INSERT', tabela: 'produtos',
      idRegistro: produto.id_produto, valorNovo: { nome: produto.nome, preco_unitario: produto.preco_unitario },
    });
    await client.query('COMMIT');
    return produto;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function atualizar(id, dados, idAdmin) {
  const produto = await produtoModel.buscarPorId(pool, id);
  if (!produto) throw Object.assign(new Error('Produto não encontrado'), { status: 404 });
  if (dados.precoUnitario !== undefined && dados.precoUnitario <= 0) {
    throw Object.assign(new Error('Preço deve ser maior que zero'), { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const atualizado = await produtoModel.atualizar(client, id, dados);
    await auditoriaModel.registrar(client, {
      idUsuario: idAdmin, acao: 'UPDATE', tabela: 'produtos',
      idRegistro: id, valorAnterior: { preco_unitario: produto.preco_unitario },
      valorNovo: { preco_unitario: atualizado.preco_unitario },
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
