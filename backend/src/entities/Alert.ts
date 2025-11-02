import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdminUser } from './AdminUser.js';
import { Coupon } from './Coupon.js';

export type AlertType = 'info' | 'warning' | 'success' | 'error';
export type AlertStatus = 'active' | 'expired' | 'cancelled';

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'varchar', length: 20 })
  type!: AlertType;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: AlertStatus;

  @Column({ type: 'jsonb', name: 'recipient_ids' })
  recipientIds!: string[]; // Array of user IDs (UUIDs)

  @Column({ type: 'jsonb', nullable: true, name: 'linked_ad_ids' })
  linkedAdIds?: string[]; // Array of product IDs (UUIDs)

  @Column({ name: 'coupon_id', nullable: true })
  couponId?: string;

  @ManyToOne(() => Coupon, { nullable: true })
  @JoinColumn({ name: 'coupon_id' })
  coupon?: Coupon;

  @Column({ name: 'created_by' })
  createdBy!: number;

  @ManyToOne(() => AdminUser)
  @JoinColumn({ name: 'created_by' })
  creator!: AdminUser;

  @Column({ type: 'boolean', default: true, name: 'send_immediately' })
  sendImmediately!: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'scheduled_for' })
  scheduledFor?: Date;

  @Column({ type: 'integer', default: 0, name: 'delivered_count' })
  deliveredCount!: number;

  @Column({ type: 'integer', default: 0, name: 'clicked_count' })
  clickedCount!: number;

  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  expiresAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
