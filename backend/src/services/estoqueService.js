const pool = require('../config/db');
const produtoModel = require('../models/produtoModel');

const HOJE_FORTALEZA = `(NOW() AT TIME ZONE 'America/Fortaleza')::date`;

async function consultarEstoque(idProduto) {
  const produto = await produtoModel.buscarPorId(pool, idProduto);
  if (!produto) throw Object.assign(new Error('Produto não encontrado'), { status: 404 });

  const { rows: lotes } = await pool.query(
    `SELECT id_lote, codigo_lote, data_validade, quantidade_disponivel, data_entrada,
            data_validade < ${HOJE_FORTALEZA} AS vencido
     FROM lotes
     WHERE id_produto = $1
     ORDER BY data_validade, data_entrada, id_lote`,
    [idProduto]
  );

  const saldoTotal = lotes
    .filter(l => !l.vencido)
    .reduce((sum, l) => sum + parseFloat(l.quantidade_disponivel), 0);

  return {
    idProduto: produto.id_produto,
    nome: produto.nome,
    unidade: produto.unidade,
    estoqueMinimo: parseFloat(produto.estoque_minimo),
    saldoTotal,
    abaixoMinimo: saldoTotal <= parseFloat(produto.estoque_minimo),
    lotes,
  };
}

async function calcularDistribuicaoFefo(idProduto, quantidade) {
  const { rows: lotes } = await pool.query(
    `SELECT id_lote, codigo_lote, data_validade, quantidade_disponivel
     FROM lotes
     WHERE id_produto = $1
       AND data_validade >= ${HOJE_FORTALEZA}
       AND quantidade_disponivel > 0
     ORDER BY data_validade, data_entrada, id_lote`,
    [idProduto]
  );

  const saldoTotal = lotes.reduce((sum, l) => sum + parseFloat(l.quantidade_disponivel), 0);
  if (saldoTotal < quantidade) return null;

  const distribuicao = [];
  let restante = quantidade;
  for (const lote of lotes) {
    if (restante <= 0) break;
    const usar = Math.min(restante, parseFloat(lote.quantidade_disponivel));
    distribuicao.push({ idLote: lote.id_lote, codigoLote: lote.codigo_lote, dataValidade: lote.data_validade, quantidade: usar });
    restante -= usar;
  }
  return distribuicao;
}

async function calcularPrevia(idProduto, quantidade) {
  const produto = await produtoModel.buscarPorId(pool, idProduto);
  if (!produto) throw Object.assign(new Error('Produto não encontrado'), { status: 404 });
  if (!quantidade || quantidade <= 0) {
    throw Object.assign(new Error('Quantidade deve ser positiva'), { status: 400 });
  }
  const distribuicao = await calcularDistribuicaoFefo(idProduto, quantidade);
  if (!distribuicao) {
    throw Object.assign(new Error(`Saldo insuficiente para ${produto.nome}`), { status: 409 });
  }
  return { idProduto: produto.id_produto, nome: produto.nome, unidade: produto.unidade, quantidade, distribuicao };
}

module.exports = { consultarEstoque, calcularDistribuicaoFefo, calcularPrevia };
