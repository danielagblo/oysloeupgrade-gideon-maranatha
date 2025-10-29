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

import { Category } from "./Category.js";
import { Feature } from "./Feature.js";
import { Product } from "./Product.js";

@Entity("subcategories")
export class Subcategory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "category_id" })
  @Index()
  categoryId!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  slug?: string;

  @Column({ type: "integer", default: 0, name: "display_order" })
  displayOrder!: number;

  @Column({ type: "boolean", default: false })
  archived!: boolean;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne("Category", "subcategories", { onDelete: "RESTRICT" })
  @JoinColumn({ name: "category_id" })
  category: any;

  @OneToMany("Feature", "subcategory")
  features: any;

  @OneToMany("Product", "subcategory")
  products: any;
}
