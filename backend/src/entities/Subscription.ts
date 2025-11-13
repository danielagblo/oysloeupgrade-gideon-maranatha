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
import type { User } from './User.js';

export type SubscriptionPlanType = 'basic' | 'business' | 'platinum';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';

@Entity('subscriptions')
@Index(['userId', 'status'])
@Index(['planType', 'status'])
@Index(['startDate', 'endDate'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  @Index()
  userId!: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'plan_type',
  })
  @Index()
  planType!: SubscriptionPlanType;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  @Index()
  status!: SubscriptionStatus;

  @Column({ type: 'timestamp', name: 'start_date' })
  startDate!: Date;

  @Column({ type: 'timestamp', name: 'end_date' })
  endDate!: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'payment_method' })
  paymentMethod?: string;

  @Column({ type: 'uuid', nullable: true, name: 'transaction_id' })
  transactionId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'wallet_ledger_id' })
  walletLedgerId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ type: 'text', nullable: true, name: 'cancellation_reason' })
  cancellationReason?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'cancelled_at' })
  cancelledAt?: Date;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne('User', (u: any) => u.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}


