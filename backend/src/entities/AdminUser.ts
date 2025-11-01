import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum AdminRole {
  SUPER_ADMIN = 'super-admin',
  ADMIN = 'admin',
  STAFF = 'staff',
  SUPPORT = 'support'
}

@Entity('admin_users')
export class AdminUser {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  email?: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: AdminRole,
    default: AdminRole.STAFF
  })
  role: AdminRole;

  @Column({ type: 'varchar', length: 50, nullable: true })
  subRole?: string;

  @Column({ type: 'jsonb', default: '[]' })
  permissions: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  profileImageUrl?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  businessName?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  businessLogoUrl?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
