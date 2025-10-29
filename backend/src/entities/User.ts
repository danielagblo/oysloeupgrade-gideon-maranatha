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

import { Product } from "./Product.js";
import { Review } from "./Review.js";
import { ChatroomMember } from "./ChatroomMember.js";
import { Message } from "./Message.js";
import { Referral } from "./Referral.js";
import { ReferralRedemption } from "./ReferralRedemption.js";
import { FCMDevice } from "./FCMDevice.js";
import { CouponRedemption } from "./CouponRedemption.js";
import { Wallet } from "./Wallet.js";
import { Favorite } from "./Favorite.js";
import { NotificationHistory } from "./NotificationHistory.js";
import { UserAnalytics } from "./UserAnalytics.js";
import { SearchHistory } from "./SearchHistory.js";
import { RecentlyViewed } from "./RecentlyViewed.js";

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
  products: any;

  @OneToMany("Review", "user")
  reviews: any;

  @OneToMany("ChatroomMember", "user")
  chatroomMembers: any;

  @OneToMany("Message", "sender")
  messages: any;

  @OneToMany("Referral", "referrer")
  referralsGiven: any;

  @OneToMany("Referral", "referredUser")
  referralsReceived: any;

  @OneToMany("ReferralRedemption", "user")
  referralRedemptions: any;

  @OneToMany("FCMDevice", "user")
  fcmDevices: any;

  @OneToMany("CouponRedemption", "user")
  couponRedemptions: any;

  @OneToOne("Wallet", "user")
  wallet: any;

  @OneToMany("Favorite", "user")
  favorites: any;

  @OneToMany("NotificationHistory", "user")
  notificationHistory: any;

  @OneToMany("UserAnalytics", "user")
  analytics: any;

  @OneToMany("SearchHistory", "user")
  searchHistory: any;

  @OneToMany("RecentlyViewed", "user")
  recentlyViewed: any;
}
