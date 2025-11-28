/**
 * Conversor de telefones
 * Integra a conversão de notação científica com validação de telefones brasileiros
 */

const { handleScientificNotation, isScientificNotation } = require('./scientificNotationHandler');
const { isValidBrazilianPhone } = require('../validators/phoneValidator');

/**
 * Remove formatação de telefones
 * Ex: "(11) 99876-5432" -> "11998765432"
 */
function cleanPhoneFormat(value) {
  if (!value) return null;

  const str = String(value);

  // Remover caracteres não numéricos
  let cleaned = str.replace(/[^\d]/g, '');

  // Remover código do país se houver (+55)
  if (cleaned.startsWith('55') && cleaned.length > 11) {
    cleaned = cleaned.slice(2);
  }

  return cleaned || null;
}

/**
 * Converte valor de célula Excel para telefone brasileiro
 *
 * Processa:
 * - Notação científica (1.19988776655E+10)
 * - Números com decimais (11987654321.00)
 * - Strings formatadas ("(11) 99876-5432")
 * - Strings simples ("11987654321")
 *
 * Retorna string de dígitos ou null se inválido
 */
function convertToPhone(cellValue) {
  if (cellValue === null || cellValue === undefined || cellValue === '') {
    return null;
  }

  let processed;

  // Se está em notação científica, converter primeiro
  if (isScientificNotation(cellValue)) {
    processed = handleScientificNotation(cellValue);
  } else {
    // Se é número, converter para string e remover decimais
    processed = String(cellValue);

    // Remover parte decimal se houver (11987654321.00 -> 11987654321)
    if (processed.includes('.')) {
      processed = processed.split('.')[0];
    }
  }

  // Limpar formatação
  const cleaned = cleanPhoneFormat(processed);

  if (!cleaned) {
    return null;
  }

  // Retornar o telefone limpo (validação será feita separadamente se necessário)
  return cleaned;
}

/**
 * Converte e valida telefone
 * Retorna objeto com resultado e detalhes
 */
function convertAndValidate(cellValue) {
  const converted = convertToPhone(cellValue);

  const result = {
    original: cellValue,
    converted,
    isValid: false,
    errors: []
  };

  if (!converted) {
    result.errors.push('Não foi possível converter o valor');
    return result;
  }

  result.isValid = isValidBrazilianPhone(converted);

  if (!result.isValid) {
    // Adicionar detalhes do erro
    if (converted.length < 10) {
      result.errors.push(`Muito curto: ${converted.length} dígitos`);
    } else if (converted.length > 11) {
      result.errors.push(`Muito longo: ${converted.length} dígitos`);
    } else if (!/^[1-9][0-9]/.test(converted.slice(0, 2))) {
      result.errors.push(`DDD inválido: ${converted.slice(0, 2)}`);
    } else if (converted.length === 11 && converted[2] !== '9') {
      result.errors.push('Celular deve ter 9 como terceiro dígito');
    } else {
      result.errors.push('Formato inválido');
    }
  }

  return result;
}

module.exports = {
  convertToPhone,
  convertAndValidate,
  cleanPhoneFormat
};
