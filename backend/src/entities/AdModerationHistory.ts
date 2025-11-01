import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { AdminUser } from "./AdminUser.js";
import { Product } from "./Product.js";

@Entity('ad_moderation_history')
export class AdModerationHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', name: 'ad_id' })
  adId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'ad_id' })
  ad: Product;

  @Column({ name: 'admin_user_id' })
  adminUserId: number;

  @ManyToOne(() => AdminUser)
  @JoinColumn({ name: 'admin_user_id' })
  adminUser: AdminUser;

  @Column({ type: 'varchar', length: 50 })
  action: string; // 'approve', 'reject', 'suspend', 'activate'

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  oldStatus?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  newStatus?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
