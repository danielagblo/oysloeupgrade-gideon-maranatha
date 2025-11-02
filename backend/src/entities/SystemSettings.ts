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

@Entity('system_settings')
export class SystemSettings {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  key!: string;

  @Column({ type: 'jsonb', nullable: true })
  value?: any;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category?: string;

  @Column({ type: 'boolean', default: false })
  isPublic!: boolean;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: number;

  @ManyToOne(
    () => AdminUser,
    (admin: any) => admin.updatedSettings
  )
  @JoinColumn({ name: 'updated_by' })
  updatedByAdmin?: any;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
