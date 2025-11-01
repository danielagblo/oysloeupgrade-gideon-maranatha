import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { AdminUser } from "./AdminUser.js";
import { Category } from "./Category.js";
import { Favorite } from "./Favorite.js";
import { ProductFeature } from "./ProductFeature.js";
import { ProductImage } from "./ProductImage.js";
import { RecentlyViewed } from "./RecentlyViewed.js";
import { Review } from "./Review.js";
import { Subcategory } from "./Subcategory.js";
import { User } from "./User.js";

export type ProductStatus = "draft" | "active" | "paused" | "archived" | "sold";
export type ProductModerationStatus =
  | "pending"
  | "active"
  | "suspended"
  | "rejected";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 20, unique: true, nullable: true })
  pid?: string;

  @Column({ type: "uuid", name: "user_id" })
  @Index()
  userId!: string;

  @Column({ type: "uuid", nullable: true, name: "category_id" })
  @Index()
  categoryId?: string;

  @Column({ type: "uuid", nullable: true, name: "subcategory_id" })
  subcategoryId?: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "text", nullable: true })
  image?: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price!: number;

  @Column({ type: "varchar", length: 20, default: "draft" })
  @Index()
  status!: ProductStatus;

  @Column({ type: "integer", default: 0, name: "views_count" })
  viewsCount!: number;

  @Column({ type: "integer", default: 0, name: "favorites_count" })
  favoritesCount!: number;

  @Column({ type: "integer", default: 0, name: "reports_count" })
  reportsCount!: number;

  @Column({ type: "boolean", default: false, name: "is_promoted" })
  isPromoted!: boolean;

  @Column({ type: "timestamp", nullable: true, name: "promoted_until" })
  promotedUntil?: Date;

  @Column({ type: "boolean", default: false })
  deleted!: boolean;

  @Column({ type: "timestamp", nullable: true, name: "deleted_at" })
  deletedAt?: Date;

  // Admin moderation fields
  @Column({
    type: "varchar",
    length: 20,
    default: "pending",
    name: "moderation_status",
  })
  @Index()
  moderationStatus!: ProductModerationStatus;

  @Column({ name: "moderated_by", nullable: true })
  moderatedBy?: number;

  @ManyToOne(() => AdminUser, { nullable: true })
  @JoinColumn({ name: "moderated_by" })
  moderator?: any;

  @Column({ type: "timestamp", nullable: true, name: "moderated_at" })
  moderatedAt?: Date;

  @Column({ type: "text", nullable: true, name: "suspension_reason" })
  suspensionReason?: string;

  @Column({ name: "approved_by", nullable: true })
  approvedBy?: number;

  @ManyToOne(() => AdminUser, { nullable: true })
  @JoinColumn({ name: "approved_by" })
  approver?: any;

  @Column({ type: "timestamp", nullable: true, name: "approved_at" })
  approvedAt?: Date;

  @Column({ type: "text", nullable: true, name: "rejection_reason" })
  rejectionReason?: string;

  @Column({ type: "text", nullable: true, name: "admin_notes" })
  adminNotes?: string;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: any;

  @ManyToOne(() => Category, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "category_id" })
  category?: any;

  @ManyToOne(() => Subcategory, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "subcategory_id" })
  subcategory?: any;

  @OneToMany(() => ProductImage,  (pi: any) => pi.product)
  images?: any[];

  @OneToMany(() => ProductFeature,  (pf: any) => pf.product)
  productFeatures?: any[];

  @OneToMany(() => Review,  (r: any) => r.product)
  reviews?: any[];

  @OneToMany(() => Favorite,  (f: any) => f.product)
  favorites?: any[];

  @OneToMany(() => RecentlyViewed,  (rv: any) => rv.product)
  recentlyViewed?: any[];
}
