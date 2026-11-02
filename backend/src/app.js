require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const yaml = require('js-yaml');
const swaggerUi = require('swagger-ui-express');
const tratarErros = require('./middlewares/tratarErros');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

const spec = yaml.load(
  fs.readFileSync(path.join(__dirname, 'swagger/openapi.yaml'), 'utf8')
);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/produtos', require('./routes/produtos'));
app.use('/api/lotes',    require('./routes/lotes'));
app.use('/api/pedidos',  require('./routes/pedidos'));
app.use('/api/estoque',    require('./routes/estoque'));
app.use('/api/dashboard',  require('./routes/dashboard'));
app.use('/api/auditoria',  require('./routes/auditoria'));

app.use(tratarErros);

module.exports = app;
