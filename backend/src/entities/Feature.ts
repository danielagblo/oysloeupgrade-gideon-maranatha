import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { ProductFeature } from './ProductFeature.js';
import type { Subcategory } from './Subcategory.js';

@Entity('features')
export class Feature {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'subcategory_id' })
  @Index()
  subcategoryId!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  key?: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne('Subcategory', 'features', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subcategory_id' })
  subcategory?: Subcategory;

  @OneToMany('ProductFeature', 'feature')
  productFeatures?: ProductFeature[];
}
