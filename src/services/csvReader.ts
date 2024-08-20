import { parse, Options as ParseOptions } from 'csv-parse';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { Product, Match } from '../models/types';
import logger from '../config/logger';

const CSV_PARSE_OPTIONS: ParseOptions = {
  columns: true,
  skip_empty_lines: true,
  delimiter: ';',
  relax_column_count: true,
  relax_quotes: true,
};

async function validateFilePath(filePath: string): Promise<void> {
  try {
    await fs.access(filePath);
  } catch (error) {
    logger.error(`File not found: ${filePath}`);
    throw new Error(`File not found: ${filePath}`);
  }
}

function readCSV<T>(filePath: string, parseOptions: ParseOptions): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const data: T[] = [];
    const parser = parse(parseOptions);

    createReadStream(filePath)
      .pipe(parser)
      .on('data', (row: T) => data.push(row))
      .on('end', () => {
        logger.info(`Successfully read ${data.length} rows from ${filePath}`);
        resolve(data);
      })
      .on('error', (error) => {
        logger.error(`Error reading CSV file at ${filePath}:`, error);
        reject(error);
      });

    parser.on('skip', (error) => {
      logger.warn(`Skipped line in ${filePath}:`, error.message);
    });
  });
}

export async function readProductCSV(filePath: string): Promise<Product[]> {
  await validateFilePath(filePath);
  return readCSV<Product>(filePath, CSV_PARSE_OPTIONS);
}

export async function readMatchesCSV(filePath: string): Promise<Match[]> {
  await validateFilePath(filePath);
  return readCSV<Match>(filePath, CSV_PARSE_OPTIONS);
}

export function createCSVReader<T>(entityName: string) {
  return async function(filePath: string): Promise<T[]> {
    await validateFilePath(filePath);
    logger.info(`Reading ${entityName} from ${filePath}`);
    const data = await readCSV<T>(filePath, CSV_PARSE_OPTIONS);
    logger.info(`Read ${data.length} ${entityName} from ${filePath}`);
    return data;
  };
}