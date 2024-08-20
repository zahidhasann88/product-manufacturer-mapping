import winston from 'winston';
import path from 'path';
import fs from 'fs';

class LoggerConfig {
  private static config: { [key: string]: string };

  static loadConfig() {
    const configPath = path.join(__dirname, '..', 'config.json');
    const configFile = fs.readFileSync(configPath, 'utf8');
    this.config = JSON.parse(configFile);
  }

  static get logDir(): string {
    if (!this.config) {
      this.loadConfig();
    }
    return this.config.LOG_DIR || path.join(__dirname, '..', '..', 'logs');
  }

  static get logLevel(): string {
    if (!this.config) {
      this.loadConfig();
    }
    return this.config.LOG_LEVEL || 'info';
  }

  static createLogger(): winston.Logger {
    const transports = [
      new winston.transports.Console(),
      new winston.transports.File({
        filename: path.join(this.logDir, 'error.log'),
        level: 'error',
      }),
      new winston.transports.File({
        filename: path.join(this.logDir, 'combined.log'),
      }),
    ];

    return winston.createLogger({
      level: this.logLevel,
      format: winston.format.combine(
        winston.format.json()
      ),
      transports,
    });
  }
}

const logger = LoggerConfig.createLogger();

export default logger;