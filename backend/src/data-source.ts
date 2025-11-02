import "reflect-metadata";
import { DataSource } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config/env.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export const AppDataSource = new DataSource({
  type: "postgres",
  host: config.database.host,
  port: config.database.port,
  username: config.database.user,
  password: config.database.password,
  database: config.database.name,
  synchronize: false,
  logging: config.database.logging,
  namingStrategy: new SnakeNamingStrategy(),
  entities: [
    join(__dirname, "entities", "AdminUser.ts"),
    join(__dirname, "entities", "AdminSession.ts"),
    join(__dirname, "entities", "AdminAuditLog.ts"),
    join(__dirname, "entities", "AdModerationHistory.ts"),
    join(__dirname, "entities", "Alert.ts"),
    join(__dirname, "entities", "ApplicationDocument.ts"),
    join(__dirname, "entities", "ApplicationReview.ts"),
    join(__dirname, "entities", "Category.ts"),
    join(__dirname, "entities", "Chatroom.ts"),
    join(__dirname, "entities", "ChatroomMember.ts"),
    join(__dirname, "entities", "Coupon.ts"),
    join(__dirname, "entities", "CouponRedemption.ts"),
    join(__dirname, "entities", "FCMDevice.ts"),
    join(__dirname, "entities", "Feature.ts"),
    join(__dirname, "entities", "Favorite.ts"),
    join(__dirname, "entities", "JobApplication.ts"),
    join(__dirname, "entities", "Message.ts"),
    join(__dirname, "entities", "NotificationHistory.ts"),
    join(__dirname, "entities", "OTPCode.ts"),
    join(__dirname, "entities", "Product.ts"),
    join(__dirname, "entities", "ProductFeature.ts"),
    join(__dirname, "entities", "ProductImage.ts"),
    join(__dirname, "entities", "RecentlyViewed.ts"),
    join(__dirname, "entities", "Referral.ts"),
    join(__dirname, "entities", "ReferralRedemption.ts"),
    join(__dirname, "entities", "Review.ts"),
    join(__dirname, "entities", "SearchHistory.ts"),
    join(__dirname, "entities", "Subcategory.ts"),
    join(__dirname, "entities", "SupportCase.ts"),
    join(__dirname, "entities", "SupportCaseAssignment.ts"),
    join(__dirname, "entities", "SupportMessage.ts"),
    join(__dirname, "entities", "SystemSettings.ts"),
    join(__dirname, "entities", "User.ts"),
    join(__dirname, "entities", "UserAnalytics.ts"),
    join(__dirname, "entities", "UserReport.ts"),
    join(__dirname, "entities", "Wallet.ts"),
    join(__dirname, "entities", "WalletLedger.ts"),
  ],
  migrations: [join(__dirname, "migrations", "*.{ts,js}")],
  subscribers: [],
  ssl: config.server.isProduction ? { rejectUnauthorized: false } : false,
});
