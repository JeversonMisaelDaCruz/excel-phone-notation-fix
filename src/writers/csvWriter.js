/**
 * Escritor de arquivos CSV
 */

const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

/**
 * Escreve arquivo CSV com as conversões aplicadas
 */
async function writeCSVFile(inputPath, outputPath, csvData, conversions) {
  const { headers, rows } = csvData;

  // Criar cópia dos dados para modificar
  const modifiedRows = rows.map(row => [...row]);

  // Aplicar conversões
  conversions.forEach(conv => {
    if (modifiedRows[conv.row]) {
      modifiedRows[conv.row][conv.col] = conv.newValue;
    }
  });

  // Converter array de arrays para array de objetos para csv-writer
  const records = modifiedRows.map(row => {
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = row[idx] !== null && row[idx] !== undefined ? String(row[idx]) : '';
    });
    return obj;
  });

  // Configurar csv-writer
  const csvWriter = createCsvWriter({
    path: outputPath,
    header: headers.map(h => ({ id: h, title: h }))
  });

  // Escrever arquivo
  await csvWriter.writeRecords(records);
}

/**
 * Gera caminho de saída baseado no modo
 */
function generateOutputPath(inputPath, mode = 'new') {
  const parsed = path.parse(inputPath);

  switch (mode) {
    case 'overwrite':
      return inputPath;

    case 'directory':
      const outputDir = path.join(parsed.dir, 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
      return path.join(outputDir, parsed.base);

    case 'new':
    default:
      return path.join(parsed.dir, `${parsed.name}_converted${parsed.ext}`);
  }
}

module.exports = {
  writeCSVFile,
  generateOutputPath
};
