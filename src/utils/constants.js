/**
 * Constantes da aplicação
 */

module.exports = {
  // Regras de telefones brasileiros
  PHONE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 11,
    MOBILE_INDICATOR: '9',
    COUNTRY_CODE: '55'
  },

  // Padrões de detecção
  PATTERNS: {
    SCIENTIFIC_NOTATION: /[0-9.]+E[+-]?[0-9]+/i,
    ONLY_DIGITS: /^\d+$/,
    PHONE_FORMATTED: /^\(?\d{2}\)?\s*\d{4,5}-?\d{4}$/
  },

  // Configurações de processamento
  PROCESSING: {
    CHUNK_SIZE: 1000,
    PROGRESS_INTERVAL: 100
  },

  // Modos de saída
  OUTPUT_MODES: {
    NEW_FILE: 'new',
    OVERWRITE: 'overwrite',
    DIRECTORY: 'directory'
  }
};
