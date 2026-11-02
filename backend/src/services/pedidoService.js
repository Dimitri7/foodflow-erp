const pool = require('../config/db');
const pedidoModel = require('../models/pedidoModel');
const loteModel = require('../models/loteModel');
const produtoModel = require('../models/produtoModel');
const clienteModel = require('../models/clienteModel');
const auditoriaModel = require('../models/auditoriaModel');
const { getIo } = require('../socket');

const TRANSICOES_VALIDAS = {
  aguardando_separacao: ['em_separacao'],
  em_separacao: ['separado'],
  separado: ['expedido'],
  expedido: [],
  cancelado: [],
};

async function listar(query, idUsuario, perfil) {
  const pagina = parseInt(query.pagina) || 1;
  const limite = parseInt(query.limite) || 20;
  const busca = query.busca || '';
  const status = query.status || '';
  const idCliente = query.idCliente ? parseInt(query.idCliente) : null;
  const dataInicio = query.dataInicio || null;
  const dataFim = query.dataFim || null;

  const result = await pedidoModel.listar(pool, { pagina, limite, busca, status, idCliente, dataInicio, dataFim, idUsuario, perfil });
  return { ...result, pagina, limite };
}

async function buscarPorId(id, idUsuario, perfil) {
  const pedido = await pedidoModel.buscarPorId(pool, id);
  if (!pedido) throw Object.assign(new Error('Pedido não encontrado'), { status: 404 });
  if (perfil === 'vendedor' && pedido.id_usuario !== idUsuario) {
    throw Object.assign(new Error('Acesso negado'), { status: 403 });
  }
  const [itens, historico] = await Promise.all([
    pedidoModel.buscarItens(pool, id),
    pedidoModel.buscarHistoricoStatus(pool, id),
  ]);
  return { ...pedido, itens, historico };
}

async function criarPedido(idUsuario, { idCliente, itens }) {
  if (!idCliente) throw Object.assign(new Error('Cliente obrigatório'), { status: 400 });
  if (!itens || itens.length === 0) throw Object.assign(new Error('O pedido deve ter pelo menos um item'), { status: 400 });

  const cliente = await clienteModel.buscarPorId(pool, idCliente);
  if (!cliente) throw Object.assign(new Error('Cliente não encontrado'), { status: 404 });
  if (!cliente.ativo) throw Object.assign(new Error('Cliente inativo'), { status: 409 });

  // Agrupa por produto e soma quantidades
  const porProduto = new Map();
  for (const item of itens) {
    if (!item.idProduto || !item.quantidade || item.quantidade <= 0) {
      throw Object.assign(new Error('Item inválido: idProduto e quantidade positiva são obrigatórios'), { status: 400 });
    }
    porProduto.set(item.idProduto, (porProduto.get(item.idProduto) || 0) + item.quantidade);
  }

  // Valida e carrega produtos (antes da transação para não segurar lock desnecessariamente)
  const produtos = {};
  for (const idProduto of porProduto.keys()) {
    const p = await produtoModel.buscarPorId(pool, idProduto);
    if (!p) throw Object.assign(new Error(`Produto ${idProduto} não encontrado`), { status: 404 });
    if (!p.ativo) throw Object.assign(new Error(`Produto ${p.nome} inativo`), { status: 409 });
    produtos[idProduto] = p;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Ordena por id_produto para garantir ordem consistente e evitar deadlock (RNF12)
    const idsProdutos = [...porProduto.keys()].sort((a, b) => a - b);

    const todosItens = [];
    let valorTotal = 0;

    for (const idProduto of idsProdutos) {
      const quantidade = porProduto.get(idProduto);
      const produto = produtos[idProduto];

      const lotes = await loteModel.buscarLotesVigentesFefo(client, idProduto);
      const saldo = lotes.reduce((s, l) => s + parseFloat(l.quantidade_disponivel), 0);

      if (saldo < quantidade) {
        throw Object.assign(new Error(`Saldo insuficiente para ${produto.nome}`), { status: 409 });
      }

      let restante = quantidade;
      for (const lote of lotes) {
        if (restante <= 0) break;
        const usar = Math.min(restante, parseFloat(lote.quantidade_disponivel));
        todosItens.push({ idLote: lote.id_lote, quantidade: usar, precoUnitario: parseFloat(produto.preco_unitario) });
        valorTotal += usar * parseFloat(produto.preco_unitario);

        await client.query(
          'UPDATE lotes SET quantidade_disponivel = quantidade_disponivel - $1 WHERE id_lote = $2',
          [usar, lote.id_lote]
        );
        restante -= usar;
      }
    }

    const pedido = await pedidoModel.criar(client, { idCliente, idUsuario, valorTotal });

    for (const item of todosItens) {
      await pedidoModel.criarItem(client, { idPedido: pedido.id_pedido, ...item });
    }

    await pedidoModel.registrarHistoricoStatus(client, {
      idPedido: pedido.id_pedido, statusAnterior: null, novoStatus: 'aguardando_separacao', idUsuario,
    });

    await auditoriaModel.registrar(client, {
      idUsuario, acao: 'INSERT', tabela: 'pedidos',
      idRegistro: pedido.id_pedido, valorNovo: { id_cliente: idCliente, valor_total: valorTotal },
    });

    await client.query('COMMIT');

    const io = getIo();
    if (io) {
      io.emit('pedido:criado', { idPedido: pedido.id_pedido, status: 'aguardando_separacao' });
      io.emit('estoque:atualizado', { idsProdutos: [...porProduto.keys()] });
    }

    return buscarPorId(pedido.id_pedido, idUsuario, 'admin');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function atualizarStatus(idPedido, novoStatus, idUsuario, perfil) {
  const pedidoAtual = await pedidoModel.buscarPorId(pool, idPedido);
  if (!pedidoAtual) throw Object.assign(new Error('Pedido não encontrado'), { status: 404 });

  const statusAtual = pedidoAtual.status;
  const transicoesDiretas = TRANSICOES_VALIDAS[statusAtual] || [];
  const eRetrocesso = !transicoesDiretas.includes(novoStatus);

  if (eRetrocesso && perfil !== 'admin') {
    throw Object.assign(new Error('Somente o administrador pode retroceder o status'), { status: 403 });
  }

  const todosStatus = ['aguardando_separacao', 'em_separacao', 'separado', 'expedido'];
  const idxAtual = todosStatus.indexOf(statusAtual);
  const idxNovo = todosStatus.indexOf(novoStatus);

  if (!eRetrocesso && !transicoesDiretas.includes(novoStatus)) {
    throw Object.assign(new Error('Transição de status inválida'), { status: 409 });
  }
  if (eRetrocesso && (idxNovo < 0 || idxNovo >= idxAtual)) {
    throw Object.assign(new Error('Transição de status inválida'), { status: 409 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const pedido = await pedidoModel.buscarParaLock(client, idPedido);
    if (pedido.status !== statusAtual) throw Object.assign(new Error('Status do pedido foi alterado por outro usuário'), { status: 409 });

    await pedidoModel.atualizarStatus(client, idPedido, { status: novoStatus });
    await pedidoModel.registrarHistoricoStatus(client, {
      idPedido, statusAnterior: statusAtual, novoStatus, idUsuario,
    });
    await auditoriaModel.registrar(client, {
      idUsuario, acao: 'UPDATE', tabela: 'pedidos',
      idRegistro: idPedido,
      valorAnterior: { status: statusAtual },
      valorNovo: { status: novoStatus },
    });

    await client.query('COMMIT');

    const io = getIo();
    if (io) io.emit('pedido:status', { idPedido, statusAnterior: statusAtual, novoStatus });

    return pedidoModel.buscarPorId(pool, idPedido);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function cancelarPedido(idPedido, motivo, idUsuario, perfil) {
  if (!motivo || !motivo.trim()) throw Object.assign(new Error('Motivo de cancelamento é obrigatório'), { status: 400 });

  const pedidoAtual = await pedidoModel.buscarPorId(pool, idPedido);
  if (!pedidoAtual) throw Object.assign(new Error('Pedido não encontrado'), { status: 404 });
  if (pedidoAtual.status === 'expedido') throw Object.assign(new Error('Pedido expedido não pode ser cancelado'), { status: 409 });
  if (pedidoAtual.status === 'cancelado') throw Object.assign(new Error('Pedido já cancelado'), { status: 409 });
  if (perfil === 'vendedor' && pedidoAtual.id_usuario !== idUsuario) {
    throw Object.assign(new Error('Acesso negado'), { status: 403 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const pedido = await pedidoModel.buscarParaLock(client, idPedido);
    if (pedido.status === 'expedido') throw Object.assign(new Error('Pedido expedido não pode ser cancelado'), { status: 409 });
    if (pedido.status === 'cancelado') throw Object.assign(new Error('Pedido já cancelado'), { status: 409 });

    const itens = await pedidoModel.buscarItens(client, idPedido);
    const idsProdutos = [...new Set(itens.map(i => i.id_produto))];

    for (const item of itens) {
      await client.query(
        'UPDATE lotes SET quantidade_disponivel = quantidade_disponivel + $1 WHERE id_lote = $2',
        [item.quantidade, item.id_lote]
      );
    }

    await pedidoModel.atualizarStatus(client, idPedido, {
      status: 'cancelado',
      motivoCancelamento: motivo.trim(),
      dataCancelamento: new Date(),
    });

    await pedidoModel.registrarHistoricoStatus(client, {
      idPedido, statusAnterior: pedido.status, novoStatus: 'cancelado', idUsuario,
    });

    await auditoriaModel.registrar(client, {
      idUsuario, acao: 'UPDATE', tabela: 'pedidos',
      idRegistro: idPedido,
      valorAnterior: { status: pedido.status },
      valorNovo: { status: 'cancelado', motivo_cancelamento: motivo.trim() },
    });

    await client.query('COMMIT');

    const io = getIo();
    if (io) {
      io.emit('pedido:status', { idPedido, statusAnterior: pedido.status, novoStatus: 'cancelado' });
      io.emit('estoque:atualizado', { idsProdutos });
    }

    return pedidoModel.buscarPorId(pool, idPedido);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { listar, buscarPorId, criarPedido, atualizarStatus, cancelarPedido };
