import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Relationship } from './Relationship';

@Entity()
export class Manufacturer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => Relationship, (relationship) => relationship.manufacturer)
  relationships: Relationship[];
}
