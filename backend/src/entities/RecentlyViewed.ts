import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import type { Product } from "./Product.js";
import type { User } from "./User.js";

@Entity("recently_viewed")
@Unique(["userId", "productId"])
@Index(["userId", "viewedAt"])
export class RecentlyViewed {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "user_id" })
  @Index()
  userId!: string;

  @Column({ type: "uuid", name: "product_id" })
  @Index()
  productId!: string;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  createdAt!: Date;

  @Column({ type: "timestamp", name: "viewed_at" })
  viewedAt!: Date;

  @ManyToOne("User", "recentlyViewed", { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: User;

  @ManyToOne("Product", "recentlyViewed", { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product?: Product;
}
