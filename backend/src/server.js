require('dotenv').config();

const http = require('http');
const app = require('./app');
const { inicializar } = require('./socket');

const porta = process.env.PORT || 3001;
const servidor = http.createServer(app);

inicializar(servidor);

servidor.listen(porta, () => {
  console.log(`servidor ouvindo na porta ${porta}`);
});
