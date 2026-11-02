require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { inicializar } = require('../src/socket');
const app = require('../src/app');
const { io: clientIo } = require('socket.io-client');
const pool = require('../src/config/db');

let servidor;
let porta;
const tokens = {};

function url(caminho) {
  return `http://localhost:${porta}${caminho}`;
}

async function req(metodo, caminho, corpo, token) {
  const cabecalhos = { 'Content-Type': 'application/json' };
  if (token) cabecalhos['Authorization'] = `Bearer ${token}`;
  const resposta = await fetch(url(caminho), {
    method: metodo,
    headers: cabecalhos,
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  });
  const json = await resposta.json().catch(() => null);
  return { status: resposta.status, body: json };
}

async function criarProduto(nome) {
  const r = await req('POST', '/api/produtos', {
    nome,
    categoria: 'Teste',
    unidade: 'cx',
    precoUnitario: 10.00,
    estoqueMinimo: 1,
  }, tokens.admin);
  assert.equal(r.status, 201, `criarProduto "${nome}" falhou: ${JSON.stringify(r.body)}`);
  return r.body.id_produto;
}

async function criarLote(idProduto, codigoLote, quantidade, dataValidade = '2027-12-31') {
  const r = await req('POST', '/api/lotes', {
    idProduto,
    codigoLote,
    dataValidade,
    quantidadeDisponivel: quantidade,
  }, tokens.admin);
  assert.equal(r.status, 201, `criarLote "${codigoLote}" falhou: ${JSON.stringify(r.body)}`);
  return r.body.id_lote;
}

before(async () => {
  servidor = http.createServer(app);
  inicializar(servidor);
  await new Promise(resolve => servidor.listen(0, resolve));
  porta = servidor.address().port;

  for (const [chave, email] of [
    ['admin',    'admin@foodflow.com'],
    ['vendedor', 'vendedor@foodflow.com'],
    ['vendedor2','vendedor2@foodflow.com'],
    ['operador', 'operador@foodflow.com'],
  ]) {
    const r = await req('POST', '/api/auth/login', { email, senha: 'foodflow123' });
    assert.equal(r.status, 200, `login de ${email} falhou`);
    tokens[chave] = r.body.token;
  }
});

after(() => new Promise(resolve => servidor.close(resolve)));

test('login correto retorna token', async () => {
  const r = await req('POST', '/api/auth/login', { email: 'admin@foodflow.com', senha: 'foodflow123' });
  assert.equal(r.status, 200);
  assert.equal(typeof r.body.token, 'string');
});

test('login com senha errada retorna 401', async () => {
  const r = await req('POST', '/api/auth/login', { email: 'admin@foodflow.com', senha: 'errada' });
  assert.equal(r.status, 401);
});

test('rota protegida sem token retorna 401', async () => {
  const r = await req('GET', '/api/pedidos');
  assert.equal(r.status, 401);
});

test('vendedor vê só seus pedidos; admin vê de todos', async () => {
  const rv = await req('GET', '/api/pedidos', undefined, tokens.vendedor);
  assert.equal(rv.status, 200);
  for (const p of rv.body.dados) {
    assert.equal(p.id_usuario, 2, 'vendedor não deve ver pedidos de outro usuário');
  }
  const ra = await req('GET', '/api/pedidos', undefined, tokens.admin);
  assert.equal(ra.status, 200);
  const usuarios = new Set(ra.body.dados.map(p => p.id_usuario));
  assert.ok(usuarios.size >= 2, 'admin deve ver pedidos de múltiplos usuários');
});

test('detalhe do pedido traz itens com lote e validade e histórico', async () => {
  const r = await req('GET', '/api/pedidos/1', undefined, tokens.admin);
  assert.equal(r.status, 200);
  assert.ok(r.body.itens.length > 0);
  assert.ok(r.body.itens[0].codigo_lote);
  assert.ok(r.body.itens[0].data_validade);
  assert.ok(r.body.historico.length > 0);
});

test('CA01 - pedido de 20 un usa L1, que fica com 10', async () => {
  const idProduto = await criarProduto('Produto CA01');
  await criarLote(idProduto, 'L1-CA01', 30, '2026-12-10');

  const r = await req('POST', '/api/pedidos', {
    idCliente: 1,
    itens: [{ idProduto, quantidade: 20 }],
  }, tokens.vendedor);
  assert.equal(r.status, 201);

  const estoque = await req('GET', `/api/estoque/${idProduto}`, undefined, tokens.admin);
  const l1 = estoque.body.lotes.find(l => l.codigo_lote === 'L1-CA01');
  assert.equal(parseFloat(l1.quantidade_disponivel), 10);
});

test('CA02 - pedido de 40 un gera dois itens: 30 de L1 e 10 de L2', async () => {
  const idProduto = await criarProduto('Produto CA02');
  await criarLote(idProduto, 'L1-CA02', 30, '2026-12-10');
  await criarLote(idProduto, 'L2-CA02', 50, '2027-06-30');

  const r = await req('POST', '/api/pedidos', {
    idCliente: 1,
    itens: [{ idProduto, quantidade: 40 }],
  }, tokens.vendedor);
  assert.equal(r.status, 201);

  const l1 = r.body.itens.find(i => i.codigo_lote === 'L1-CA02');
  const l2 = r.body.itens.find(i => i.codigo_lote === 'L2-CA02');
  assert.ok(l1, 'L1 deve aparecer nos itens');
  assert.ok(l2, 'L2 deve aparecer nos itens');
  assert.equal(parseFloat(l1.quantidade), 30);
  assert.equal(parseFloat(l2.quantidade), 10);
});

test('CA03 - pedido de 100 un com saldo 80 retorna 409 e nada é gravado', async () => {
  const idProduto = await criarProduto('Produto CA03');
  await criarLote(idProduto, 'L1-CA03', 30, '2026-12-10');
  await criarLote(idProduto, 'L2-CA03', 50, '2027-06-30');

  const antes = await req('GET', `/api/estoque/${idProduto}`, undefined, tokens.admin);
  assert.equal(antes.body.saldoTotal, 80);

  const r = await req('POST', '/api/pedidos', {
    idCliente: 1,
    itens: [{ idProduto, quantidade: 100 }],
  }, tokens.vendedor);
  assert.equal(r.status, 409);
  assert.ok(r.body.erro.includes('Saldo insuficiente'));

  const depois = await req('GET', `/api/estoque/${idProduto}`, undefined, tokens.admin);
  assert.equal(depois.body.saldoTotal, 80, 'saldo não deve ter mudado após falha');
});

test('CA04 - L1 vencido e L2 vigente: pedido de 10 un usa L2, L1 não entra', async () => {
  // Seed: Feijão (id=2), L3 vencido (2024), L4 vigente (2027-06-30, qtd=25)
  const r = await req('POST', '/api/pedidos', {
    idCliente: 1,
    itens: [{ idProduto: 2, quantidade: 10 }],
  }, tokens.vendedor);
  assert.equal(r.status, 201);

  const lotesCodigos = r.body.itens.map(i => i.codigo_lote);
  assert.ok(!lotesCodigos.includes('L3'), 'L3 vencido não deve ser usado');
  assert.ok(lotesCodigos.includes('L4'), 'L4 vigente deve ser usado');
  assert.equal(parseFloat(r.body.itens.find(i => i.codigo_lote === 'L4').quantidade), 10);
});

test('CA05 - terceiro item com saldo insuficiente: 409 e saldos inalterados', async () => {
  const idA = await criarProduto('Produto CA05-A');
  const idB = await criarProduto('Produto CA05-B');
  const idC = await criarProduto('Produto CA05-C');
  await criarLote(idA, 'L-CA05A', 20);
  await criarLote(idB, 'L-CA05B', 20);
  await criarLote(idC, 'L-CA05C', 5);

  const r = await req('POST', '/api/pedidos', {
    idCliente: 1,
    itens: [
      { idProduto: idA, quantidade: 5 },
      { idProduto: idB, quantidade: 5 },
      { idProduto: idC, quantidade: 10 },
    ],
  }, tokens.vendedor);
  assert.equal(r.status, 409);

  const [eA, eB, eC] = await Promise.all([
    req('GET', `/api/estoque/${idA}`, undefined, tokens.admin),
    req('GET', `/api/estoque/${idB}`, undefined, tokens.admin),
    req('GET', `/api/estoque/${idC}`, undefined, tokens.admin),
  ]);
  assert.equal(eA.body.saldoTotal, 20, 'saldo A não deve ter mudado');
  assert.equal(eB.body.saldoTotal, 20, 'saldo B não deve ter mudado');
  assert.equal(eC.body.saldoTotal, 5, 'saldo C não deve ter mudado');
});

test('CA06 - dois pedidos simultâneos de 20 un sobre L1 com 30: saldo nunca negativo', async () => {
  const idProduto = await criarProduto('Produto CA06');
  await criarLote(idProduto, 'L1-CA06', 30);

  const [r1, r2] = await Promise.all([
    req('POST', '/api/pedidos', { idCliente: 1, itens: [{ idProduto, quantidade: 20 }] }, tokens.vendedor),
    req('POST', '/api/pedidos', { idCliente: 2, itens: [{ idProduto, quantidade: 20 }] }, tokens.vendedor2),
  ]);

  const codigos = [r1.status, r2.status].sort((a, b) => a - b);
  assert.deepEqual(codigos, [201, 409], 'exatamente um deve ter sucesso e um deve falhar');

  const estoque = await req('GET', `/api/estoque/${idProduto}`, undefined, tokens.admin);
  assert.ok(estoque.body.saldoTotal >= 0, 'saldo nunca pode ser negativo');
});

test('CA07 - pedido confirmado dispara evento pedido:criado no socket', async () => {
  const idProduto = await criarProduto('Produto CA07');
  await criarLote(idProduto, 'L1-CA07', 50);

  await new Promise((resolve, reject) => {
    const cliente = clientIo(`http://localhost:${porta}`, { auth: { token: tokens.operador } });

    const timeout = setTimeout(() => {
      cliente.close();
      reject(new Error('Timeout: evento pedido:criado não chegou em 3 s'));
    }, 3000);

    cliente.on('pedido:criado', ({ idPedido }) => {
      clearTimeout(timeout);
      cliente.close();
      assert.equal(typeof idPedido, 'number');
      resolve();
    });

    cliente.on('connect', () => {
      req('POST', '/api/pedidos', {
        idCliente: 1,
        itens: [{ idProduto, quantidade: 1 }],
      }, tokens.vendedor).catch(err => {
        clearTimeout(timeout);
        cliente.close();
        reject(err);
      });
    });

    cliente.on('connect_error', err => {
      clearTimeout(timeout);
      reject(err);
    });
  });
});

test('CA08 - mover de aguardando_separacao direto para expedido é recusado', async () => {
  const antes = await req('GET', '/api/pedidos/1', undefined, tokens.admin);
  assert.equal(antes.body.status, 'aguardando_separacao');

  const r = await req('PATCH', '/api/pedidos/1/status', { status: 'expedido' }, tokens.operador);
  assert.ok(r.status >= 400, `esperava erro mas recebeu ${r.status}`);

  const depois = await req('GET', '/api/pedidos/1', undefined, tokens.admin);
  assert.equal(depois.body.status, 'aguardando_separacao', 'status não deve ter mudado');
});

test('CA11 - operador não pode criar pedido: 403', async () => {
  const listaAntes = await req('GET', '/api/pedidos', undefined, tokens.admin);
  const totalAntes = listaAntes.body.total;

  const r = await req('POST', '/api/pedidos', {
    idCliente: 1,
    itens: [{ idProduto: 1, quantidade: 1 }],
  }, tokens.operador);
  assert.equal(r.status, 403);

  const listaDepois = await req('GET', '/api/pedidos', undefined, tokens.admin);
  assert.equal(listaDepois.body.total, totalAntes, 'nenhum pedido deve ter sido criado');
});

test('CA12 - operador registra lote: saldo aumenta e logs_auditoria tem registro', async () => {
  const idProduto = await criarProduto('Produto CA12');

  const r = await req('POST', '/api/lotes', {
    idProduto,
    codigoLote: 'L3-CA12',
    dataValidade: '2027-12-31',
    quantidadeDisponivel: 100,
  }, tokens.operador);
  assert.equal(r.status, 201, `criação do lote falhou: ${JSON.stringify(r.body)}`);

  const estoque = await req('GET', `/api/estoque/${idProduto}`, undefined, tokens.admin);
  assert.equal(estoque.body.saldoTotal, 100);

  const { rows } = await pool.query(
    `SELECT * FROM logs_auditoria WHERE tabela_afetada = 'lotes' AND id_registro = $1`,
    [r.body.id_lote]
  );
  assert.ok(rows.length > 0, 'logs_auditoria deve ter registro da criação do lote');
  assert.equal(rows[0].acao, 'INSERT');
});

test('CA14 - usuário inativo com senha correta não autentica: 401', async () => {
  const r = await req('POST', '/api/auth/login', { email: 'inativo@foodflow.com', senha: 'foodflow123' });
  assert.equal(r.status, 401);
});

test('CA09 - cancelamento com estorno: pedido em_separacao volta o saldo ao lote', async () => {
  const idProduto = await criarProduto('Produto CA09');
  await criarLote(idProduto, 'L1-CA09', 30);

  const criacao = await req('POST', '/api/pedidos', {
    idCliente: 1,
    itens: [{ idProduto, quantidade: 30 }],
  }, tokens.vendedor);
  assert.equal(criacao.status, 201, `criação do pedido falhou: ${JSON.stringify(criacao.body)}`);
  const idPedido = criacao.body.id_pedido;

  const avancar = await req('PATCH', `/api/pedidos/${idPedido}/status`, { status: 'em_separacao' }, tokens.operador);
  assert.equal(avancar.status, 200, `avanço para em_separacao falhou: ${JSON.stringify(avancar.body)}`);

  const cancelar = await req('PATCH', `/api/pedidos/${idPedido}/cancelar`, { motivo: 'Cancelamento de teste CA09' }, tokens.vendedor);
  assert.equal(cancelar.status, 200, `cancelamento falhou: ${JSON.stringify(cancelar.body)}`);
  assert.equal(cancelar.body.status, 'cancelado');

  const estoque = await req('GET', `/api/estoque/${idProduto}`, undefined, tokens.admin);
  assert.equal(Number(estoque.body.saldoTotal), 30, 'saldo deve ter voltado a 30 após estorno');
});

test('CA10 - cancelar pedido expedido é recusado: 409', async () => {
  const idProduto = await criarProduto('Produto CA10');
  await criarLote(idProduto, 'L1-CA10', 10);

  const criacao = await req('POST', '/api/pedidos', {
    idCliente: 1,
    itens: [{ idProduto, quantidade: 5 }],
  }, tokens.vendedor);
  assert.equal(criacao.status, 201);
  const idPedido = criacao.body.id_pedido;

  for (const status of ['em_separacao', 'separado', 'expedido']) {
    const r = await req('PATCH', `/api/pedidos/${idPedido}/status`, { status }, tokens.operador);
    assert.equal(r.status, 200, `avanço para ${status} falhou: ${JSON.stringify(r.body)}`);
  }

  const cancelar = await req('PATCH', `/api/pedidos/${idPedido}/cancelar`, { motivo: 'Tentativa inválida' }, tokens.admin);
  assert.equal(cancelar.status, 409);
});

test('CA13 - rastreio de lote lista os pedidos que o consumiram', async () => {
  const idProduto = await criarProduto('Produto CA13');
  const idLote = await criarLote(idProduto, 'L1-CA13', 100);

  const p1 = await req('POST', '/api/pedidos', {
    idCliente: 1,
    itens: [{ idProduto, quantidade: 10 }],
  }, tokens.vendedor);
  assert.equal(p1.status, 201);

  const p2 = await req('POST', '/api/pedidos', {
    idCliente: 2,
    itens: [{ idProduto, quantidade: 20 }],
  }, tokens.vendedor2);
  assert.equal(p2.status, 201);

  const rastreio = await req('GET', `/api/lotes/${idLote}/rastreio`, undefined, tokens.admin);
  assert.equal(rastreio.status, 200, `rastreio falhou: ${JSON.stringify(rastreio.body)}`);
  assert.equal(rastreio.body.length, 2, 'deve listar os dois pedidos');
});

test('ajuste de lote altera quantidade e registra na auditoria', async () => {
  const idProduto = await criarProduto('Produto Ajuste');
  const idLote = await criarLote(idProduto, 'L1-Ajuste', 50);

  const r = await req('PUT', `/api/lotes/${idLote}/ajuste`, {
    quantidade: 30,
    justificativa: 'Avaria identificada na contagem física',
  }, tokens.operador);
  assert.equal(r.status, 200, `ajuste falhou: ${JSON.stringify(r.body)}`);
  assert.equal(Number(r.body.quantidade_disponivel), 30);

  const { rows } = await pool.query(
    `SELECT * FROM logs_auditoria WHERE tabela_afetada = 'lotes' AND id_registro = $1 AND acao = 'UPDATE'`,
    [idLote]
  );
  assert.ok(rows.length > 0, 'auditoria do ajuste deve existir');
});

test('alertas lista produtos com saldo igual ou abaixo do estoque mínimo', async () => {
  const criacao = await req('POST', '/api/produtos', {
    nome: 'Produto Alerta',
    categoria: 'Teste',
    unidade: 'cx',
    precoUnitario: 10.00,
    estoqueMinimo: 100,
  }, tokens.admin);
  assert.equal(criacao.status, 201, `criação do produto alerta falhou: ${JSON.stringify(criacao.body)}`);
  const idProduto = criacao.body.id_produto;
  await criarLote(idProduto, 'L1-Alerta', 10);

  const r = await req('GET', '/api/produtos/alertas', undefined, tokens.admin);
  assert.equal(r.status, 200, `alertas falhou: ${JSON.stringify(r.body)}`);
  const encontrado = r.body.find(p => p.id_produto === idProduto);
  assert.ok(encontrado, 'produto com saldo abaixo do mínimo deve aparecer nos alertas');
});

test('dashboard retorna indicadores gerenciais', async () => {
  const r = await req('GET', '/api/dashboard', undefined, tokens.admin);
  assert.equal(r.status, 200, `dashboard falhou: ${JSON.stringify(r.body)}`);
  assert.ok('faturamentoDia' in r.body, 'deve ter faturamentoDia');
  assert.ok('valorEstoque' in r.body, 'deve ter valorEstoque');
  assert.ok('lotesAVencer' in r.body, 'deve ter lotesAVencer');
  assert.ok(Array.isArray(r.body.vendasPorDia), 'vendasPorDia deve ser array');
  assert.ok(Array.isArray(r.body.maisVendidos), 'maisVendidos deve ser array');
});

test('auditoria lista registros com paginação e filtra por ação', async () => {
  const lista = await req('GET', '/api/auditoria', undefined, tokens.admin);
  assert.equal(lista.status, 200, `auditoria falhou: ${JSON.stringify(lista.body)}`);
  assert.ok(Array.isArray(lista.body.dados), 'dados deve ser array');
  assert.ok(typeof lista.body.total === 'number', 'total deve ser número');

  const filtrado = await req('GET', '/api/auditoria?acao=INSERT', undefined, tokens.admin);
  assert.equal(filtrado.status, 200);
  assert.ok(filtrado.body.dados.every(r => r.acao === 'INSERT'), 'todos os registros filtrados devem ser INSERT');
});
