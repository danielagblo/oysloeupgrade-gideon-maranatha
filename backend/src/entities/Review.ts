import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Product } from './Product.js';
import { User } from './User.js';

@Entity('reviews')
@Unique(['productId', 'userId'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'product_id' })
  @Index()
  productId!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'integer' })
  rating!: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ type: 'integer', default: 0, name: 'likes_count' })
  likesCount!: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(
    () => Product,
    (p: any) => p.reviews,
    { onDelete: 'CASCADE' }
  )
  @JoinColumn({ name: 'product_id' })
  product?: any;

  @ManyToOne(
    () => User,
    (u: any) => u.reviews,
    { onDelete: 'CASCADE' }
  )
  @JoinColumn({ name: 'user_id' })
  user?: any;
}
