/**
 * Converte números em notação científica para string de dígitos
 *
 * IMPORTANTE: Usa manipulação de strings para evitar perda de precisão
 * que ocorre com Number, parseInt ou parseFloat
 */

function handleScientificNotation(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Converter para string e normalizar
  const str = String(value).toUpperCase().trim();

  // Se não tem notação científica, retornar como está
  if (!str.includes('E')) {
    // Remover ponto decimal se houver
    return str.replace('.', '').replace(/^0+/, '') || '0';
  }

  try {
    // Separar mantissa e expoente
    const [mantissa, exponentStr] = str.split('E');
    const exponent = parseInt(exponentStr);

    // Separar parte inteira e decimal da mantissa
    const [intPart, decPart = ''] = mantissa.split('.');

    // Remover sinal negativo se houver (trataremos depois)
    const isNegative = intPart.startsWith('-');
    const cleanIntPart = isNegative ? intPart.slice(1) : intPart;

    // Combinar todos os dígitos da mantissa
    const allDigits = cleanIntPart + decPart;

    let result;

    if (exponent >= 0) {
      // Expoente positivo: mover decimal para direita
      // Ex: 1.19988776655E+10 -> precisamos mover 10 casas
      const zerosToAdd = Math.max(0, exponent - decPart.length);
      result = allDigits + '0'.repeat(zerosToAdd);
    } else {
      // Expoente negativo: mover decimal para esquerda
      const absExp = Math.abs(exponent);
      const zerosToAdd = Math.max(0, absExp - cleanIntPart.length);
      result = '0'.repeat(zerosToAdd) + allDigits;
    }

    // Remover zeros à esquerda
    result = result.replace(/^0+/, '') || '0';

    return isNegative ? '-' + result : result;

  } catch (error) {
    console.error('Erro ao converter notação científica:', error);
    return null;
  }
}

/**
 * Detecta se um valor está em notação científica
 */
function isScientificNotation(value) {
  if (value === null || value === undefined || value === '') {
    return false;
  }
  const str = String(value).toUpperCase();
  return /[0-9.]+E[+-]?[0-9]+/.test(str);
}

module.exports = {
  handleScientificNotation,
  isScientificNotation
};
