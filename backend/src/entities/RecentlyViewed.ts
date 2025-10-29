import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { User } from "./User.js";
import { Product } from "./Product.js";

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

  @ManyToOne(() => User, (u) => u.recentlyViewed, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: User;

  @ManyToOne(() => Product, (p) => p.recentlyViewed, { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product?: Product;
}
