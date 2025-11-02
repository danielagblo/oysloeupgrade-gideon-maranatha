import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { User } from './User.js';

@Entity('referrals')
@Unique(['referrerId', 'referredUserId'])
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'referrer_id' })
  @Index()
  referrerId!: string;

  @Column({ type: 'uuid', name: 'referred_user_id' })
  referredUserId!: string;

  @Column({ type: 'integer', default: 250, name: 'points_earned' })
  pointsEarned!: number;

  @Column({ type: 'varchar', default: 'pending', name: 'status' })
  status!: string;

  @Column({ type: 'timestamp', nullable: true, name: 'confirmed_at' })
  confirmedAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'cancelled_at' })
  cancelledAt?: Date;

  @Column({ type: 'uuid', nullable: true, name: 'cancelled_by' })
  cancelledBy?: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @ManyToOne('User', (u: any) => u.referralsGiven, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'referrer_id' })
  referrer?: User;

  @ManyToOne('User', (u: any) => u.referralsReceived, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'referred_user_id' })
  referredUser?: User;
}
