import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { AdminUser } from "./AdminUser.js";
import { User } from "./User.js";

@Entity('support_cases')
export class SupportCase {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 255 })
  subject!: string;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status!: string; // 'open', 'in_progress', 'waiting', 'resolved', 'closed'

  @Column({ type: 'varchar', length: 20, default: 'normal' })
  priority!: string; // 'low', 'normal', 'high', 'urgent'

  @Column({ type: 'varchar', length: 50, nullable: true })
  category?: string;

  @Column({ name: 'assigned_admin_id', nullable: true })
  assignedAdminId?: number;

  @ManyToOne(() => AdminUser)
  @JoinColumn({ name: 'assigned_admin_id' })
  assignedAdmin?: AdminUser;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  lastMessageAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
