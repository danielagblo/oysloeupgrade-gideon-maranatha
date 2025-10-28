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

export type EventType =
  | "product_view"
  | "product_click"
  | "search"
  | "favorite_add"
  | "favorite_remove"
  | "review_create"
  | "chat_start"
  | "coupon_redeem";

export type EntityType = "product" | "user" | "search" | "coupon" | "chat";

@Entity("user_analytics")
@Index(["userId", "createdAt"])
@Index(["eventType", "createdAt"])
@Index(["entityType", "entityId"])
export class UserAnalytics {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "user_id", nullable: true })
  userId?: string;

  @Column({ type: "varchar", length: 50, name: "event_type" })
  eventType!: EventType;

  @Column({ type: "varchar", length: 50, name: "entity_type" })
  entityType!: EntityType;

  @Column({ type: "uuid", nullable: true, name: "entity_id" })
  entityId?: string;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  createdAt!: Date;

  @ManyToOne("User", "analytics", { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: User;
}
