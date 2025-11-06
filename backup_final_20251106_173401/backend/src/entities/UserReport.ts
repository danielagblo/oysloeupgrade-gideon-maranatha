import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import type { AdminUser } from "./AdminUser.js";
import type { User } from "./User.js";

@Entity("user_reports")
export class UserReport {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "reporter_user_id" })
  reporterUserId!: string;

  @ManyToOne("User", (u: any) => u.reportedBy)
  @JoinColumn({ name: "reporter_user_id" })
  reporterUser?: User;

  @Column({ name: "reported_user_id" })
  reportedUserId!: string;

  @ManyToOne("User", (u: any) => u.reportsFiled)
  @JoinColumn({ name: "reported_user_id" })
  reportedUser?: User;

  @Column({ type: "varchar", length: 50 })
  reportType!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar", length: 20, default: "pending" })
  status!: string; // 'pending', 'investigating', 'resolved', 'dismissed'

  @Column({ name: "admin_user_id", nullable: true })
  adminUserId?: number;

  @ManyToOne("AdminUser", (au: any) => au.handledReports)
  @JoinColumn({ name: "admin_user_id" })
  adminUser?: AdminUser;

  @Column({ type: "text", nullable: true })
  resolution?: string;

  @Column({ type: "timestamp", nullable: true })
  resolvedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
