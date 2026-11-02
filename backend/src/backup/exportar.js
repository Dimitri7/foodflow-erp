require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const path = require('path');
const fs = require('fs');
const pool = require('../config/db');

const DIR_BACKUPS = path.join(__dirname, '../../backups');
const MAX_BACKUPS = 7;
const TABELAS = [
  'usuarios', 'clientes', 'produtos', 'lotes', 'pedidos',
  'itens_pedido', 'historico_status_pedido', 'logs_auditoria', 'tokens_redefinicao_senha',
];

async function exportar() {
  fs.mkdirSync(DIR_BACKUPS, { recursive: true });

  const dados = {};
  for (const tabela of TABELAS) {
    const { rows } = await pool.query(`SELECT * FROM ${tabela} ORDER BY 1`);
    dados[tabela] = rows;
  }

  const nome = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const caminho = path.join(DIR_BACKUPS, nome);
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
  console.log(`Backup criado: ${nome}`);

  // manter só os MAX_BACKUPS mais recentes
  const arquivos = fs.readdirSync(DIR_BACKUPS)
    .filter((f) => f.endsWith('.json'))
    .sort();
  for (const velho of arquivos.slice(0, -MAX_BACKUPS)) {
    fs.unlinkSync(path.join(DIR_BACKUPS, velho));
    console.log(`Backup removido: ${velho}`);
  }
}

// executa direto só quando chamado via CLI
if (require.main === module) {
  exportar()
    .then(() => pool.end())
    .catch((err) => { console.error(err); process.exit(1); });
}

module.exports = { exportar };
