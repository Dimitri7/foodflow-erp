const pool = require('../config/db');
const loteModel = require('../models/loteModel');
const produtoModel = require('../models/produtoModel');
const auditoriaModel = require('../models/auditoriaModel');
const { getIo } = require('../socket');

function hojeFortaleza() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Fortaleza' }));
}

async function listar(query) {
  const pagina = parseInt(query.pagina) || 1;
  const limite = parseInt(query.limite) || 20;
  const busca = query.busca || '';
  const idProduto = query.idProduto ? parseInt(query.idProduto) : null;
  const result = await loteModel.listar(pool, { pagina, limite, busca, idProduto });
  return { ...result, pagina, limite };
}

async function buscarPorId(id) {
  const lote = await loteModel.buscarPorId(pool, id);
  if (!lote) throw Object.assign(new Error('Lote não encontrado'), { status: 404 });
  return lote;
}

async function criar(dados, idUsuario) {
  const { idProduto, codigoLote, dataValidade, quantidadeDisponivel, dataEntrada } = dados;
  if (!idProduto) throw Object.assign(new Error('Produto obrigatório'), { status: 400 });
  if (!codigoLote) throw Object.assign(new Error('Código do lote obrigatório'), { status: 400 });
  if (!dataValidade) throw Object.assign(new Error('Data de validade obrigatória'), { status: 400 });
  if (!quantidadeDisponivel || quantidadeDisponivel <= 0) {
    throw Object.assign(new Error('Quantidade deve ser maior que zero'), { status: 400 });
  }

  const produto = await produtoModel.buscarPorId(pool, idProduto);
  if (!produto) throw Object.assign(new Error('Produto não encontrado'), { status: 404 });

  const validade = new Date(dataValidade + 'T12:00:00');
  const hoje = hojeFortaleza();
  hoje.setHours(0, 0, 0, 0);
  if (validade < hoje) throw Object.assign(new Error('Lote já vencido'), { status: 400 });

  const entrada = dataEntrada || new Date().toISOString().slice(0, 10);
  if (new Date(dataValidade) <= new Date(entrada)) {
    throw Object.assign(new Error('Data de validade deve ser posterior à data de entrada'), { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const lote = await loteModel.criar(client, { idProduto, codigoLote, dataValidade, quantidadeDisponivel, dataEntrada: entrada });
    await auditoriaModel.registrar(client, {
      idUsuario, acao: 'INSERT', tabela: 'lotes',
      idRegistro: lote.id_lote,
      valorNovo: { id_produto: idProduto, codigo_lote: codigoLote, quantidade: quantidadeDisponivel },
    });
    await client.query('COMMIT');
    return { ...lote, nome_produto: produto.nome };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function ajustar(id, { quantidade, justificativa }, idUsuario) {
  if (justificativa === undefined || justificativa === null || String(justificativa).trim().length < 10) {
    throw Object.assign(new Error('Justificativa deve ter no mínimo 10 caracteres'), { status: 400 });
  }
  if (quantidade === undefined || quantidade === null || Number(quantidade) < 0) {
    throw Object.assign(new Error('Quantidade não pode ser negativa'), { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const lote = await loteModel.buscarParaLock(client, id);
    if (!lote) throw Object.assign(new Error('Lote não encontrado'), { status: 404 });

    await loteModel.ajustar(client, id, Number(quantidade));

    await auditoriaModel.registrar(client, {
      idUsuario, acao: 'UPDATE', tabela: 'lotes',
      idRegistro: id,
      valorAnterior: { quantidade_disponivel: lote.quantidade_disponivel },
      valorNovo: { quantidade_disponivel: Number(quantidade), justificativa: String(justificativa).trim() },
    });

    await client.query('COMMIT');

    const io = getIo();
    if (io) io.emit('estoque:atualizado', { idsProdutos: [lote.id_produto] });

    return loteModel.buscarPorId(pool, id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listarVencendo() {
  const dias = parseInt(process.env.DIAS_ALERTA_VENCIMENTO) || 30;
  return loteModel.buscarVencendo(pool, dias);
}

async function rastreio(id) {
  const lote = await loteModel.buscarPorId(pool, id);
  if (!lote) throw Object.assign(new Error('Lote não encontrado'), { status: 404 });
  return loteModel.buscarRastreio(pool, id);
}

module.exports = { listar, buscarPorId, criar, ajustar, listarVencendo, rastreio };
