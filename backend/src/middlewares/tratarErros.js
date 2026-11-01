function tratarErros(err, req, res, next) {
  if (err.status) {
    return res.status(err.status).json({ erro: err.message });
  }

  // violação de UNIQUE
  if (err.code === '23505') {
    return res.status(409).json({ erro: 'Registro duplicado' });
  }

  // violação de CHECK ou NOT NULL
  if (err.code === '23514' || err.code === '23502') {
    return res.status(400).json({ erro: 'Valor inválido' });
  }

  // violação de FK
  if (err.code === '23503') {
    return res.status(409).json({ erro: 'Referência inválida' });
  }

  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
}

module.exports = tratarErros;
