require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const path = require('path');
const fs = require('fs');
const pool = require('../config/db');

const DIR_BACKUPS = path.join(__dirname, '../../backups');
// tabelas na ordem de inserção (respeitando FK); inverso para truncate
const TABELAS = [
  'usuarios', 'clientes', 'produtos', 'lotes', 'pedidos',
  'itens_pedido', 'historico_status_pedido', 'logs_auditoria', 'tokens_redefinicao_senha',
];

async function restaurar(caminhoArquivo) {
  if (!caminhoArquivo) {
    const lista = fs.readdirSync(DIR_BACKUPS)
      .filter((f) => f.endsWith('.json'))
      .sort();
    if (!lista.length) throw new Error('Nenhum backup encontrado em ' + DIR_BACKUPS);
    caminhoArquivo = path.join(DIR_BACKUPS, lista[lista.length - 1]);
  }

  console.log(`Restaurando de: ${caminhoArquivo}`);
  const dados = JSON.parse(fs.readFileSync(caminhoArquivo, 'utf8'));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // truncar em ordem inversa para respeitar FK
    for (const tabela of [...TABELAS].reverse()) {
      await client.query(`TRUNCATE ${tabela} RESTART IDENTITY CASCADE`);
    }

    // inserir em ordem direta
    for (const tabela of TABELAS) {
      const rows = dados[tabela] ?? [];
      for (const row of rows) {
        const colunas = Object.keys(row);
        const marcadores = colunas.map((_, i) => `$${i + 1}`);
        await client.query(
          `INSERT INTO ${tabela} (${colunas.join(', ')}) VALUES (${marcadores.join(', ')})`,
          Object.values(row)
        );
      }
    }

    // ajustar sequências para evitar conflito no próximo cadastro
    const sequencias = [
      ['usuarios',                  'id_usuario'],
      ['clientes',                  'id_cliente'],
      ['produtos',                  'id_produto'],
      ['lotes',                     'id_lote'],
      ['pedidos',                   'id_pedido'],
      ['itens_pedido',              'id_item'],
      ['historico_status_pedido',   'id'],
      ['logs_auditoria',            'id_log'],
      ['tokens_redefinicao_senha',  'id'],
    ];
    for (const [tabela, col] of sequencias) {
      await client.query(
        `SELECT setval(pg_get_serial_sequence('${tabela}', '${col}'),
                       COALESCE((SELECT MAX(${col}) FROM ${tabela}), 0) + 1, false)`
      );
    }

    await client.query('COMMIT');
    console.log('Restauração concluída com sucesso.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  const argArquivo = process.argv[2] ? path.resolve(process.argv[2]) : undefined;
  restaurar(argArquivo)
    .then(() => pool.end())
    .catch((err) => { console.error(err); process.exit(1); });
}

module.exports = { restaurar };
