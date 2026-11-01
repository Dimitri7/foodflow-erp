function permitirPerfis(...perfis) {
  return (req, res, next) => {
    if (!perfis.includes(req.usuario.perfil)) {
      return res.status(403).json({ erro: 'Acesso negado para este perfil' });
    }
    next();
  };
}

module.exports = permitirPerfis;
