import path from 'path';
import fs from 'fs/promises';
import { readProductCSV, readMatchesCSV } from './services/csvReader';
import { ManufacturerMapper } from './services/manufacturerMapper';
import { DatabaseManager } from './services/databaseManager';
import { BrandAssigner } from './services/brandAssigner';
import { validateManufacturerMatching } from './services/validationAlgorithm';
import { DB_PATH, DATA_DIR } from './config/database';
import { parallelProcess } from './utils/parallel';
import logger from './config/logger';
import { Product, Match, ManufacturerRelation } from './models/types';

const PRODUCT_FILES = [
  'cma-lt-data.csv',
  'gin-lt-data.csv',
  'azt-lt-data.csv',
  'ntn-lt-data.csv',
  'apo-lt-data.csv',
  'bnu-lt-data.csv',
];

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const loadProducts = async (file: string): Promise<Product[]> => {
  const filePath = path.join(DATA_DIR, file);
  if (!(await fileExists(filePath))) {
    logger.warn(`File not found: ${filePath}`);
    return [];
  }

  try {
    const products = await readProductCSV(filePath);
    logger.info(`Successfully loaded ${products.length} products from ${file}`);
    return products;
  } catch (error) {
    logger.error(`Error reading file ${file}:`, error);
    return [];
  }
};

const loadMatches = async (filePath: string): Promise<Match[]> => {
  if (!(await fileExists(filePath))) {
    throw new Error(`Matches file not found: ${filePath}`);
  }

  try {
    const matches = await readMatchesCSV(filePath);
    logger.info(`Successfully loaded ${matches.length} matches`);
    return matches;
  } catch (error) {
    throw new Error(`Error reading matches file: ${error}`);
  }
};

async function processManufacturerMapping(): Promise<void> {
  logger.info('Starting product-manufacturer-mapping process');

  if (!(await fileExists(DATA_DIR))) {
    throw new Error(`Data directory does not exist: ${DATA_DIR}`);
  }

  const allProducts = await parallelProcess(PRODUCT_FILES, loadProducts);
  const flattenedProducts: Product[] = allProducts.flat();

  if (flattenedProducts.length === 0) {
    throw new Error('No product data was loaded. Please check your CSV files.');
  }

  const matchesPath = path.join(DATA_DIR, 'matches.csv');
  const matches = await loadMatches(matchesPath);

  logger.info(`Loaded ${flattenedProducts.length} products and ${matches.length} matches in total`);

  const mapper = new ManufacturerMapper();
  mapper.mapManufacturers(flattenedProducts, matches);
  const manufacturerRelations: ManufacturerRelation[] = mapper.getRelatedManufacturers();

  logger.info(`Generated ${manufacturerRelations.length} manufacturer relations`);

  await saveManufacturerRelations(manufacturerRelations);

  const brandAssigner = new BrandAssigner(manufacturerRelations);

  const brandTitle = 'Brand X Super Product';
  const assignedBrand = brandAssigner.assignBrand(brandTitle);
  logger.info(`Assigned brand for "${brandTitle}": ${assignedBrand || 'No brand assigned'}`);

  const flaggedManufacturers = validateManufacturerMatching(manufacturerRelations);
  logger.info(`Flagged manufacturers: ${flaggedManufacturers.length}`);
  logger.info('Process completed successfully');
}

async function saveManufacturerRelations(relations: ManufacturerRelation[]): Promise<void> {
  const dbManager = new DatabaseManager(DB_PATH);
  try {
    await dbManager.initialize();
    await dbManager.saveManufacturerRelations(relations);
    logger.info('Successfully saved manufacturer relations to the database');
  } catch (error) {
    throw new Error(`Error while working with the database: ${error}`);
  }
}

async function main() {
  try {
    await processManufacturerMapping();
  } catch (error) {
    logger.error('An unexpected error occurred:', error);
    process.exit(1);
  }
}

main();