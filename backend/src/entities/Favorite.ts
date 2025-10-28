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

@Entity("user_favorites")
@Unique(["userId", "productId"])
@Index(["userId", "createdAt"])
export class Favorite {
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

  @ManyToOne("User", "favorites", { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: User;

  @ManyToOne("Product", "favorites", { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product?: Product;
}
