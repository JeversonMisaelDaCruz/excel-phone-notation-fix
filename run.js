#!/usr/bin/env node

/**
 * CLI Wrapper para o conversor de telefones Excel
 */

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { main } = require('./src/index');
const path = require('path');

const argv = yargs(hideBin(process.argv))
  .usage('Uso: node run.js --input=<arquivo.xls>')
  .option('input', {
    alias: 'i',
    description: 'Arquivo Excel de entrada (.xls ou .xlsx)',
    type: 'string',
    demandOption: true
  })
  .option('output', {
    alias: 'o',
    description: 'Arquivo ou diretório de saída',
    type: 'string'
  })
  .option('mode', {
    alias: 'm',
    description: 'Modo de saída: new (padrão), overwrite, directory',
    type: 'string',
    default: 'new',
    choices: ['new', 'overwrite', 'directory']
  })
  .option('phone-columns', {
    alias: 'c',
    description: 'Colunas de telefone (1-indexed, separadas por vírgula)',
    type: 'string'
  })
  .option('validate-only', {
    alias: 'v',
    description: 'Apenas validar, não converter',
    type: 'boolean',
    default: false
  })
  .option('verbose', {
    description: 'Modo verbose (detalhado)',
    type: 'boolean',
    default: false
  })
  .example('node run.js --input="Seped_251127.xls"', 'Conversão básica com auto-detecção')
  .example('node run.js -i dados.xlsx -o ./saida', 'Especificar diretório de saída')
  .example('node run.js -i phones.xls -m overwrite', 'Sobrescrever arquivo original')
  .example('node run.js -i dados.xls -c "3,5"', 'Especificar colunas manualmente')
  .help('h')
  .alias('h', 'help')
  .argv;

// Processar opções
const options = {
  input: path.resolve(argv.input),
  output: argv.output ? path.resolve(argv.output) : null,
  mode: argv.mode,
  phoneColumns: argv['phone-columns']
    ? argv['phone-columns'].split(',').map(c => parseInt(c.trim()) - 1) // Converter para 0-indexed
    : null,
  validateOnly: argv['validate-only'],
  verbose: argv.verbose
};

// Executar
main(options)
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('\nErro fatal:', error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  });
