import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import type { User } from "./User.js";
import { AdminUser } from "./AdminUser.js";

export type ApplicationStatus =
  | "pending"
  | "reviewed"
  | "accepted"
  | "rejected";

@Entity("job_applications")
export class JobApplication {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "user_id" })
  userId!: string;

  @ManyToOne("User", (u: any) => u.jobApplications, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: User;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ type: "varchar", length: 15, nullable: true })
  phone?: string;

  @Column({ type: "varchar", length: 50, default: "pending" })
  status!: ApplicationStatus;

  @Column({ type: "text", nullable: true })
  coverLetter?: string;

  @Column({ type: "text", nullable: true })
  experience?: string;

  @Column({ type: "text", nullable: true })
  skills?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  position?: string;

  @Column({ type: "text", nullable: true })
  adminNotes?: string;

  @Column({ type: "text", nullable: true })
  feedback?: string;

  @Column({ type: "integer", nullable: true })
  reviewedBy?: number;

  @ManyToOne("AdminUser", (au: any) => au.reviewedApplications, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "reviewed_by" })
  reviewer?: AdminUser;

  @Column({ type: "timestamp", nullable: true })
  reviewedAt?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
