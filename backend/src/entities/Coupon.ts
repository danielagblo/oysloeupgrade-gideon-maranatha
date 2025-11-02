import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { CouponRedemption } from "./CouponRedemption.js";

export type DiscountType = "percent" | "fixed";

@Entity("coupons")
export class Coupon {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 50, unique: true })
  @Index()
  code!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "varchar", length: 10, name: "discount_type" })
  discountType!: DiscountType;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "discount_value" })
  discountValue!: number;

  @Column({ type: "bigint", nullable: true, name: "max_uses" })
  maxUses?: number;

  @Column({ type: "integer", default: 0, name: "used_count" })
  usedCount!: number;

  @Column({ type: "integer", default: 1, name: "per_user_limit" })
  perUserLimit!: number;

  @Column({ type: "timestamp", nullable: true, name: "valid_from" })
  validFrom?: Date;

  @Column({ type: "timestamp", nullable: true, name: "valid_until" })
  validUntil?: Date;

  @Column({ type: "boolean", default: true, name: "is_active" })
  isActive!: boolean;

  @Column({ type: "uuid", nullable: true, name: "created_by" })
  createdBy?: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
    name: "min_order_amount",
  })
  minOrderAmount?: number;

  @Column({ type: "integer", nullable: true, name: "usage_limit" })
  usageLimit?: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
    name: "max_discount_amount",
  })
  maxDiscountAmount?: number;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => CouponRedemption, (cr: CouponRedemption) => cr.coupon)
  redemptions?: CouponRedemption[];
}
