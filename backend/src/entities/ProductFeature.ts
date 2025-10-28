import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { Feature } from './Feature.js';
import type { Product } from './Product.js';

@Entity('product_features')
@Unique(['productId', 'featureId'])
export class ProductFeature {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'product_id' })
  @Index()
  productId!: string;

  @Column({ type: 'uuid', name: 'feature_id' })
  featureId!: string;

  @Column({ type: 'varchar', length: 255 })
  value!: string;

  @ManyToOne('Product', 'features', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @ManyToOne('Feature', 'productFeatures', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'feature_id' })
  feature?: Feature;
}
