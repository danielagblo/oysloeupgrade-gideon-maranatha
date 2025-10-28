import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 50, unique: true })
  @Index()
  email!: string;

  @Column({ type: "varchar", length: 15, unique: true, nullable: true })
  @Index()
  phone?: string;

  @Column({
    type: "varchar",
    length: 128,
    name: "password_hash",
    nullable: true,
  })
  passwordHash?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  googleId?: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  address?: string;

  @Column({ type: "text", nullable: true, name: "avatar_public_id" })
  avatarPublicId?: string;

  @Column({ type: "text", nullable: true, name: "avatar_url" })
  avatarUrl?: string;

  @Column({ type: "text", nullable: true, name: "avatar_format" })
  avatarFormat?: string;

  @Column({ type: "integer", nullable: true, name: "avatar_bytes" })
  avatarBytes?: number;

  @Column({ type: "integer", nullable: true, name: "avatar_width" })
  avatarWidth?: number;

  @Column({ type: "integer", nullable: true, name: "avatar_height" })
  avatarHeight?: number;

  @Column({
    type: "varchar",
    length: 20,
    unique: true,
    nullable: true,
    name: "referral_code",
  })
  referralCode?: string;

  @Column({ type: "bigint", default: 0, name: "referral_points" })
  referralPoints!: number;

  @Column({ type: "varchar", length: 20, default: "SILVER" })
  level!: string;

  @Column({ type: "boolean", default: true, name: "is_active" })
  isActive!: boolean;

  @Column({ type: "boolean", default: false, name: "is_staff" })
  isStaff!: boolean;

  @Column({ type: "boolean", default: false, name: "is_superuser" })
  isSuperuser!: boolean;

  @Column({ type: "boolean", default: false, name: "phone_verified" })
  phoneVerified!: boolean;

  @Column({ type: "boolean", default: false, name: "email_verified" })
  emailVerified!: boolean;

  @Column({
    type: "varchar",
    length: 50,
    nullable: true,
    name: "preferred_notification_email",
  })
  preferredNotificationEmail?: string;

  @Column({
    type: "varchar",
    length: 15,
    nullable: true,
    name: "preferred_notification_phone",
  })
  preferredNotificationPhone?: string;

  @Column({ type: "boolean", default: true, name: "created_from_app" })
  createdFromApp!: boolean;

  @Column({ type: "boolean", default: false })
  deleted!: boolean;

  @Column({ type: "timestamp", nullable: true, name: "deleted_at" })
  deletedAt?: Date;

  @Column({ type: "timestamp", nullable: true, name: "last_login" })
  lastLogin?: Date;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp", name: "updated_at" })
  updatedAt!: Date;

  @OneToMany("Product", "user")
  products?: unknown[];

  @OneToMany("Review", "user")
  reviews?: unknown[];

  @OneToMany("ChatroomMember", "user")
  chatroomMembers?: unknown[];

  @OneToMany("Message", "sender")
  messages?: unknown[];

  @OneToMany("Referral", "referrer")
  referralsGiven?: unknown[];

  @OneToMany("Referral", "referredUser")
  referralsReceived?: unknown[];

  @OneToMany("ReferralRedemption", "user")
  referralRedemptions?: unknown[];

  @OneToMany("FCMDevice", "user")
  fcmDevices?: unknown[];

  @OneToMany("CouponRedemption", "user")
  couponRedemptions?: unknown[];

  @OneToOne("Wallet", "user")
  wallet?: {
    id: string;
    balance: number;
    ledger?: unknown[];
  };

  @OneToMany("Favorite", "user")
  favorites?: unknown[];

  @OneToMany("NotificationHistory", "user")
  notificationHistory?: unknown[];

  @OneToMany("UserAnalytics", "user")
  analytics?: unknown[];

  @OneToMany("SearchHistory", "user")
  searchHistory?: unknown[];

  @OneToMany("RecentlyViewed", "user")
  recentlyViewed?: unknown[];
}
