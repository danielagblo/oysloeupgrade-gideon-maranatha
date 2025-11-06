import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AdminUser } from './AdminUser.js';

@Entity('admin_sessions')
export class AdminSession {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'admin_user_id' })
  adminUserId!: number;

  @ManyToOne(() => AdminUser)
  @JoinColumn({ name: 'admin_user_id' })
  adminUser!: AdminUser;

  @Column({ type: 'varchar', length: 255, unique: true })
  tokenHash!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  refreshTokenHash?: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ type: 'inet', nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt!: Date;
}



