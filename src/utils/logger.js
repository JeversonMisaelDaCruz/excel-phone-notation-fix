/**
 * Sistema simples de logging
 */

const chalk = require('chalk');

class Logger {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
  }

  info(message, ...args) {
    console.log(chalk.blue('[INFO]'), message, ...args);
  }

  success(message, ...args) {
    console.log(chalk.green('[✓]'), message, ...args);
  }

  warn(message, ...args) {
    console.log(chalk.yellow('[AVISO]'), message, ...args);
  }

  error(message, ...args) {
    console.error(chalk.red('[ERRO]'), message, ...args);
  }

  debug(message, ...args) {
    if (this.verbose) {
      console.log(chalk.gray('[DEBUG]'), message, ...args);
    }
  }

  section(title) {
    console.log('\n' + chalk.bold.cyan(title));
    console.log(chalk.cyan('='.repeat(title.length)));
  }
}

module.exports = Logger;
