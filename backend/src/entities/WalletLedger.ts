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
import { Wallet } from "./Wallet.js";

@Entity("wallet_ledger")
@Index(["userId", "createdAt"])
export class WalletLedger {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "user_id" })
  userId!: string;

  @Column({ type: "uuid", name: "wallet_id" })
  walletId!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "balance_after" })
  balanceAfter!: number;

  @Column({ type: "varchar", length: 20, name: "transaction_type" })
  transactionType!: "credit" | "debit";

  @Column({ type: "varchar", length: 50 })
  reason!: string;

  @Column({ type: "uuid", nullable: true, name: "reference_id" })
  referenceId?: string;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  createdAt!: Date;

  @ManyToOne(() => User, (u) => u.wallet, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: User;

  @ManyToOne(() => Wallet, (w) => w.ledger)
  @JoinColumn({ name: "wallet_id" })
  wallet?: Wallet;
}
