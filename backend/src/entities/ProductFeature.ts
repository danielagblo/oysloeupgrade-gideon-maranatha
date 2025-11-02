import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Feature } from './Feature.js';
import type { Product } from './Product.js';

@Entity('product_features')
export class ProductFeature {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'product_id' })
  @Index()
  productId!: string;

  @Column({ type: 'uuid', name: 'feature_id' })
  @Index()
  featureId!: string;

  @Column({ type: 'text', nullable: true })
  value?: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne('Product', (p: any) => p.productFeatures, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @ManyToOne(
    () => Feature,
    (f: Feature) => f.productFeatures,
    {
      onDelete: 'CASCADE',
    }
  )
  @JoinColumn({ name: 'feature_id' })
  feature?: Feature;
}
