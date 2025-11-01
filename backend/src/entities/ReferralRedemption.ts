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

@Entity("referral_redemptions")
export class ReferralRedemption {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "user_id" })
  @Index()
  userId!: string;

  @Column({ type: "integer", name: "redeemed_points" })
  redeemedPoints!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "cash_amount" })
  cashAmount!: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    name: "wallet_balance_after",
  })
  walletBalanceAfter!: number;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  createdAt!: Date;

  @ManyToOne(() => User, (u: any) => u.referralRedemptions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: User;
}
