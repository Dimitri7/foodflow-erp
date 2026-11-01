function validarCNPJ(cnpj) {
  const n = cnpj.replace(/\D/g, '');
  if (n.length !== 14) return false;
  if (/^(\d)\1+$/.test(n)) return false;

  const digits = n.split('').map(Number);

  const calcDigito = (base, pesos) => {
    const soma = base.reduce((acc, v, i) => acc + v * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calcDigito(digits.slice(0, 12), pesos1);
  const d2 = calcDigito(digits.slice(0, 13), pesos2);

  return digits[12] === d1 && digits[13] === d2;
}

module.exports = { validarCNPJ };
