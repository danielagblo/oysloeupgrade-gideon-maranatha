import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Product } from "./Product.js";

@Entity("product_images")
export class ProductImage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "product_id" })
  @Index()
  productId!: string;

  @Column({ type: "text", name: "public_id" })
  publicId!: string;

  @Column({ type: "text", name: "url" })
  url!: string;

  @Column({ type: "varchar", length: 10, nullable: true })
  format?: string;

  @Column({ type: "integer", nullable: true })
  bytes?: number;

  @Column({ type: "integer", nullable: true })
  width?: number;

  @Column({ type: "integer", nullable: true })
  height?: number;

  @Column({ type: "integer", default: 0, name: "display_order" })
  displayOrder!: number;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne("Product", "images", { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product: any;
}
