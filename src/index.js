/**
 * Entry point principal
 */

const ExcelProcessor = require('./processors/excelProcessor');

async function main(options) {
  const processor = new ExcelProcessor(options);
  return await processor.process();
}

module.exports = { main };
