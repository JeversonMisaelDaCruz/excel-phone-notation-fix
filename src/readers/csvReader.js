/**
 * Leitor de arquivos CSV
 */

const fs = require('fs');
const csv = require('csv-parser');
const { isScientificNotation } = require('../converters/scientificNotationHandler');
const { removeEmojis } = require('../converters/phoneConverter');

/**
 * Lê arquivo CSV e retorna dados estruturados
 */
function readCSVFile(filePath, options = {}) {
  const {
    phoneColumns = null, // Array de índices de colunas (0-indexed) ou null para auto-detectar
    autoDetect = true,   // Auto-detectar colunas de telefone
    delimiter = ','      // Delimitador do CSV
  } = options;

  return new Promise((resolve, reject) => {
    const data = [];
    let headers = null;

    fs.createReadStream(filePath)
      .pipe(csv({ separator: delimiter }))
      .on('headers', (headerRow) => {
        headers = headerRow;
      })
      .on('data', (row) => {
        // Converter row object para array na ordem dos headers
        const rowArray = headers.map(header => {
          let value = row[header];

          // Remover emojis de TODOS os campos
          if (typeof value === 'string' && value) {
            value = removeEmojis(value);
          }

          // Tentar converter para número se parecer com notação científica
          if (typeof value === 'string') {
            // Detectar notação científica (ex: "1.23E+10")
            if (value.match(/^\d+\.?\d*[eE][+-]?\d+$/)) {
              return parseFloat(value);
            }
            // Detectar números grandes sem formatação
            if (value.match(/^\d{10,}$/)) {
              return parseFloat(value);
            }
          }

          return value || null;
        });

        data.push(rowArray);
      })
      .on('end', () => {
        if (!headers || data.length === 0) {
          reject(new Error('Arquivo CSV está vazio'));
          return;
        }

        // Detectar colunas de telefone
        let detectedPhoneColumns = phoneColumns;

        if (autoDetect && !phoneColumns) {
          detectedPhoneColumns = detectPhoneColumns([headers, ...data], headers);
        } else if (phoneColumns) {
          // Converter índices em objetos com informações
          detectedPhoneColumns = phoneColumns.map(idx => ({
            index: idx,
            name: headers[idx] || `Coluna ${idx + 1}`,
            confidence: 100
          }));
        }

        resolve({
          fileName: filePath.split('/').pop(),
          headers,
          rows: data,
          phoneColumns: detectedPhoneColumns || [],
          totalRows: data.length,
          totalColumns: headers.length
        });
      })
      .on('error', (error) => {
        reject(new Error(`Erro ao ler CSV: ${error.message}`));
      });
  });
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

    for (let row = 1; row <= sampleSize && row < data.length; row++) {
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

module.exports = {
  readCSVFile,
  detectPhoneColumns
};
