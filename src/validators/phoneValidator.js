/**
 * Validador de números de telefone brasileiros
 */

/**
 * Valida se um número é um telefone brasileiro válido
 *
 * Regras:
 * - 10 dígitos (fixo) ou 11 dígitos (celular)
 * - DDD válido: 11-99 (primeiro dígito 1-9, segundo 0-9)
 * - Celular (11 dígitos): terceiro dígito deve ser 9
 * - Não aceita números com todos dígitos iguais
 */
function isValidBrazilianPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // Deve ter exatamente 10 ou 11 dígitos
  if (!/^\d{10,11}$/.test(phone)) {
    return false;
  }

  // Extrair DDD (área code) e número
  const areaCode = phone.slice(0, 2);
  const number = phone.slice(2);

  // Validar DDD: primeiro dígito 1-9, segundo 0-9
  if (!/^[1-9][0-9]$/.test(areaCode)) {
    return false;
  }

  // Se é celular (11 dígitos), terceiro dígito deve ser 9
  if (phone.length === 11 && phone[2] !== '9') {
    return false;
  }

  // Rejeitar números com todos dígitos iguais (ex: 11111111, 99999999)
  if (/^(.)\1{7,}$/.test(number)) {
    return false;
  }

  // Rejeitar sequências óbvias de teste
  if (number === '12345678' || number === '123456789') {
    return false;
  }

  return true;
}

/**
 * Retorna o tipo de telefone
 */
function getPhoneType(phone) {
  if (!isValidBrazilianPhone(phone)) {
    return 'invalid';
  }
  return phone.length === 11 ? 'mobile' : 'landline';
}

/**
 * Formata um telefone brasileiro (apenas para exibição)
 */
function formatBrazilianPhone(phone) {
  if (!isValidBrazilianPhone(phone)) {
    return phone;
  }

  if (phone.length === 11) {
    // Celular: (11) 99876-5432
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
  } else {
    // Fixo: (11) 3456-7890
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
  }
}

/**
 * Valida e retorna relatório detalhado
 */
function validateAndReport(phone) {
  const report = {
    phone,
    isValid: false,
    type: null,
    errors: []
  };

  if (!phone || typeof phone !== 'string') {
    report.errors.push('Telefone vazio ou inválido');
    return report;
  }

  if (!/^\d{10,11}$/.test(phone)) {
    report.errors.push(`Comprimento inválido: ${phone.length} dígitos (esperado: 10-11)`);
    return report;
  }

  const areaCode = phone.slice(0, 2);
  if (!/^[1-9][0-9]$/.test(areaCode)) {
    report.errors.push(`DDD inválido: ${areaCode}`);
  }

  if (phone.length === 11 && phone[2] !== '9') {
    report.errors.push('Celular deve ter 9 como terceiro dígito');
  }

  const number = phone.slice(2);
  if (/^(.)\1{7,}$/.test(number)) {
    report.errors.push('Número com todos dígitos iguais');
  }

  if (report.errors.length === 0) {
    report.isValid = true;
    report.type = getPhoneType(phone);
  }

  return report;
}

module.exports = {
  isValidBrazilianPhone,
  getPhoneType,
  formatBrazilianPhone,
  validateAndReport
};
