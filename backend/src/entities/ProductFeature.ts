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
import { Feature } from "./Feature.js";

@Entity("product_features")
export class ProductFeature {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "product_id" })
  @Index()
  productId!: string;

  @Column({ type: "uuid", name: "feature_id" })
  @Index()
  featureId!: string;

  @Column({ type: "text", nullable: true })
  value?: string;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne("Product", "productFeatures", { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product: any;

  @ManyToOne("Feature", "productFeatures", { onDelete: "CASCADE" })
  @JoinColumn({ name: "feature_id" })
  feature: any;
}
