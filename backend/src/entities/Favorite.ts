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
import { User } from "./User.js";
import { Product } from "./Product.js";


@Entity("favorites")
@Unique("uq_favorites_user_product", ["userId", "productId"])
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

  @ManyToOne(() => User, (u: any) => u.favorites, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: User;

  @ManyToOne(() => Product, (p: any) => p.favorites, { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product?: Product;
}
