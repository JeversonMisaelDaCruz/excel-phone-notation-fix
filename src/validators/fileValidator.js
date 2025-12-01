/**
 * Validador de arquivos (Excel e CSV)
 */

const fs = require('fs');
const path = require('path');

/**
 * Valida se o arquivo existe e é válido
 */
function validateFile(filePath) {
  const errors = [];

  // Verificar se arquivo existe
  if (!fs.existsSync(filePath)) {
    errors.push(`Arquivo não encontrado: ${filePath}`);
    return { isValid: false, errors };
  }

  // Verificar se é arquivo (não diretório)
  const stats = fs.statSync(filePath);
  if (!stats.isFile()) {
    errors.push(`O caminho não é um arquivo: ${filePath}`);
    return { isValid: false, errors };
  }

  // Verificar extensão
  const ext = path.extname(filePath).toLowerCase();
  if (!['.xls', '.xlsx', '.csv'].includes(ext)) {
    errors.push(`Extensão inválida: ${ext} (esperado: .xls, .xlsx ou .csv)`);
    return { isValid: false, errors };
  }

  // Verificar se arquivo está vazio
  if (stats.size === 0) {
    errors.push('Arquivo está vazio');
    return { isValid: false, errors };
  }

  // Verificar permissão de leitura
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
  } catch (err) {
    errors.push('Sem permissão para ler o arquivo');
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    fileInfo: {
      path: filePath,
      name: path.basename(filePath),
      extension: ext,
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      type: getFileType(ext)
    }
  };
}

/**
 * Retorna o tipo de arquivo baseado na extensão
 */
function getFileType(ext) {
  if (['.xls', '.xlsx'].includes(ext)) {
    return 'excel';
  }
  if (ext === '.csv') {
    return 'csv';
  }
  return 'unknown';
}

/**
 * Formata bytes para leitura humana
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

module.exports = {
  validateFile,
  getFileType,
  formatBytes
};
