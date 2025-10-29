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

@Entity("search_history")
@Index(["userId", "createdAt"])
@Index(["query"])
export class SearchHistory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "user_id", nullable: true })
  @Index()
  userId?: string;

  @Column({ type: "varchar", length: 255 })
  query!: string;

  @Column({ type: "integer", default: 0, name: "results_count" })
  resultsCount!: number;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  createdAt!: Date;

  @ManyToOne(() => User, (u) => u.searchHistory, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: User;
}
