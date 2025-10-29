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
import { User } from './User.js';

@Entity('fcm_devices')
export class FCMDevice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  @Index()
  userId!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  token!: string;

  @Column({ type: 'jsonb', nullable: true, name: 'device_info' })
  deviceInfo?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => User, (u) => u.fcmDevices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
