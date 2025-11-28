/**
 * Escritor de arquivos Excel usando biblioteca xlsx
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

/**
 * Escreve dados convertidos em novo arquivo Excel
 */
async function writeExcelFile(inputPath, outputPath, data, conversions) {
  // Ler arquivo original
  const workbook = XLSX.readFile(inputPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Aplicar conversões
  conversions.forEach(conv => {
    const { row, col, newValue } = conv;

    // Excel usa indexação 1-based, nossos dados usam 0-based
    const excelRow = row + 2; // +1 para header, +1 para 1-based
    const excelCol = col;      // col já é 0-based

    // Converter índice para endereço de célula (ex: "A1", "B2")
    const cellAddress = XLSX.utils.encode_cell({ r: excelRow - 1, c: excelCol });

    // Criar ou atualizar célula
    if (!worksheet[cellAddress]) {
      worksheet[cellAddress] = {};
    }

    // Definir valor como STRING (formato texto)
    worksheet[cellAddress].t = 's'; // tipo string
    worksheet[cellAddress].v = String(newValue); // valor
    worksheet[cellAddress].w = String(newValue); // valor formatado
  });

  // Garantir que diretório de saída existe
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Salvar arquivo
  XLSX.writeFile(workbook, outputPath);

  return {
    outputPath,
    conversionsApplied: conversions.length
  };
}

/**
 * Gera nome de arquivo de saída baseado no modo
 */
function generateOutputPath(inputPath, mode = 'new', outputDir = null) {
  const parsedPath = path.parse(inputPath);

  if (mode === 'overwrite') {
    return inputPath;
  }

  if (mode === 'directory' && outputDir) {
    const fileName = `${parsedPath.name}_fixed${parsedPath.ext}`;
    return path.join(outputDir, fileName);
  }

  // Modo 'new' (padrão): adicionar _fixed ao nome
  return path.join(
    parsedPath.dir,
    `${parsedPath.name}_fixed${parsedPath.ext}`
  );
}

module.exports = {
  writeExcelFile,
  generateOutputPath
};
