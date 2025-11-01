import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { AdminUser } from "./AdminUser.js";

@Entity('admin_audit_log')
export class AdminAuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'admin_user_id' })
  adminUserId!: number;

  @ManyToOne(() => AdminUser)
  @JoinColumn({ name: 'admin_user_id' })
  adminUser!: AdminUser;

  @Column({ type: 'varchar', length: 100 })
  action!: string;

  @Column({ type: 'varchar', length: 50 })
  resourceType!: string;

  @Column({ type: 'integer', nullable: true })
  resourceId?: number;

  @Column({ type: 'jsonb', nullable: true })
  oldValues?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  newValues?: Record<string, unknown>;

  @Column({ type: 'inet', nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
