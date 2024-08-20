import { DataSource, Repository, EntityManager } from 'typeorm';
import { Manufacturer } from '../entities/Manufacturer';
import { Relationship } from '../entities/Relationship';
import { ManufacturerRelation, RelatedManufacturer, RelationshipType } from '../models/types';
import logger from '../config/logger';

export class DatabaseManager {
  private dataSource: DataSource;
  private manufacturerRepository: Repository<Manufacturer>;
  private relationshipRepository: Repository<Relationship>;

  constructor(dbPath: string) {
    this.dataSource = new DataSource({
      type: 'sqlite',
      database: dbPath,
      entities: [Manufacturer, Relationship],
      synchronize: true,
      logging: false,
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.dataSource.initialize();
      this.manufacturerRepository = this.dataSource.getRepository(Manufacturer);
      this.relationshipRepository = this.dataSource.getRepository(Relationship);
      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database', error);
      throw error;
    }
  }

  async saveManufacturerRelations(relations: ManufacturerRelation[]): Promise<void> {
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      for (const relation of relations) {
        await this.processManufacturerRelation(relation, transactionalEntityManager);
      }
    });
    logger.info(`Saved ${relations.length} manufacturer relations`);
  }

  async getManufacturerRelations(): Promise<ManufacturerRelation[]> {
    const relationships = await this.relationshipRepository.find({
      relations: ['manufacturer', 'relatedManufacturer'],
    });

    const manufacturerMap = this.groupRelationshipsByManufacturer(relationships);
    return Array.from(manufacturerMap.values());
  }

  async close(): Promise<void> {
    try {
      await this.dataSource.destroy();
      logger.info('Database connection closed successfully');
    } catch (error) {
      logger.error('Failed to close database connection', error);
      throw error;
    }
  }

  private async processManufacturerRelation(
    relation: ManufacturerRelation,
    transactionalEntityManager: EntityManager
  ): Promise<void> {
    const manufacturer = await this.getOrCreateManufacturer(
      relation.manufacturer,
      transactionalEntityManager
    );

    const relatedManufacturerPromises = relation.relatedManufacturers.map(async (related) => {
      const relatedManufacturer = await this.getOrCreateManufacturer(
        related.name,
        transactionalEntityManager
      );
      return this.updateOrCreateRelationship(
        manufacturer,
        relatedManufacturer,
        related.relationship as RelationshipType,
        transactionalEntityManager
      );
    });

    await Promise.all(relatedManufacturerPromises);
  }

  private async getOrCreateManufacturer(
    name: string,
    transactionalEntityManager: EntityManager
  ): Promise<Manufacturer> {
    let manufacturer = await this.manufacturerRepository.findOne({ where: { name } });

    if (!manufacturer) {
      logger.info(`Creating new manufacturer: ${name}`);
      manufacturer = this.manufacturerRepository.create({ name });
      manufacturer = await transactionalEntityManager.save(manufacturer);
    }

    if (!manufacturer) {
      throw new Error(`Failed to create or find manufacturer with name ${name}`);
    }

    return manufacturer;
  }

  private async updateOrCreateRelationship(
    manufacturer: Manufacturer,
    relatedManufacturer: Manufacturer,
    relationshipType: RelationshipType,
    transactionalEntityManager: EntityManager
  ): Promise<void> {
    let relationship = await this.relationshipRepository.findOne({
      where: {
        manufacturer: { id: manufacturer.id },
        relatedManufacturer: { id: relatedManufacturer.id },
      },
    });

    if (!relationship) {
      relationship = this.relationshipRepository.create({
        manufacturer,
        relatedManufacturer,
        relationshipType,
      });
    } else {
      relationship.relationshipType = relationshipType;
    }

    await transactionalEntityManager.save(relationship);
  }

  private groupRelationshipsByManufacturer(
    relationships: Relationship[]
  ): Map<string, ManufacturerRelation> {
    const manufacturerMap = new Map<string, ManufacturerRelation>();

    relationships.forEach((relationship) => {
      const manufacturerName = relationship.manufacturer.name;
      if (!manufacturerMap.has(manufacturerName)) {
        manufacturerMap.set(manufacturerName, {
          manufacturer: manufacturerName,
          relatedManufacturers: [],
        });
      }

      const relatedManufacturer: RelatedManufacturer = {
        name: relationship.relatedManufacturer.name,
        relationship: relationship.relationshipType,
      };

      manufacturerMap.get(manufacturerName)!.relatedManufacturers.push(relatedManufacturer);
    });

    return manufacturerMap;
  }
}