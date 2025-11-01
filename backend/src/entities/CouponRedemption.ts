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
import { Coupon } from "./Coupon.js";
import { User } from "./User.js";

@Entity("coupon_redemptions")
@Unique(["userId", "couponId"])
export class CouponRedemption {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "coupon_id" })
  @Index()
  couponId!: string;

  @Column({ type: "uuid", name: "user_id" })
  @Index()
  userId!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "discount_amount" })
  discountAmount!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "order_amount" })
  orderAmount!: number;

  @CreateDateColumn({ type: "timestamp", name: "redeemed_at" })
  redeemedAt!: Date;

  @ManyToOne(() => Coupon, (c: any) => c.redemptions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "coupon_id" })
  coupon?: Coupon;

  @ManyToOne(() => User, (u: any) => u.couponRedemptions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: User;
}
