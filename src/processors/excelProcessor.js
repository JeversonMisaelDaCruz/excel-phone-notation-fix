/**
 * Processador principal de Excel
 * Orquestra leitura, conversão, validação e escrita
 */

const { validateExcelFile } = require('../validators/excelValidator');
const { readExcelFile } = require('../readers/excelReader');
const { writeExcelFile, generateOutputPath } = require('../writers/excelWriter');
const { convertAndValidate } = require('../converters/phoneConverter');
const Logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

class ExcelProcessor {
  constructor(options = {}) {
    this.inputFile = options.input;
    this.outputFile = options.output;
    this.mode = options.mode || 'new';
    this.phoneColumns = options.phoneColumns || null;
    this.validateOnly = options.validateOnly || false;
    this.verbose = options.verbose || false;

    this.logger = new Logger({ verbose: this.verbose });
    this.report = {
      timestamp: new Date().toISOString(),
      inputFile: this.inputFile,
      outputFile: null,
      summary: {
        totalRows: 0,
        cellsProcessed: 0,
        cellsConverted: 0,
        cellsSkipped: 0,
        cellsInvalid: 0
      },
      conversionDetails: [],
      errors: [],
      warnings: []
    };
  }

  async process() {
    const startTime = Date.now();

    try {
      // 1. Validar arquivo de entrada
      this.logger.section('Validando arquivo Excel');
      const validation = validateExcelFile(this.inputFile);

      if (!validation.isValid) {
        validation.errors.forEach(err => this.logger.error(err));
        throw new Error('Arquivo inválido');
      }

      this.logger.success(`Arquivo válido: ${validation.fileInfo.name} (${validation.fileInfo.sizeFormatted})`);

      // 2. Ler arquivo Excel
      this.logger.section('Lendo arquivo Excel');
      const excelData = readExcelFile(this.inputFile, {
        phoneColumns: this.phoneColumns,
        autoDetect: true
      });

      this.report.summary.totalRows = excelData.totalRows;

      this.logger.success(`${excelData.totalRows} linhas lidas`);
      this.logger.info(`Planilha: ${excelData.sheetName}`);

      // Mostrar colunas detectadas
      if (excelData.phoneColumns.length > 0) {
        this.logger.info(`Colunas de telefone detectadas:`);
        excelData.phoneColumns.forEach(col => {
          this.logger.info(`  - ${col.name} (coluna ${col.index + 1}, confiança: ${col.confidence}%)`);
        });
      } else {
        this.logger.warn('Nenhuma coluna de telefone detectada automaticamente');
        this.logger.info('Use --phone-columns para especificar manualmente');
      }

      // 3. Processar conversões
      this.logger.section('Processando conversões');

      const conversions = [];
      const phoneColumnIndices = excelData.phoneColumns.map(c => c.index);

      excelData.rows.forEach((row, rowIndex) => {
        phoneColumnIndices.forEach(colIndex => {
          const cellValue = row[colIndex];

          if (cellValue === null || cellValue === undefined || cellValue === '') {
            this.report.summary.cellsSkipped++;
            return;
          }

          this.report.summary.cellsProcessed++;

          // Converter e validar
          const result = convertAndValidate(cellValue);

          if (result.converted) {
            conversions.push({
              row: rowIndex,
              col: colIndex,
              columnName: excelData.headers[colIndex],
              originalValue: result.original,
              newValue: result.converted,
              isValid: result.isValid,
              errors: result.errors
            });

            if (result.isValid) {
              this.report.summary.cellsConverted++;
            } else {
              this.report.summary.cellsInvalid++;
              this.report.warnings.push({
                row: rowIndex + 2, // +2 para Excel (header + 1-based)
                column: excelData.headers[colIndex],
                original: result.original,
                converted: result.converted,
                message: result.errors.join(', ')
              });
            }

            this.report.conversionDetails.push({
              row: rowIndex + 2,
              column: excelData.headers[colIndex],
              original: String(result.original),
              converted: result.converted,
              validation: result.isValid ? 'PASS' : 'FAIL'
            });
          } else {
            this.report.summary.cellsSkipped++;
          }
        });
      });

      this.logger.success(`${conversions.length} células processadas`);
      this.logger.info(`Convertidas: ${this.report.summary.cellsConverted}`);
      this.logger.info(`Inválidas: ${this.report.summary.cellsInvalid}`);
      this.logger.info(`Ignoradas: ${this.report.summary.cellsSkipped}`);

      // 4. Escrever arquivo (se não for apenas validação)
      if (!this.validateOnly && conversions.length > 0) {
        this.logger.section('Salvando arquivo convertido');

        const outputPath = this.outputFile || generateOutputPath(this.inputFile, this.mode);
        this.report.outputFile = outputPath;

        await writeExcelFile(this.inputFile, outputPath, excelData, conversions);

        this.logger.success(`Arquivo salvo: ${outputPath}`);
      }

      // 5. Gerar relatório JSON
      const reportPath = this.generateReportPath();
      fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
      this.logger.info(`Relatório detalhado: ${reportPath}`);

      // 6. Resumo final
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.section('Resumo Final');
      this.printSummary(elapsed);

      return this.report;

    } catch (error) {
      this.logger.error('Erro durante processamento:', error.message);
      this.report.errors.push({
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  generateReportPath() {
    const parsed = path.parse(this.inputFile);
    return path.join(parsed.dir, `${parsed.name}_report.json`);
  }

  printSummary(elapsed) {
    console.log('');
    console.log(`Arquivo Entrada:      ${this.report.inputFile}`);
    if (this.report.outputFile) {
      console.log(`Arquivo Saída:        ${this.report.outputFile}`);
    }
    console.log(`Status:               SUCESSO`);
    console.log('');
    console.log('Resultados:');
    console.log(`  Total de Linhas:    ${this.report.summary.totalRows.toLocaleString('pt-BR')}`);
    console.log(`  Células Convertidas: ${this.report.summary.cellsConverted.toLocaleString('pt-BR')}`);
    console.log(`  Células Ignoradas:   ${this.report.summary.cellsSkipped.toLocaleString('pt-BR')}`);
    console.log(`  Telefones Inválidos: ${this.report.summary.cellsInvalid.toLocaleString('pt-BR')}`);
    console.log('');
    console.log(`Erros:                ${this.report.errors.length}`);
    console.log(`Avisos:               ${this.report.warnings.length}`);
    console.log('');
    console.log(`Tempo:                ${elapsed}s`);
    console.log('');
  }
}

module.exports = ExcelProcessor;
