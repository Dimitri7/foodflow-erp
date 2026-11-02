const cron = require('node-cron');
const { exportar } = require('./backup/exportar');

function inicializarCron() {
  if (process.env.BACKUP_AUTOMATICO !== 'true') return;
  // todo dia às 02:00
  cron.schedule('0 2 * * *', () => {
    exportar().catch((err) => console.error('Falha no backup automático:', err));
  });
  console.log('Backup automático agendado para 02:00 diariamente');
}

module.exports = { inicializarCron };
