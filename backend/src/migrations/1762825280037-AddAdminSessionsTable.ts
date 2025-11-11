import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdminSessionsTable1762825280037 implements MigrationInterface {
  name = "AddAdminSessionsTable1762825280037";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_products_category_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_products_user_id"`
    );
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
      `CREATE TABLE "features" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subcategory_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "description" text NOT NULL, "key" character varying(50), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5c1e336df2f4a7051e5bf08a941" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_93e8864031fab4b49493c926f7" ON "features" ("subcategory_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "regions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "code" character varying(10) NOT NULL, "coordinates" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4f6dc5a464961e7c65a395ea4c6" UNIQUE ("code"), CONSTRAINT "PK_4fcd12ed6a046276e2deb08801c" PRIMARY KEY ("id"))`
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
      `CREATE TABLE "support_cases" ("id" SERIAL NOT NULL, "user_id" uuid NOT NULL, "subject" character varying(255) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'open', "priority" character varying(20) NOT NULL DEFAULT 'normal', "category" character varying(50), "assigned_admin_id" integer, "last_message_at" TIMESTAMP NOT NULL DEFAULT NOW(), "resolved_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c4cc80fe374d1965c37576527b5" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "support_messages" ("id" SERIAL NOT NULL, "case_id" integer NOT NULL, "sender_id" character varying NOT NULL, "sender_type" character varying(20) NOT NULL, "message_type" character varying(20) NOT NULL DEFAULT 'text', "content" text, "file_url" character varying(500), "file_name" character varying(255), "file_size" integer, "is_read" boolean NOT NULL DEFAULT false, "read_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2aa37479e71ef29cbf4dba2b1a2" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "towns" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "region_id" uuid NOT NULL, "coordinates" jsonb, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8f5c3dbce1d3ea5de7dcc48c230" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b5a5beb6b0365fd074c42a8b6a" ON "towns" ("is_active") `
    );
    await queryRunner.query(
      `CREATE TABLE "ad_moderation_history" ("id" SERIAL NOT NULL, "ad_id" uuid NOT NULL, "admin_user_id" integer NOT NULL, "action" character varying(50) NOT NULL, "reason" text, "old_status" character varying(20), "new_status" character varying(20), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_86591b52cbe321dcbd9918cec0e" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "alerts" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "message" text NOT NULL, "type" character varying(20) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'active', "recipient_ids" jsonb NOT NULL, "linked_ad_ids" jsonb, "coupon_id" uuid, "created_by" integer NOT NULL, "send_immediately" boolean NOT NULL DEFAULT true, "scheduled_for" TIMESTAMP, "delivered_count" integer NOT NULL DEFAULT '0', "clicked_count" integer NOT NULL DEFAULT '0', "expires_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_60f895662df096bfcdfab7f4b96" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "admin_audit_log" ("id" SERIAL NOT NULL, "admin_user_id" integer NOT NULL, "action" character varying(100) NOT NULL, "resource_type" character varying(50) NOT NULL, "resource_id" integer, "old_values" jsonb, "new_values" jsonb, "ip_address" inet, "user_agent" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9425be48a9c753f5753017c61b2" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "admin_sessions" ("id" SERIAL NOT NULL, "admin_user_id" integer NOT NULL, "token_hash" character varying(255) NOT NULL, "refresh_token_hash" character varying(255), "expires_at" TIMESTAMP NOT NULL, "ip_address" inet, "user_agent" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_820cb9c73b9f2bf3f2fb678d935" UNIQUE ("token_hash"), CONSTRAINT "UQ_1def6946a43bfad01f38da9b603" UNIQUE ("refresh_token_hash"), CONSTRAINT "PK_38bb553c2372215d48de2306c5e" PRIMARY KEY ("id"))`
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
      `CREATE TABLE "subcategories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "category_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "description" text, "slug" character varying(100), "display_order" integer NOT NULL DEFAULT '0', "archived" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_793ef34ad0a3f86f09d4837007c" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f7b015bc580ae5179ba5a4f42e" ON "subcategories" ("category_id") `
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
      `CREATE TABLE "user_reports" ("id" SERIAL NOT NULL, "reporter_user_id" uuid NOT NULL, "reported_user_id" uuid NOT NULL, "report_type" character varying(50) NOT NULL, "description" text NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'pending', "admin_user_id" integer, "resolution" text, "resolved_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d727f04c93f97a3d445a647d234" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "wallets" ("user_id" uuid NOT NULL, "balance" numeric(10,2) NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_92558c08091598f7a4439586cda" PRIMARY KEY ("user_id"))`
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "title"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "condition"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "location"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "coordinates"`);
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "is_negotiable"`
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "is_featured"`);
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "images_count"`
    );
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "icon"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "image_url"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "is_active"`);
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN "sort_order"`
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "first_name"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_name"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "display_name"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "bio"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "location"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "muted_until"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_login_at"`);
    await queryRunner.query(
      `ALTER TABLE "products" ADD "pid" character varying(20)`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "UQ_7311085e7abaaedf39f5019c35b" UNIQUE ("pid")`
    );
    await queryRunner.query(`ALTER TABLE "products" ADD "subcategory_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "products" ADD "name" character varying(100) NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "products" ADD "image" text`);
    await queryRunner.query(
      `ALTER TABLE "products" ADD "reports_count" integer NOT NULL DEFAULT '0'`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "is_promoted" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "promoted_until" TIMESTAMP`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "deleted" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "deleted_at" TIMESTAMP`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "suspension_reason" text`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "rejection_reason" text`
    );
    await queryRunner.query(`ALTER TABLE "products" ADD "admin_notes" text`);
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "slug" character varying(100)`
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09" UNIQUE ("slug")`
    );
    await queryRunner.query(`ALTER TABLE "categories" ADD "icon_url" text`);
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "display_order" integer NOT NULL DEFAULT '0'`
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "archived" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "name" character varying(255) NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "address" character varying(500)`
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "avatar_public_id" text`);
    await queryRunner.query(`ALTER TABLE "users" ADD "avatar_format" text`);
    await queryRunner.query(`ALTER TABLE "users" ADD "avatar_bytes" integer`);
    await queryRunner.query(`ALTER TABLE "users" ADD "avatar_width" integer`);
    await queryRunner.query(`ALTER TABLE "users" ADD "avatar_height" integer`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "referral_code" character varying(20)`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_ba10055f9ef9690e77cf6445cba" UNIQUE ("referral_code")`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "referral_points" bigint NOT NULL DEFAULT '0'`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "level" character varying(20) NOT NULL DEFAULT 'SILVER'`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "is_staff" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "is_superuser" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "phone_verified" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "email_verified" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "preferred_notification_email" character varying(50)`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "preferred_notification_phone" character varying(15)`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "created_from_app" boolean NOT NULL DEFAULT true`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "deleted" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "users" ADD "last_login" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "users" ADD "muted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "users" ADD "mute_reason" text`);
    await queryRunner.query(`ALTER TABLE "users" ADD "admin_notes" text`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "category_id"`);
    await queryRunner.query(`ALTER TABLE "products" ADD "category_id" uuid`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."products_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "products" ADD "status" character varying(20) NOT NULL DEFAULT 'draft'`
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "moderation_status"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."products_moderation_status_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "moderation_status" character varying(20) NOT NULL DEFAULT 'pending'`
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "PK_categories"`
    );
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id")`
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_url"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "avatar_url" text`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "verification_status"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."users_verification_status_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "verification_status" character varying(20) NOT NULL DEFAULT 'unverified'`
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "verification_level"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."users_verification_level_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "verification_level" character varying(20) NOT NULL DEFAULT 'basic'`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_176b502c5ebd6e72cafbd9d6f7" ON "products" ("user_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9a5f6868c96e0069e699f33e12" ON "products" ("category_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1846199852a695713b1f8f5e9a" ON "products" ("status") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b2286c6d70b3aaf12046aa7016" ON "products" ("moderation_status") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a3cbd52956c4cc6fe840422bc6" ON "categories" ("archived") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a000cca60bcf04454e72769949" ON "users" ("phone") `
    );
    await queryRunner.query(
      `ALTER TABLE "chatroom_members" ADD CONSTRAINT "FK_ff5e08f25be5a3ed0e486754fd8" FOREIGN KEY ("chatroom_id") REFERENCES "chatrooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "chatroom_members" ADD CONSTRAINT "FK_1ab2a70203b9457454ab7928445" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "FK_9df1b9bc48e3eea5da3762f8e56" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "FK_986f8dd830915cf2835f89709df" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "fcm_devices" ADD CONSTRAINT "FK_cee8e59b0b919e0f0fea8a8e894" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" ADD CONSTRAINT "FK_35a6b05ee3b624d0de01ee50593" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" ADD CONSTRAINT "FK_003e599a9fc0e8f154b6313639f" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_1dda4fc8dbeeff2ee71f0088ba0" FOREIGN KEY ("room_id") REFERENCES "chatrooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "notification_history" ADD CONSTRAINT "FK_727a17e812879626235bc06cbe3" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" ADD CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "recently_viewed" ADD CONSTRAINT "FK_13c5b56da6d00c32cb4c0764a0e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "recently_viewed" ADD CONSTRAINT "FK_72ecdebddea783ebe1ef655bbd0" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "product_features" ADD CONSTRAINT "FK_939542cc775c7bb88faf24b23ab" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "product_features" ADD CONSTRAINT "FK_e8112444d4a4beec5f7d6dc5360" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "features" ADD CONSTRAINT "FK_93e8864031fab4b49493c926f7b" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "referral_redemptions" ADD CONSTRAINT "FK_1f68a0ad9eab8af5e5c5ecbcea5" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD CONSTRAINT "FK_18af9fcaffac6d6d3b28130e149" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD CONSTRAINT "FK_6e8e92ccfe617224a7f30adb6b3" FOREIGN KEY ("referred_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_9482e9567d8dcc2bc615981ef44" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "search_history" ADD CONSTRAINT "FK_d1ebf4101b2804213251e0a04d2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "support_cases" ADD CONSTRAINT "FK_5a99a9d58af4a0e3093e2d14252" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "support_cases" ADD CONSTRAINT "FK_a39beb2b481b4920b76cf0eed86" FOREIGN KEY ("assigned_admin_id") REFERENCES "admin_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "support_messages" ADD CONSTRAINT "FK_8c825aa202717f0516b512168d0" FOREIGN KEY ("case_id") REFERENCES "support_cases"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "towns" ADD CONSTRAINT "FK_bc6fdd078791390d8be81a62857" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_29565df5a020791583febb73c07" FOREIGN KEY ("moderated_by") REFERENCES "admin_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_641c6d1bb7d127da620b1179175" FOREIGN KEY ("approved_by") REFERENCES "admin_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_176b502c5ebd6e72cafbd9d6f70" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_c9de3a8edea9269ca774c919b9a" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "ad_moderation_history" ADD CONSTRAINT "FK_6c3a43769f915528c2015c7f554" FOREIGN KEY ("ad_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "ad_moderation_history" ADD CONSTRAINT "FK_1351bfb68717889cfaddcbab342" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD CONSTRAINT "FK_13cc1efe00291983890dd809cfa" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD CONSTRAINT "FK_779c7c43268165afb5a947e0562" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "admin_audit_log" ADD CONSTRAINT "FK_7abbe8f7be301725ce49e822788" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "admin_sessions" ADD CONSTRAINT "FK_c1711b1831bdf66b77c3605bcdb" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "job_applications" ADD CONSTRAINT "FK_fcfc78a3be953dac2443b9b53db" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "job_applications" ADD CONSTRAINT "FK_c3999006594d0112ae19443cf27" FOREIGN KEY ("reviewed_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "application_reviews" ADD CONSTRAINT "FK_37429cb43f4837e1c8a0032ba51" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "application_reviews" ADD CONSTRAINT "FK_22d981457073eae92e8f9fa2e97" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "system_settings" ADD CONSTRAINT "FK_301c531938f84c39fa5019e7465" FOREIGN KEY ("updated_by") REFERENCES "admin_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "support_case_assignments" ADD CONSTRAINT "FK_eb01a5e4cc56c669816c6d9fc05" FOREIGN KEY ("case_id") REFERENCES "support_cases"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "support_case_assignments" ADD CONSTRAINT "FK_7d3ff3317ac3b668637efbff05f" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "application_documents" ADD CONSTRAINT "FK_9ad8ab815e842d67e9aaec900cb" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "subcategories" ADD CONSTRAINT "FK_f7b015bc580ae5179ba5a4f42ec" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "user_analytics" ADD CONSTRAINT "FK_1b21a2704e98eb4ad610a671f2a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_ledger" ADD CONSTRAINT "FK_53d9fecd40f5fe635d119b49c4d" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "user_reports" ADD CONSTRAINT "FK_a3c4ba2f4a0cdd6ebcfdebd97ab" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "user_reports" ADD CONSTRAINT "FK_006c1307e23fea0915e8cf1882a" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "user_reports" ADD CONSTRAINT "FK_f6b9af9e74c67dd269b22d9d84a" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "FK_92558c08091598f7a4439586cda" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "FK_92558c08091598f7a4439586cda"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_reports" DROP CONSTRAINT "FK_f6b9af9e74c67dd269b22d9d84a"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_reports" DROP CONSTRAINT "FK_006c1307e23fea0915e8cf1882a"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_reports" DROP CONSTRAINT "FK_a3c4ba2f4a0cdd6ebcfdebd97ab"`
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_ledger" DROP CONSTRAINT "FK_53d9fecd40f5fe635d119b49c4d"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_analytics" DROP CONSTRAINT "FK_1b21a2704e98eb4ad610a671f2a"`
    );
    await queryRunner.query(
      `ALTER TABLE "subcategories" DROP CONSTRAINT "FK_f7b015bc580ae5179ba5a4f42ec"`
    );
    await queryRunner.query(
      `ALTER TABLE "application_documents" DROP CONSTRAINT "FK_9ad8ab815e842d67e9aaec900cb"`
    );
    await queryRunner.query(
      `ALTER TABLE "support_case_assignments" DROP CONSTRAINT "FK_7d3ff3317ac3b668637efbff05f"`
    );
    await queryRunner.query(
      `ALTER TABLE "support_case_assignments" DROP CONSTRAINT "FK_eb01a5e4cc56c669816c6d9fc05"`
    );
    await queryRunner.query(
      `ALTER TABLE "system_settings" DROP CONSTRAINT "FK_301c531938f84c39fa5019e7465"`
    );
    await queryRunner.query(
      `ALTER TABLE "application_reviews" DROP CONSTRAINT "FK_22d981457073eae92e8f9fa2e97"`
    );
    await queryRunner.query(
      `ALTER TABLE "application_reviews" DROP CONSTRAINT "FK_37429cb43f4837e1c8a0032ba51"`
    );
    await queryRunner.query(
      `ALTER TABLE "job_applications" DROP CONSTRAINT "FK_c3999006594d0112ae19443cf27"`
    );
    await queryRunner.query(
      `ALTER TABLE "job_applications" DROP CONSTRAINT "FK_fcfc78a3be953dac2443b9b53db"`
    );
    await queryRunner.query(
      `ALTER TABLE "admin_sessions" DROP CONSTRAINT "FK_c1711b1831bdf66b77c3605bcdb"`
    );
    await queryRunner.query(
      `ALTER TABLE "admin_audit_log" DROP CONSTRAINT "FK_7abbe8f7be301725ce49e822788"`
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" DROP CONSTRAINT "FK_779c7c43268165afb5a947e0562"`
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" DROP CONSTRAINT "FK_13cc1efe00291983890dd809cfa"`
    );
    await queryRunner.query(
      `ALTER TABLE "ad_moderation_history" DROP CONSTRAINT "FK_1351bfb68717889cfaddcbab342"`
    );
    await queryRunner.query(
      `ALTER TABLE "ad_moderation_history" DROP CONSTRAINT "FK_6c3a43769f915528c2015c7f554"`
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_c9de3a8edea9269ca774c919b9a"`
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_176b502c5ebd6e72cafbd9d6f70"`
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_641c6d1bb7d127da620b1179175"`
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_29565df5a020791583febb73c07"`
    );
    await queryRunner.query(
      `ALTER TABLE "towns" DROP CONSTRAINT "FK_bc6fdd078791390d8be81a62857"`
    );
    await queryRunner.query(
      `ALTER TABLE "support_messages" DROP CONSTRAINT "FK_8c825aa202717f0516b512168d0"`
    );
    await queryRunner.query(
      `ALTER TABLE "support_cases" DROP CONSTRAINT "FK_a39beb2b481b4920b76cf0eed86"`
    );
    await queryRunner.query(
      `ALTER TABLE "support_cases" DROP CONSTRAINT "FK_5a99a9d58af4a0e3093e2d14252"`
    );
    await queryRunner.query(
      `ALTER TABLE "search_history" DROP CONSTRAINT "FK_d1ebf4101b2804213251e0a04d2"`
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf"`
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_9482e9567d8dcc2bc615981ef44"`
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP CONSTRAINT "FK_6e8e92ccfe617224a7f30adb6b3"`
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP CONSTRAINT "FK_18af9fcaffac6d6d3b28130e149"`
    );
    await queryRunner.query(
      `ALTER TABLE "referral_redemptions" DROP CONSTRAINT "FK_1f68a0ad9eab8af5e5c5ecbcea5"`
    );
    await queryRunner.query(
      `ALTER TABLE "features" DROP CONSTRAINT "FK_93e8864031fab4b49493c926f7b"`
    );
    await queryRunner.query(
      `ALTER TABLE "product_features" DROP CONSTRAINT "FK_e8112444d4a4beec5f7d6dc5360"`
    );
    await queryRunner.query(
      `ALTER TABLE "product_features" DROP CONSTRAINT "FK_939542cc775c7bb88faf24b23ab"`
    );
    await queryRunner.query(
      `ALTER TABLE "recently_viewed" DROP CONSTRAINT "FK_72ecdebddea783ebe1ef655bbd0"`
    );
    await queryRunner.query(
      `ALTER TABLE "recently_viewed" DROP CONSTRAINT "FK_13c5b56da6d00c32cb4c0764a0e"`
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068"`
    );
    await queryRunner.query(
      `ALTER TABLE "notification_history" DROP CONSTRAINT "FK_727a17e812879626235bc06cbe3"`
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_1dda4fc8dbeeff2ee71f0088ba0"`
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" DROP CONSTRAINT "FK_003e599a9fc0e8f154b6313639f"`
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" DROP CONSTRAINT "FK_35a6b05ee3b624d0de01ee50593"`
    );
    await queryRunner.query(
      `ALTER TABLE "fcm_devices" DROP CONSTRAINT "FK_cee8e59b0b919e0f0fea8a8e894"`
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" DROP CONSTRAINT "FK_986f8dd830915cf2835f89709df"`
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" DROP CONSTRAINT "FK_9df1b9bc48e3eea5da3762f8e56"`
    );
    await queryRunner.query(
      `ALTER TABLE "chatroom_members" DROP CONSTRAINT "FK_1ab2a70203b9457454ab7928445"`
    );
    await queryRunner.query(
      `ALTER TABLE "chatroom_members" DROP CONSTRAINT "FK_ff5e08f25be5a3ed0e486754fd8"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a000cca60bcf04454e72769949"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a3cbd52956c4cc6fe840422bc6"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b2286c6d70b3aaf12046aa7016"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1846199852a695713b1f8f5e9a"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9a5f6868c96e0069e699f33e12"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_176b502c5ebd6e72cafbd9d6f7"`
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "verification_level"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_verification_level_enum" AS ENUM('basic', 'advanced', 'premium')`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "verification_level" "public"."users_verification_level_enum" NOT NULL DEFAULT 'basic'`
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "verification_status"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_verification_status_enum" AS ENUM('unverified', 'pending', 'verified')`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "verification_status" "public"."users_verification_status_enum" NOT NULL DEFAULT 'unverified'`
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_url"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "avatar_url" character varying(500)`
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b"`
    );
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "id" SERIAL NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "PK_categories" PRIMARY KEY ("id")`
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "moderation_status"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."products_moderation_status_enum" AS ENUM('pending', 'active', 'suspended', 'rejected')`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "moderation_status" "public"."products_moderation_status_enum" NOT NULL DEFAULT 'pending'`
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "status"`);
    await queryRunner.query(
      `CREATE TYPE "public"."products_status_enum" AS ENUM('draft', 'active', 'paused', 'archived', 'sold')`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "status" "public"."products_status_enum" NOT NULL DEFAULT 'draft'`
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "category_id"`);
    await queryRunner.query(
      `ALTER TABLE "products" ADD "category_id" integer NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "admin_notes"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "mute_reason"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "muted_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_login"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "created_from_app"`
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "preferred_notification_phone"`
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "preferred_notification_email"`
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verified"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone_verified"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_superuser"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_staff"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "level"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "referral_points"`
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_ba10055f9ef9690e77cf6445cba"`
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "referral_code"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_height"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_width"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_bytes"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_format"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "avatar_public_id"`
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "address"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "archived"`);
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN "display_order"`
    );
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "icon_url"`);
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09"`
    );
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "slug"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "admin_notes"`);
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "rejection_reason"`
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "suspension_reason"`
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "deleted"`);
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "promoted_until"`
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "is_promoted"`);
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "reports_count"`
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "image"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "name"`);
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "subcategory_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "UQ_7311085e7abaaedf39f5019c35b"`
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "pid"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "last_login_at" TIMESTAMP`
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "muted_until" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "location" character varying(100)`
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "bio" text`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "display_name" character varying(100)`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "last_name" character varying(50)`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "first_name" character varying(50)`
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "sort_order" integer NOT NULL DEFAULT '0'`
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "is_active" boolean NOT NULL DEFAULT true`
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "image_url" character varying(500)`
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "icon" character varying(100)`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "images_count" integer NOT NULL DEFAULT '0'`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "is_featured" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "is_negotiable" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(`ALTER TABLE "products" ADD "coordinates" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "products" ADD "location" character varying(100)`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "condition" character varying(50)`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "title" character varying(200) NOT NULL`
    );
    await queryRunner.query(`DROP TABLE "wallets"`);
    await queryRunner.query(`DROP TABLE "user_reports"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c8d8f0ba3509cfa5878eb68c56"`
    );
    await queryRunner.query(`DROP TABLE "wallet_ledger"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a0473894cfe6d12a550431e10d"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_224715a3888e12204bd443961c"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e1d34d7c48ed38c0cce711d8d6"`
    );
    await queryRunner.query(`DROP TABLE "user_analytics"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f7b015bc580ae5179ba5a4f42e"`
    );
    await queryRunner.query(`DROP TABLE "subcategories"`);
    await queryRunner.query(`DROP TABLE "application_documents"`);
    await queryRunner.query(`DROP TABLE "support_case_assignments"`);
    await queryRunner.query(`DROP TABLE "system_settings"`);
    await queryRunner.query(`DROP TABLE "application_reviews"`);
    await queryRunner.query(`DROP TABLE "job_applications"`);
    await queryRunner.query(`DROP TABLE "admin_sessions"`);
    await queryRunner.query(`DROP TABLE "admin_audit_log"`);
    await queryRunner.query(`DROP TABLE "alerts"`);
    await queryRunner.query(`DROP TABLE "ad_moderation_history"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b5a5beb6b0365fd074c42a8b6a"`
    );
    await queryRunner.query(`DROP TABLE "towns"`);
    await queryRunner.query(`DROP TABLE "support_messages"`);
    await queryRunner.query(`DROP TABLE "support_cases"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c3e3193c5bd8073f56bdd62673"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_28c0159d8d5cbca27380289e41"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d1ebf4101b2804213251e0a04d"`
    );
    await queryRunner.query(`DROP TABLE "search_history"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9482e9567d8dcc2bc615981ef4"`
    );
    await queryRunner.query(`DROP TABLE "reviews"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_18af9fcaffac6d6d3b28130e14"`
    );
    await queryRunner.query(`DROP TABLE "referrals"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1f68a0ad9eab8af5e5c5ecbcea"`
    );
    await queryRunner.query(`DROP TABLE "referral_redemptions"`);
    await queryRunner.query(`DROP TABLE "regions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_93e8864031fab4b49493c926f7"`
    );
    await queryRunner.query(`DROP TABLE "features"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e8112444d4a4beec5f7d6dc536"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_939542cc775c7bb88faf24b23a"`
    );
    await queryRunner.query(`DROP TABLE "product_features"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_72ecdebddea783ebe1ef655bbd"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_13c5b56da6d00c32cb4c0764a0"`
    );
    await queryRunner.query(`DROP TABLE "recently_viewed"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4f166bb8c2bfcef2498d97b406"`
    );
    await queryRunner.query(`DROP TABLE "product_images"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4fc4f51a23f34ac45b3920f169"`
    );
    await queryRunner.query(`DROP TABLE "otp_codes"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_65bb163f315f8bc642a706db6a"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4be1055bf99ca49c468524a850"`
    );
    await queryRunner.query(`DROP TABLE "notification_history"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d6b60872c210a769a9a77cf2a3"`
    );
    await queryRunner.query(`DROP TABLE "chatrooms"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9364e6b3f140d619c2a191d538"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9567685b5f7232c895fc29375e"`
    );
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_003e599a9fc0e8f154b6313639"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_35a6b05ee3b624d0de01ee5059"`
    );
    await queryRunner.query(`DROP TABLE "favorites"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_785fe0046bfff3ba5fbe22ff6b"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cee8e59b0b919e0f0fea8a8e89"`
    );
    await queryRunner.query(`DROP TABLE "fcm_devices"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e025109230e82925843f2a14c4"`
    );
    await queryRunner.query(`DROP TABLE "coupons"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_986f8dd830915cf2835f89709d"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9df1b9bc48e3eea5da3762f8e5"`
    );
    await queryRunner.query(`DROP TABLE "coupon_redemptions"`);
    await queryRunner.query(`DROP TABLE "chatroom_members"`);
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_products_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_products_category_id" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
