/**
 * Leitor de arquivos Excel usando biblioteca xlsx
 */

const XLSX = require('xlsx');
const { isScientificNotation } = require('../converters/scientificNotationHandler');
const { removeEmojis } = require('../converters/phoneConverter');

/**
 * Lê arquivo Excel e retorna dados estruturados
 */
function readExcelFile(filePath, options = {}) {
  const {
    phoneColumns = null, // Array de índices de colunas (0-indexed) ou null para auto-detectar
    sheetName = null,    // Nome da planilha ou null para primeira
    autoDetect = true    // Auto-detectar colunas de telefone
  } = options;

  // Ler arquivo
  const workbook = XLSX.readFile(filePath, {
    cellDates: false,
    cellNF: false,
    cellText: false
  });

  // Selecionar planilha
  const sheet = sheetName
    ? workbook.Sheets[sheetName]
    : workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet) {
    throw new Error(`Planilha não encontrada: ${sheetName || 'primeira'}`);
  }

  // Converter para JSON (mantém valores originais)
  const data = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: true // Mantém valores como números (importante para notação científica)
  });

  if (data.length === 0) {
    throw new Error('Planilha está vazia');
  }

  // Primeira linha como cabeçalho
  const headers = data[0];
  const rows = data.slice(1);

  // Remover emojis de todas as células
  const cleanedRows = rows.map(row => {
    return row.map(cell => {
      if (typeof cell === 'string' && cell) {
        return removeEmojis(cell);
      }
      return cell;
    });
  });

  // Detectar colunas de telefone
  let detectedPhoneColumns = phoneColumns;

  if (autoDetect && !phoneColumns) {
    detectedPhoneColumns = detectPhoneColumns(data, headers);
  }

  return {
    fileName: filePath.split('/').pop(),
    sheetName: sheetName || workbook.SheetNames[0],
    headers,
    rows: cleanedRows, // Usar rows limpos sem emojis
    phoneColumns: detectedPhoneColumns || [],
    totalRows: cleanedRows.length,
    totalColumns: headers.length,
    workbook // Retornar workbook para uso posterior
  };
}

/**
 * Detecta automaticamente colunas que contêm telefones
 * Baseado em:
 * - Notação científica com padrão E+10 ou E+11
 * - Números com 10-11 dígitos
 * - Nomes de colunas sugestivos
 */
function detectPhoneColumns(data, headers) {
  const phoneColumns = [];
  const numColumns = headers.length;

  // Analisar cada coluna
  for (let col = 0; col < numColumns; col++) {
    let score = 0;
    const sampleSize = Math.min(100, data.length - 1);

    // 1. Verificar nome da coluna
    const columnName = String(headers[col] || '').toLowerCase();
    if (columnName.includes('tel') || columnName.includes('fone') || columnName.includes('phone')) {
      score += 50;
    }

    // 2. Analisar valores da coluna
    let scientificCount = 0;
    let phonePatternCount = 0;

    for (let row = 1; row <= sampleSize; row++) {
      const value = data[row] && data[row][col];
      if (!value) continue;

      // Detectar notação científica
      if (isScientificNotation(value)) {
        const str = String(value);
        // Verificar se expoente é +10 ou +11 (típico de telefones)
        if (str.includes('E+10') || str.includes('E+11') || str.includes('e+10') || str.includes('e+11')) {
          scientificCount++;
        }
      }

      // Detectar números com 10-11 dígitos
      const numStr = String(value).replace(/\D/g, '');
      if (numStr.length === 10 || numStr.length === 11) {
        phonePatternCount++;
      }
    }

    // Calcular pontuação
    if (scientificCount > sampleSize * 0.5) {
      score += 40;
    }
    if (phonePatternCount > sampleSize * 0.5) {
      score += 30;
    }

    // Se score alto, considerar como coluna de telefone
    if (score >= 30) {
      phoneColumns.push({
        index: col,
        name: headers[col] || `Coluna ${col + 1}`,
        confidence: score
      });
    }
  }

  return phoneColumns;
}

/**
 * Extrai dados de uma célula específica
 */
function getCellValue(sheet, cellAddress) {
  const cell = sheet[cellAddress];
  return cell ? cell.v : null;
}

module.exports = {
  readExcelFile,
  detectPhoneColumns,
  getCellValue
};
