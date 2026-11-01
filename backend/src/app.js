require('dotenv').config();

const express = require('express');
const cors = require('cors');
const tratarErros = require('./middlewares/tratarErros');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/produtos', require('./routes/produtos'));
app.use('/api/lotes',    require('./routes/lotes'));
app.use('/api/pedidos',  require('./routes/pedidos'));
app.use('/api/estoque',  require('./routes/estoque'));

app.use(tratarErros);

module.exports = app;
