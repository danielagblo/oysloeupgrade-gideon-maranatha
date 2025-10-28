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
import type { Category } from "./Category.js";
import type { ProductFeature } from "./ProductFeature.js";
import type { ProductImage } from "./ProductImage.js";
import type { Review } from "./Review.js";
import type { Subcategory } from "./Subcategory.js";
import type { User } from "./User.js";

export type ProductStatus = "draft" | "active" | "paused" | "archived" | "sold";

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

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne("User", "products", { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: User;

  @ManyToOne("Category", "products", {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "category_id" })
  category?: Category;

  @ManyToOne("Subcategory", "products", {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "subcategory_id" })
  subcategory?: Subcategory;

  @OneToMany("ProductImage", "product")
  images?: ProductImage[];

  @OneToMany("ProductFeature", "product")
  productFeatures?: ProductFeature[];

  @OneToMany("Review", "product")
  reviews?: Review[];

  @OneToMany("Favorite", "product")
  favorites?: unknown[];

  @OneToMany("RecentlyViewed", "product")
  recentlyViewed?: unknown[];
}
