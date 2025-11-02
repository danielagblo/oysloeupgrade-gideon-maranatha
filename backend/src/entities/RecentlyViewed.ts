import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from "typeorm";

import type { User } from "./User.js";
import type { Product } from "./Product.js";

@Entity("recently_viewed")
export class RecentlyViewed {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "user_id" })
  @Index()
  userId!: string;

  @Column({ type: "uuid", name: "product_id" })
  @Index()
  productId!: string;

  @CreateDateColumn({ type: "timestamp", name: "viewed_at" })
  viewedAt!: Date;

  @ManyToOne("User", (u: any) => u.recentlyViewed, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: User;

  @ManyToOne("Product", (p: any) => p.recentlyViewed, { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product?: Product;
}
