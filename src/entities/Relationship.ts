import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Manufacturer } from './Manufacturer';

@Entity()
export class Relationship {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Manufacturer, (manufacturer) => manufacturer.relationships)
  manufacturer: Manufacturer;

  @ManyToOne(() => Manufacturer)
  relatedManufacturer: Manufacturer;

  @Column({
    type: 'varchar',
    length: 10,
  })
  relationshipType: 'parent' | 'child' | 'sibling';
}
