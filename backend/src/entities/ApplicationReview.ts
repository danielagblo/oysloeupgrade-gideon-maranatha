import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { JobApplication } from "./JobApplication.js";

import { AdminUser } from "./AdminUser.js";

@Entity("application_reviews")
export class ApplicationReview {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "application_id" })
  applicationId!: number;

  @ManyToOne(() => JobApplication, (app: any) => app.reviewHistory, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "application_id" })
  application!: JobApplication;

  @Column({ name: "admin_user_id" })
  adminUserId!: number;

  @ManyToOne(() => AdminUser)
  @JoinColumn({ name: "admin_user_id" })
  adminUser: any;

  @Column({ type: "varchar", length: 50 })
  action!: string; // 'reviewed', 'accepted', 'rejected', 'note_added'

  @Column({ type: "text", nullable: true })
  notes?: string;

  @Column({ type: "text", nullable: true })
  feedback?: string;

  @Column({ type: "varchar", length: 50, nullable: true, name: "old_status" })
  oldStatus?: string;

  @Column({ type: "varchar", length: 50, nullable: true, name: "new_status" })
  newStatus?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}

