import type { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1762101486201 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types first
    await queryRunner.query(
      `CREATE TYPE "admin_users_role_enum" AS ENUM('super-admin', 'admin', 'staff', 'support')`
    );
    await queryRunner.query(
      `CREATE TYPE "users_verification_status_enum" AS ENUM('unverified', 'pending', 'verified')`
    );
    await queryRunner.query(
      `CREATE TYPE "users_verification_level_enum" AS ENUM('basic', 'advanced', 'premium')`
    );
    await queryRunner.query(
      `CREATE TYPE "products_status_enum" AS ENUM('draft', 'active', 'paused', 'archived', 'sold')`
    );
    await queryRunner.query(
      `CREATE TYPE "products_moderation_status_enum" AS ENUM('pending', 'active', 'suspended', 'rejected')`
    );
    await queryRunner.query(
      `CREATE TYPE "alerts_status_enum" AS ENUM('draft', 'active', 'scheduled', 'sent', 'cancelled')`
    );
    await queryRunner.query(
      `CREATE TYPE "support_cases_status_enum" AS ENUM('open', 'in-progress', 'resolved', 'closed')`
    );
    await queryRunner.query(
      `CREATE TYPE "support_cases_priority_enum" AS ENUM('low', 'normal', 'high', 'urgent')`
    );
    await queryRunner.query(
      `CREATE TYPE "user_reports_status_enum" AS ENUM('pending', 'resolved', 'dismissed')`
    );
    await queryRunner.query(
      `CREATE TYPE "system_settings_type_enum" AS ENUM('string', 'number', 'boolean', 'json')`
    );

    // Create all core tables
    await queryRunner.query(
      `CREATE TABLE "admin_users" (
        "id" SERIAL NOT NULL,
        "username" character varying(50) NOT NULL,
        "email" character varying(255),
        "password_hash" character varying(255) NOT NULL,
        "role" "admin_users_role_enum" NOT NULL DEFAULT 'staff',
        "sub_role" character varying(50),
        "permissions" jsonb NOT NULL DEFAULT '[]',
        "is_active" boolean NOT NULL DEFAULT true,
        "profile_image_url" character varying(500),
        "business_name" character varying(255),
        "business_logo_url" character varying(500),
        "last_login_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_admin_users_username" UNIQUE ("username"),
        CONSTRAINT "UQ_admin_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_admin_users" PRIMARY KEY ("id")
      )`
    );

    await queryRunner.query(
      `CREATE TABLE "categories" (
        "id" SERIAL NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" text,
        "icon" character varying(100),
        "image_url" character varying(500),
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_categories_name" UNIQUE ("name"),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id")
      )`
    );

    await queryRunner.query(
      `CREATE TABLE "subcategories" (
        "id" SERIAL NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" text,
        "category_id" integer NOT NULL,
        "icon" character varying(100),
        "image_url" character varying(500),
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_subcategories_name_category" UNIQUE ("name", "category_id"),
        CONSTRAINT "PK_subcategories" PRIMARY KEY ("id")
      )`
    );

    await queryRunner.query(
      `CREATE TABLE "admin_sessions" (
        "id" SERIAL NOT NULL,
        "admin_user_id" integer NOT NULL,
        "token_hash" character varying(255) NOT NULL,
        "refresh_token_hash" character varying(255),
        "expires_at" TIMESTAMP NOT NULL,
        "ip_address" inet,
        "user_agent" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_820cb9c73b9f2bf3f2fb678d935" UNIQUE ("token_hash"),
        CONSTRAINT "UQ_1def6946a43bfad01f38da9b603" UNIQUE ("refresh_token_hash"),
        CONSTRAINT "PK_38bb553c2372215d48de2306c5e" PRIMARY KEY ("id")
      )`
    );

    await queryRunner.query(
      `CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(50) NOT NULL,
        "phone" character varying(15),
        "password_hash" character varying(128),
        "google_id" character varying(50),
        "name" character varying(255),
        "address" character varying(500),
        "avatar_public_id" text,
        "avatar_url" text,
        "avatar_format" text,
        "avatar_bytes" integer,
        "avatar_width" integer,
        "avatar_height" integer,
        "referral_code" character varying(20),
        "referral_points" bigint NOT NULL DEFAULT 0,
        "level" character varying(20) NOT NULL DEFAULT 'SILVER',
        "is_active" boolean NOT NULL DEFAULT true,
        "is_staff" boolean NOT NULL DEFAULT false,
        "is_superuser" boolean NOT NULL DEFAULT false,
        "phone_verified" boolean NOT NULL DEFAULT false,
        "email_verified" boolean NOT NULL DEFAULT false,
        "preferred_notification_email" character varying(50),
        "preferred_notification_phone" character varying(15),
        "created_from_app" boolean NOT NULL DEFAULT true,
        "deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "last_login" TIMESTAMP,
        "verification_status" "users_verification_status_enum" NOT NULL DEFAULT 'unverified',
        "verification_level" "users_verification_level_enum" NOT NULL DEFAULT 'basic',
        "is_muted" boolean NOT NULL DEFAULT false,
        "muted_by" integer,
        "muted_at" TIMESTAMP,
        "mute_reason" text,
        "verified_by" integer,
        "verified_at" TIMESTAMP,
        "admin_notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "UQ_users_phone" UNIQUE ("phone"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )`
    );

    await queryRunner.query(
      `CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pid" character varying(20),
        "user_id" uuid NOT NULL,
        "category_id" integer,
        "subcategory_id" integer,
        "name" character varying(100) NOT NULL,
        "description" text NOT NULL,
        "image" text,
        "price" numeric(10,2) NOT NULL,
        "status" "products_status_enum" NOT NULL DEFAULT 'draft',
        "views_count" integer NOT NULL DEFAULT '0',
        "favorites_count" integer NOT NULL DEFAULT '0',
        "reports_count" integer NOT NULL DEFAULT '0',
        "is_promoted" boolean NOT NULL DEFAULT false,
        "promoted_until" TIMESTAMP,
        "deleted" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "moderation_status" "products_moderation_status_enum" NOT NULL DEFAULT 'pending',
        "moderated_by" integer,
        "moderated_at" TIMESTAMP,
        "suspension_reason" text,
        "approved_by" integer,
        "approved_at" TIMESTAMP,
        "rejection_reason" text,
        "admin_notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_7311085e7abaaedf39f5019c35b" UNIQUE ("pid"),
        CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id")
      )`
    );

    // Create all additional tables
    await queryRunner.query(
      `CREATE TABLE "chatroom_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "chatroom_id" uuid NOT NULL, "user_id" uuid NOT NULL, "last_read_message_id" uuid, "last_read_at" TIMESTAMP, "joined_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_831eb2549102ce2b291ec831d5d" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "coupon_redemptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "coupon_id" uuid NOT NULL, "user_id" uuid NOT NULL, "discount_amount" numeric(10,2) NOT NULL, "order_amount" numeric(10,2) NOT NULL, "redeemed_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_dd4cda7c82246e92c50453fda30" UNIQUE ("user_id", "coupon_id"), CONSTRAINT "PK_5086813ea980d21dbeb190ed0a7" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9df1b9bc48e3eea5da3762f8e5" ON "coupon_redemptions" ("coupon_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_986f8dd830915cf2835f89709d" ON "coupon_redemptions" ("user_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "coupons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(50) NOT NULL, "description" text, "discount_type" character varying(10) NOT NULL, "discount_value" numeric(10,2) NOT NULL, "max_uses" bigint, "used_count" integer NOT NULL DEFAULT '0', "per_user_limit" integer NOT NULL DEFAULT '1', "valid_from" TIMESTAMP, "valid_until" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "created_by" uuid, "min_order_amount" numeric(10,2), "usage_limit" integer, "max_discount_amount" numeric(10,2), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e025109230e82925843f2a14c48" UNIQUE ("code"), CONSTRAINT "PK_d7ea8864a0150183770f3e9a8cb" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e025109230e82925843f2a14c4" ON "coupons" ("code") `
    );
    await queryRunner.query(
      `CREATE TABLE "fcm_devices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "token" character varying(255) NOT NULL, "device_info" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_785fe0046bfff3ba5fbe22ff6b5" UNIQUE ("token"), CONSTRAINT "PK_df89260289da56ca1ba815c3446" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cee8e59b0b919e0f0fea8a8e89" ON "fcm_devices" ("user_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_785fe0046bfff3ba5fbe22ff6b" ON "fcm_devices" ("token") `
    );
    await queryRunner.query(
      `CREATE TABLE "favorites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "product_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "uq_favorites_user_product" UNIQUE ("user_id", "product_id"), CONSTRAINT "PK_890818d27523748dd36a4d1bdc8" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_35a6b05ee3b624d0de01ee5059" ON "favorites" ("user_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_003e599a9fc0e8f154b6313639" ON "favorites" ("product_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "room_id" uuid NOT NULL, "sender_id" uuid, "content" text NOT NULL, "message_type" character varying(20) NOT NULL DEFAULT 'text', "file_url" text, "is_read" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9567685b5f7232c895fc29375e" ON "messages" ("room_id", "created_at") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9364e6b3f140d619c2a191d538" ON "messages" ("room_id", "id") `
    );
    await queryRunner.query(
      `CREATE TABLE "chatrooms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "room_id" character varying(200) NOT NULL, "name" character varying(100) NOT NULL, "is_group" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d6b60872c210a769a9a77cf2a30" UNIQUE ("room_id"), CONSTRAINT "PK_d190d6f785fb99dffb138cd0443" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d6b60872c210a769a9a77cf2a3" ON "chatrooms" ("room_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "notification_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "type" character varying(50) NOT NULL, "title" character varying(255) NOT NULL, "body" text NOT NULL, "data" jsonb, "is_read" boolean NOT NULL DEFAULT false, "read_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_901f37d36fcc63dffdc1281d6bd" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4be1055bf99ca49c468524a850" ON "notification_history" ("user_id", "is_read") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_65bb163f315f8bc642a706db6a" ON "notification_history" ("user_id", "created_at") `
    );
    await queryRunner.query(
      `CREATE TABLE "otp_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phone" character varying(10) NOT NULL, "otp" character varying(6) NOT NULL, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9d0487965ac1837d57fec4d6a26" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4fc4f51a23f34ac45b3920f169" ON "otp_codes" ("phone", "expires_at") `
    );
    await queryRunner.query(
      `CREATE TABLE "product_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "public_id" text NOT NULL, "url" text NOT NULL, "format" character varying(10), "bytes" integer, "width" integer, "height" integer, "display_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1974264ea7265989af8392f63a1" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4f166bb8c2bfcef2498d97b406" ON "product_images" ("product_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "recently_viewed" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "product_id" uuid NOT NULL, "viewed_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_69c131fcd783f4d5a30f6bbcfd3" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_13c5b56da6d00c32cb4c0764a0" ON "recently_viewed" ("user_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_72ecdebddea783ebe1ef655bbd" ON "recently_viewed" ("product_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "product_features" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "feature_id" uuid NOT NULL, "value" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a022cf7f3a083036c0ebbcacbc0" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_939542cc775c7bb88faf24b23a" ON "product_features" ("product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e8112444d4a4beec5f7d6dc536" ON "product_features" ("feature_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "features" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subcategory_id" integer NOT NULL, "name" character varying(100) NOT NULL, "description" text NOT NULL, "key" character varying(50), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5c1e336df2f4a7051e5bf08a941" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_93e8864031fab4b49493c926f7" ON "features" ("subcategory_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "regions" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "code" character varying(10) NOT NULL, "coordinates" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4f6dc5a464961e7c65a395ea4c6" UNIQUE ("code"), CONSTRAINT "PK_4fcd12ed6a046276e2deb08801c" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "referral_redemptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "redeemed_points" integer NOT NULL, "cash_amount" numeric(10,2) NOT NULL, "wallet_balance_after" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2215f085e5636a009baeabcb860" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1f68a0ad9eab8af5e5c5ecbcea" ON "referral_redemptions" ("user_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "referrals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "referrer_id" uuid NOT NULL, "referred_user_id" uuid NOT NULL, "points_earned" integer NOT NULL DEFAULT '250', "status" character varying NOT NULL DEFAULT 'pending', "confirmed_at" TIMESTAMP, "cancelled_at" TIMESTAMP, "cancelled_by" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_55aabf1620a232dd89201336b53" UNIQUE ("referrer_id", "referred_user_id"), CONSTRAINT "PK_ea9980e34f738b6252817326c08" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_18af9fcaffac6d6d3b28130e14" ON "referrals" ("referrer_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "user_id" uuid NOT NULL, "rating" integer NOT NULL, "comment" text, "likes_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_43968e5855f331f4f1355a3fb27" UNIQUE ("product_id", "user_id"), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9482e9567d8dcc2bc615981ef4" ON "reviews" ("product_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "search_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "query" character varying(255) NOT NULL, "results_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cb93c8f85dbdca85943ca494812" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d1ebf4101b2804213251e0a04d" ON "search_history" ("user_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_28c0159d8d5cbca27380289e41" ON "search_history" ("query") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c3e3193c5bd8073f56bdd62673" ON "search_history" ("user_id", "created_at") `
    );
    await queryRunner.query(
      `CREATE TABLE "support_cases" ("id" SERIAL NOT NULL, "user_id" uuid NOT NULL, "subject" character varying(255) NOT NULL, "status" "support_cases_status_enum" NOT NULL DEFAULT 'open', "priority" "support_cases_priority_enum" NOT NULL DEFAULT 'normal', "category" character varying(50), "assigned_admin_id" integer, "last_message_at" TIMESTAMP NOT NULL DEFAULT NOW(), "resolved_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c4cc80fe374d1965c37576527b5" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "support_messages" ("id" SERIAL NOT NULL, "case_id" integer NOT NULL, "sender_id" character varying NOT NULL, "sender_type" character varying(20) NOT NULL, "message_type" character varying(20) NOT NULL DEFAULT 'text', "content" text, "file_url" character varying(500), "file_name" character varying(255), "file_size" integer, "is_read" boolean NOT NULL DEFAULT false, "read_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2aa37479e71ef29cbf4dba2b1a2" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "towns" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "region_id" integer NOT NULL, "coordinates" jsonb, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8f5c3dbce1d3ea5de7dcc48c230" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b5a5beb6b0365fd074c42a8b6a" ON "towns" ("is_active") `
    );
    await queryRunner.query(
      `CREATE TABLE "ad_moderation_history" ("id" SERIAL NOT NULL, "ad_id" uuid NOT NULL, "admin_user_id" integer NOT NULL, "action" character varying(50) NOT NULL, "reason" text, "old_status" character varying(20), "new_status" character varying(20), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_86591b52cbe321dcbd9918cec0e" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "alerts" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "message" text NOT NULL, "type" character varying(20) NOT NULL, "status" "alerts_status_enum" NOT NULL DEFAULT 'active', "recipient_ids" jsonb NOT NULL, "linked_ad_ids" jsonb, "coupon_id" uuid, "created_by" integer NOT NULL, "send_immediately" boolean NOT NULL DEFAULT true, "scheduled_for" TIMESTAMP, "delivered_count" integer NOT NULL DEFAULT '0', "clicked_count" integer NOT NULL DEFAULT '0', "expires_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_60f895662df096bfcdfab7f4b96" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "admin_audit_log" ("id" SERIAL NOT NULL, "admin_user_id" integer NOT NULL, "action" character varying(100) NOT NULL, "resource_type" character varying(50) NOT NULL, "resource_id" integer, "old_values" jsonb, "new_values" jsonb, "ip_address" inet, "user_agent" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9425be48a9c753f5753017c61b2" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "job_applications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(15), "status" character varying(50) NOT NULL DEFAULT 'pending', "cover_letter" text, "experience" text, "skills" text, "position" character varying(255), "admin_notes" text, "feedback" text, "reviewed_by" integer, "reviewed_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c56a5e86707d0f0df18fa111280" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "application_reviews" ("id" SERIAL NOT NULL, "application_id" uuid NOT NULL, "admin_user_id" integer NOT NULL, "action" character varying(50) NOT NULL, "notes" text, "feedback" text, "old_status" character varying(50), "new_status" character varying(50), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_23f8004d07c6b4fd00875407a35" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "system_settings" ("id" SERIAL NOT NULL, "key" character varying(100) NOT NULL, "value" jsonb, "description" text, "category" character varying(50), "is_public" boolean NOT NULL DEFAULT false, "updated_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b1b5bc664526d375c94ce9ad43d" UNIQUE ("key"), CONSTRAINT "PK_82521f08790d248b2a80cc85d40" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "support_case_assignments" ("id" SERIAL NOT NULL, "case_id" integer NOT NULL, "admin_user_id" integer NOT NULL, "assigned_at" TIMESTAMP NOT NULL DEFAULT now(), "unassigned_at" TIMESTAMP, "notes" text, CONSTRAINT "PK_62c75966c5c478af67cfe883825" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "application_documents" ("id" SERIAL NOT NULL, "application_id" uuid NOT NULL, "document_type" character varying(50) NOT NULL, "file_url" character varying(500) NOT NULL, "file_name" character varying(255) NOT NULL, "file_size" integer NOT NULL, "mime_type" character varying(100), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_592142aa992e003beadf1409e9e" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "user_analytics" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "event_type" character varying(50) NOT NULL, "entity_type" character varying(50) NOT NULL, "entity_id" uuid, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_23e622f18cec061f740c403ff75" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e1d34d7c48ed38c0cce711d8d6" ON "user_analytics" ("entity_type", "entity_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_224715a3888e12204bd443961c" ON "user_analytics" ("event_type", "created_at") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a0473894cfe6d12a550431e10d" ON "user_analytics" ("user_id", "created_at") `
    );
    await queryRunner.query(
      `CREATE TABLE "wallet_ledger" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "wallet_id" uuid NOT NULL, "amount" numeric(10,2) NOT NULL, "balance_after" numeric(10,2) NOT NULL, "transaction_type" character varying(20) NOT NULL, "reason" character varying(50) NOT NULL, "reference_id" uuid, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d925214b1961738af45cc6959af" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c8d8f0ba3509cfa5878eb68c56" ON "wallet_ledger" ("user_id", "created_at") `
    );
    await queryRunner.query(
      `CREATE TABLE "user_reports" ("id" SERIAL NOT NULL, "reporter_user_id" uuid NOT NULL, "reported_user_id" uuid NOT NULL, "report_type" character varying(50) NOT NULL, "description" text NOT NULL, "status" "user_reports_status_enum" NOT NULL DEFAULT 'pending', "admin_user_id" integer, "resolution" text, "resolved_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d727f04c93f97a3d445a647d234" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "wallets" ("user_id" uuid NOT NULL, "balance" numeric(10,2) NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_92558c08091598f7a4439586cda" PRIMARY KEY ("user_id"))`
    );

    // Add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "subcategories" ADD CONSTRAINT "FK_subcategories_category_id" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "admin_sessions" ADD CONSTRAINT "FK_admin_sessions_admin_user_id" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_products_category_id" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_products_subcategory_id" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_products_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_products_moderated_by" FOREIGN KEY ("moderated_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_products_approved_by" FOREIGN KEY ("approved_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "chatroom_members" ADD CONSTRAINT "FK_chatroom_members_chatroom_id" FOREIGN KEY ("chatroom_id") REFERENCES "chatrooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "chatroom_members" ADD CONSTRAINT "FK_chatroom_members_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_room_id" FOREIGN KEY ("room_id") REFERENCES "chatrooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_sender_id" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" ADD CONSTRAINT "FK_favorites_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" ADD CONSTRAINT "FK_favorites_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "notification_history" ADD CONSTRAINT "FK_notification_history_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "fcm_devices" ADD CONSTRAINT "FK_fcm_devices_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" ADD CONSTRAINT "FK_product_images_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "recently_viewed" ADD CONSTRAINT "FK_recently_viewed_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "recently_viewed" ADD CONSTRAINT "FK_recently_viewed_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "product_features" ADD CONSTRAINT "FK_product_features_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "product_features" ADD CONSTRAINT "FK_product_features_feature_id" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "features" ADD CONSTRAINT "FK_features_subcategory_id" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "towns" ADD CONSTRAINT "FK_towns_region_id" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "referral_redemptions" ADD CONSTRAINT "FK_referral_redemptions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD CONSTRAINT "FK_referrals_referrer_id" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD CONSTRAINT "FK_referrals_referred_user_id" FOREIGN KEY ("referred_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "search_history" ADD CONSTRAINT "FK_search_history_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "support_cases" ADD CONSTRAINT "FK_support_cases_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "support_cases" ADD CONSTRAINT "FK_support_cases_assigned_admin_id" FOREIGN KEY ("assigned_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "support_messages" ADD CONSTRAINT "FK_support_messages_case_id" FOREIGN KEY ("case_id") REFERENCES "support_cases"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "ad_moderation_history" ADD CONSTRAINT "FK_ad_moderation_history_ad_id" FOREIGN KEY ("ad_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "ad_moderation_history" ADD CONSTRAINT "FK_ad_moderation_history_admin_user_id" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD CONSTRAINT "FK_alerts_coupon_id" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD CONSTRAINT "FK_alerts_created_by" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "admin_audit_log" ADD CONSTRAINT "FK_admin_audit_log_admin_user_id" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "job_applications" ADD CONSTRAINT "FK_job_applications_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "job_applications" ADD CONSTRAINT "FK_job_applications_reviewed_by" FOREIGN KEY ("reviewed_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "application_reviews" ADD CONSTRAINT "FK_application_reviews_application_id" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "application_reviews" ADD CONSTRAINT "FK_application_reviews_admin_user_id" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "system_settings" ADD CONSTRAINT "FK_system_settings_updated_by" FOREIGN KEY ("updated_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "support_case_assignments" ADD CONSTRAINT "FK_support_case_assignments_case_id" FOREIGN KEY ("case_id") REFERENCES "support_cases"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "support_case_assignments" ADD CONSTRAINT "FK_support_case_assignments_admin_user_id" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "application_documents" ADD CONSTRAINT "FK_application_documents_application_id" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "user_analytics" ADD CONSTRAINT "FK_user_analytics_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_ledger" ADD CONSTRAINT "FK_wallet_ledger_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_ledger" ADD CONSTRAINT "FK_wallet_ledger_wallet_id" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "user_reports" ADD CONSTRAINT "FK_user_reports_reporter_user_id" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "user_reports" ADD CONSTRAINT "FK_user_reports_reported_user_id" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "user_reports" ADD CONSTRAINT "FK_user_reports_admin_user_id" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "FK_wallets_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "FK_coupon_redemptions_coupon_id" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "FK_coupon_redemptions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_admin_users_role" ON "admin_users" ("role")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_admin_users_active" ON "admin_users" ("is_active")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_admin_sessions_admin_user" ON "admin_sessions" ("admin_user_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_admin_sessions_expires_at" ON "admin_sessions" ("expires_at")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_admin_audit_log_admin_user" ON "admin_audit_log" ("admin_user_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_admin_audit_log_created_at" ON "admin_audit_log" ("created_at")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_email" ON "users" ("email")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_phone" ON "users" ("phone")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_category_id" ON "products" ("category_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_user_id" ON "products" ("user_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_status" ON "products" ("status")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_moderation_status" ON "products" ("moderation_status")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_alerts_status" ON "alerts" ("status")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_alerts_created_by" ON "alerts" ("created_by")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_support_cases_status" ON "support_cases" ("status")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_support_cases_assigned_admin" ON "support_cases" ("assigned_admin_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_reports_status" ON "user_reports" ("status")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_reports_reported_user" ON "user_reports" ("reported_user_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subcategories_category_id" ON "subcategories" ("category_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_categories_name" ON "categories" ("name")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_coupons_code" ON "coupons" ("code")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_system_settings_key" ON "system_settings" ("key")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order of dependencies
    await queryRunner.query(
      `DROP TABLE IF EXISTS "coupon_redemptions" CASCADE`
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "wallets" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_reports" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wallet_ledger" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_analytics" CASCADE`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "application_documents" CASCADE`
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "support_case_assignments" CASCADE`
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "system_settings" CASCADE`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "application_reviews" CASCADE`
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "job_applications" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_audit_log" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "alerts" CASCADE`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "ad_moderation_history" CASCADE`
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "towns" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "support_messages" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "support_cases" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "search_history" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "referrals" CASCADE`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "referral_redemptions" CASCADE`
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "regions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "features" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_features" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "recently_viewed" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_images" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "otp_codes" CASCADE`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "notification_history" CASCADE`
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "chatrooms" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "messages" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "favorites" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fcm_devices" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "coupons" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chatroom_members" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_sessions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subcategories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_users" CASCADE`);

    // Drop enum types
    await queryRunner.query(
      `DROP TYPE IF EXISTS "system_settings_type_enum" CASCADE`
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "user_reports_status_enum" CASCADE`
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "support_cases_priority_enum" CASCADE`
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "support_cases_status_enum" CASCADE`
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "alerts_status_enum" CASCADE`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "products_moderation_status_enum" CASCADE`
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "products_status_enum" CASCADE`
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "users_verification_level_enum" CASCADE`
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "users_verification_status_enum" CASCADE`
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "admin_users_role_enum" CASCADE`
    );
  }
}
