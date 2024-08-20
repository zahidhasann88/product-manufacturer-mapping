import fs from 'fs';
import path from 'path';

class Config {
  private static config: { [key: string]: string };

  static loadConfig() {
    const configPath = path.join(__dirname, '..', 'config.json');
    const configFile = fs.readFileSync(configPath, 'utf8');
    this.config = JSON.parse(configFile);
  }

  static getConfigVariable(key: string, defaultValue?: string): string {
    if (!this.config) {
      this.loadConfig();
    }
    const value = this.config[key];
    if (!value && !defaultValue) {
      throw new Error(`Configuration variable ${key} is not set and no default value provided.`);
    }
    return value || defaultValue!;
  }

  static get DB_PATH(): string {
    return this.getConfigVariable('DB_PATH', './manufacturer_relations.db');
  }

  static get DATA_DIR(): string {
    return this.getConfigVariable('DATA_DIR', './data');
  }
}

// Exporting configuration values
export const DB_PATH = Config.DB_PATH;
export const DATA_DIR = Config.DATA_DIR;