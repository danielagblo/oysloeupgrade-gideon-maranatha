import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import type { User } from "./User.js";

export type NotificationType =
  | "chat_message"
  | "wallet_credit"
  | "wallet_debit"
  | "welcome"
  | "account_created"
  | "coupon_redemption"
  | "referral_bonus"
  | "referral_redemption"
  | "product_review";

@Entity("notification_history")
@Index(["userId", "createdAt"])
@Index(["userId", "isRead"])
export class NotificationHistory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "user_id" })
  userId!: string;

  @Column({ type: "varchar", length: 50 })
  type!: NotificationType;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text" })
  body!: string;

  @Column({ type: "jsonb", nullable: true })
  data?: Record<string, unknown>;

  @Column({ type: "boolean", default: false, name: "is_read" })
  isRead!: boolean;

  @Column({ type: "timestamp", nullable: true, name: "read_at" })
  readAt?: Date;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  createdAt!: Date;

  @ManyToOne("User", "notificationHistory", { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: User;
}
