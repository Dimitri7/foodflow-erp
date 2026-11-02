require('dotenv').config();

const http = require('http');
const app = require('./app');
const { inicializar } = require('./socket');
const { inicializarCron } = require('./cron');

const porta = process.env.PORT || 3001;
const servidor = http.createServer(app);

inicializar(servidor);
inicializarCron();

servidor.listen(porta, () => {
  console.log(`servidor ouvindo na porta ${porta}`);
});
