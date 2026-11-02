const { Pool } = require('pg');

// pg-connection-string emite aviso para sslmode=require; verify-full é o equivalente explícito
const connectionString = (process.env.DATABASE_URL || '')
  .replace(/sslmode=(prefer|require|verify-ca)/g, 'sslmode=verify-full');

const pool = new Pool({ connectionString });

module.exports = pool;
