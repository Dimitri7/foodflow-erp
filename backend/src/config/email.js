const nodemailer = require('nodemailer');

let transportador;

async function getTransportador() {
  if (transportador) return transportador;
  const conta = await nodemailer.createTestAccount();
  transportador = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: conta.user, pass: conta.pass },
  });
  return transportador;
}

module.exports = { getTransportador };
