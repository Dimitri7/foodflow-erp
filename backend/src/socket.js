const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

function inicializar(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Token obrigatório'));
    try {
      socket.usuario = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  return io;
}

function getIo() {
  return io;
}

module.exports = { inicializar, getIo };
