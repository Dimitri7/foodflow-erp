require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = (process.env.DATABASE_URL || '')
  .replace(/sslmode=(prefer|require|verify-ca)/g, 'sslmode=verify-full');
const pool = new Pool({ connectionString });

async function executar(arquivo) {
  const sql = fs.readFileSync(path.join(__dirname, arquivo), 'utf8');
  await pool.query(sql);
  console.log(`${arquivo} executado com sucesso`);
}

(async () => {
  try {
    await executar('schema.sql');
    await executar('seed.sql');
    console.log('banco pronto');
  } catch (err) {
    console.error('erro ao configurar o banco:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
