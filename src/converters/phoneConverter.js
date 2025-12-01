/**
 * Conversor de telefones
 * Integra a conversão de notação científica com validação de telefones brasileiros
 */

const { handleScientificNotation, isScientificNotation } = require('./scientificNotationHandler');
const { isValidBrazilianPhone } = require('../validators/phoneValidator');

/**
 * Remove emojis e caracteres especiais Unicode
 */
function removeEmojis(str) {
  if (!str) return str;

  // Remove emojis e símbolos Unicode (incluindo bandeiras, símbolos, etc)
  // Usando regex mais abrangente que captura todos os emojis
  return str.replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Símbolos & Pictogramas
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transporte & Símbolos de Mapa
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Bandeiras (iOS)
    .replace(/[\u{2600}-\u{26FF}]/gu, '') // Símbolos diversos
    .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Símbolos e Pictogramas Suplementares
    .replace(/[\u{1FA00}-\u{1FAFF}]/gu, '') // Símbolos e Pictogramas Estendidos-A (aumentado range)
    .replace(/[\u{1FAB0}-\u{1FABF}]/gu, '') // Símbolos de Comida e Bebida
    .replace(/[\u{1FAC0}-\u{1FAFF}]/gu, '') // Símbolos de Pessoas e Gestos
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '') // Seletores de variação
    .replace(/[\u{200D}]/gu, '') // Zero Width Joiner
    .replace(/[\u{E0000}-\u{E007F}]/gu, '') // Tags
    .replace(/[\u{1F000}-\u{1F02F}]/gu, '') // Peças de Mahjong
    .replace(/[\u{1F0A0}-\u{1F0FF}]/gu, '') // Cartas de baralho
    .replace(/[\u{1F100}-\u{1F1FF}]/gu, '') // Símbolos alfanuméricos encapsulados
    .replace(/[\u{1F200}-\u{1F2FF}]/gu, '') // Ideogramas chineses encapsulados
    .replace(/[\u{1F780}-\u{1F7FF}]/gu, '') // Símbolos geométricos estendidos
    .replace(/[\u{1F800}-\u{1F8FF}]/gu, '') // Flechas suplementares-C
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, ''); // Símbolos e Pictogramas Estendidos-A adicionais
}

/**
 * Remove formatação de telefones
 * Ex: "(11) 99876-5432" -> "11998765432"
 */
function cleanPhoneFormat(value) {
  if (!value) return null;

  let str = String(value);

  // Primeiro remove emojis
  str = removeEmojis(str);

  // Remover caracteres não numéricos
  let cleaned = str.replace(/[^\d]/g, '');

  // Remover código do país se houver (+55)
  if (cleaned.startsWith('55') && cleaned.length > 11) {
    cleaned = cleaned.slice(2);
  }

  // Remover código de operadora antigo (0XX) no início
  // Exemplos: 041, 015, 021, 031, etc
  // Formato antigo: 0 + código operadora (2 dígitos) + DDD + número
  // 04145999081122 -> remove "041" -> 45999081122
  if (cleaned.length >= 13 && cleaned.startsWith('0')) {
    // Verifica se após o 0 tem 2 dígitos que formam um DDD válido (11-99)
    const possibleCarrier = cleaned.substring(0, 3); // Ex: "041"
    const afterCarrier = cleaned.substring(3, 5); // Ex: "45"

    // Se tem padrão 0XX onde XX é um DDD válido (10-99), remove os 3 primeiros
    if (/^0[1-9][0-9]$/.test(possibleCarrier) && parseInt(afterCarrier) >= 11 && parseInt(afterCarrier) <= 99) {
      cleaned = cleaned.slice(3);
    }
  }

  // Remover zero à esquerda adicional (casos como 045999...)
  if (cleaned.length === 12 && cleaned.startsWith('0')) {
    const ddd = cleaned.substring(1, 3);
    if (parseInt(ddd) >= 11 && parseInt(ddd) <= 99) {
      cleaned = cleaned.slice(1);
    }
  }

  // Corrigir telefones com 13 dígitos que têm 2 DDDs concatenados
  // Exemplo: 4145999081122 = 41 (DDD) + 45 (DDD) + 999081122 (número)
  // Deve ficar: 45999081122 (DDD + número)
  if (cleaned.length === 13) {
    const firstDDD = cleaned.substring(0, 2);
    const secondDDD = cleaned.substring(2, 4);
    const restDigits = cleaned.substring(4);

    // Verifica se os 4 primeiros dígitos formam 2 DDDs válidos
    const firstDDDNum = parseInt(firstDDD);
    const secondDDDNum = parseInt(secondDDD);

    if (firstDDDNum >= 11 && firstDDDNum <= 99 &&
        secondDDDNum >= 11 && secondDDDNum <= 99 &&
        restDigits.length === 9) {
      // Remove o primeiro DDD, mantém o segundo + número
      cleaned = secondDDD + restDigits;
    }
  }

  // Corrigir telefones com 12 dígitos que podem ter um DDD extra no início
  // Exemplo: 414599081122 = 41 (DDD extra) + 4599081122 (DDD + número válido)
  if (cleaned.length === 12) {
    const firstTwo = cleaned.substring(0, 2);
    const rest = cleaned.substring(2); // 10 dígitos restantes

    const firstDDDNum = parseInt(firstTwo);

    // Se os 2 primeiros formam um DDD válido E os 10 seguintes começam com DDD válido
    if (firstDDDNum >= 11 && firstDDDNum <= 99) {
      const secondDDD = rest.substring(0, 2);
      const secondDDDNum = parseInt(secondDDD);

      // Se forma um telefone válido de 10 ou 11 dígitos
      if (secondDDDNum >= 11 && secondDDDNum <= 99 &&
          (rest.length === 10 || rest.length === 11)) {
        // Remove o primeiro DDD
        cleaned = rest;
      }
    }
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
  cleanPhoneFormat,
  removeEmojis
};
