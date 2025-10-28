import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import type { Product } from "./Product.js";

@Entity("product_images")
export class ProductImage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "product_id" })
  @Index()
  productId!: string;

  @Column({ type: "text", name: "cdn_public_id" })
  cdnPublicId!: string;

  @Column({ type: "text", name: "cdn_url" })
  cdnUrl!: string;

  @Column({ type: "text", name: "cdn_resource_type" })
  cdnResourceType!: string;

  @Column({ type: "text", name: "cdn_format" })
  cdnFormat!: string;

  @Column({ type: "integer", name: "cdn_bytes" })
  cdnBytes!: number;

  @Column({ type: "integer", nullable: true, name: "cdn_width" })
  cdnWidth?: number;

  @Column({ type: "integer", nullable: true, name: "cdn_height" })
  cdnHeight?: number;

  @Column({ type: "boolean", default: false, name: "is_primary" })
  isPrimary!: boolean;

  @Column({ type: "integer", default: 0, name: "display_order" })
  displayOrder!: number;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  createdAt!: Date;

  @ManyToOne("Product", "images", { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product?: Product;
}
