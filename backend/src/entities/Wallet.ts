import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User.js";
import { WalletLedger } from "./WalletLedger.js";

@Entity("wallets")
export class Wallet {
  @PrimaryColumn("uuid", { name: "user_id" })
  userId!: string;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  balance!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToOne(() => User, (u) => u.wallet, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @OneToMany(() => WalletLedger, (wl) => wl.wallet)
  ledger?: WalletLedger[];
}
