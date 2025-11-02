import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

import { Subcategory } from "./Subcategory.js";

import { Product } from "./Product.js";

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100, unique: true })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "varchar", length: 100, unique: true, nullable: true })
  slug?: string;

  @Column({ type: "text", nullable: true, name: "icon_url" })
  iconUrl?: string;

  @Column({ type: "integer", default: 0, name: "display_order" })
  displayOrder!: number;

  @Column({ type: "boolean", default: false })
  @Index()
  archived!: boolean;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => Subcategory, (s: Subcategory) => s.category)
  subcategories?: Subcategory[];

  @OneToMany(() => Product, (p: Product) => p.category)
  products?: Product[];
}
