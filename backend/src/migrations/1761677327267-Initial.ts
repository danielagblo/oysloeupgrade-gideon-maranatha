import type { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1761677327267 implements MigrationInterface {
  name = "Initial1761677327267";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(50) NOT NULL, "phone" character varying(15), "password_hash" character varying(128), "googleId" character varying(50), "name" character varying(255) NOT NULL, "address" character varying(500), "avatar_public_id" text, "avatar_url" text, "avatar_format" text, "avatar_bytes" integer, "avatar_width" integer, "avatar_height" integer, "referral_code" character varying(20), "referral_points" bigint NOT NULL DEFAULT '0', "level" character varying(20) NOT NULL DEFAULT 'SILVER', "is_active" boolean NOT NULL DEFAULT true, "is_staff" boolean NOT NULL DEFAULT false, "is_superuser" boolean NOT NULL DEFAULT false, "phone_verified" boolean NOT NULL DEFAULT false, "email_verified" boolean NOT NULL DEFAULT false, "preferred_notification_email" character varying(50), "preferred_notification_phone" character varying(15), "created_from_app" boolean NOT NULL DEFAULT true, "deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "last_login" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"), CONSTRAINT "UQ_ba10055f9ef9690e77cf6445cba" UNIQUE ("referral_code"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a000cca60bcf04454e72769949" ON "users" ("phone") `
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pid" character varying(20), "user_id" uuid NOT NULL, "category_id" uuid, "subcategory_id" uuid, "name" character varying(100) NOT NULL, "description" text NOT NULL, "image" text, "price" numeric(10,2) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'draft', "views_count" integer NOT NULL DEFAULT '0', "favorites_count" integer NOT NULL DEFAULT '0', "reports_count" integer NOT NULL DEFAULT '0', "is_promoted" boolean NOT NULL DEFAULT false, "promoted_until" TIMESTAMP, "deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7311085e7abaaedf39f5019c35b" UNIQUE ("pid"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`
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
      `CREATE TABLE "coupons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(50) NOT NULL, "description" text, "discount_type" character varying(10) NOT NULL, "discount_value" numeric(10,2) NOT NULL, "max_uses" bigint, "used_count" integer NOT NULL DEFAULT '0', "per_user_limit" integer NOT NULL DEFAULT '1', "valid_from" TIMESTAMP, "valid_until" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "created_by" uuid, "min_order_amount" numeric(10,2), "usage_limit" integer, "max_discount_amount" numeric(10,2), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e025109230e82925843f2a14c48" UNIQUE ("code"), CONSTRAINT "PK_d7ea8864a0150183770f3e9a8cb" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e025109230e82925843f2a14c4" ON "coupons" ("code") `
    );
    await queryRunner.query(
      `CREATE TABLE "wallets" ("user_id" uuid NOT NULL, "balance" numeric(10,2) NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_92558c08091598f7a4439586cda" PRIMARY KEY ("user_id"))`
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
      `CREATE TABLE "referrals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "referrer_id" uuid NOT NULL, "referred_user_id" uuid NOT NULL, "points_earned" integer NOT NULL DEFAULT '250', "status" character varying NOT NULL DEFAULT 'pending', "confirmed_at" TIMESTAMP, "cancelled_at" TIMESTAMP, "cancelled_by" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_55aabf1620a232dd89201336b53" UNIQUE ("referrer_id", "referred_user_id"), CONSTRAINT "PK_ea9980e34f738b6252817326c08" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_18af9fcaffac6d6d3b28130e14" ON "referrals" ("referrer_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "referral_redemptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "redeemed_points" integer NOT NULL, "cash_amount" numeric(10,2) NOT NULL, "wallet_balance_after" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2215f085e5636a009baeabcb860" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1f68a0ad9eab8af5e5c5ecbcea" ON "referral_redemptions" ("user_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" text, "slug" character varying(100), "icon_url" text, "display_order" integer NOT NULL DEFAULT '0', "archived" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name"), CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09" UNIQUE ("slug"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a3cbd52956c4cc6fe840422bc6" ON "categories" ("archived") `
    );
    await queryRunner.query(
      `CREATE TABLE "subcategories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "category_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "description" text, "slug" character varying(100), "display_order" integer NOT NULL DEFAULT '0', "archived" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_793ef34ad0a3f86f09d4837007c" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f7b015bc580ae5179ba5a4f42e" ON "subcategories" ("category_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "product_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "cdn_public_id" text NOT NULL, "cdn_url" text NOT NULL, "cdn_resource_type" text NOT NULL, "cdn_format" text NOT NULL, "cdn_bytes" integer NOT NULL, "cdn_width" integer, "cdn_height" integer, "is_primary" boolean NOT NULL DEFAULT false, "display_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1974264ea7265989af8392f63a1" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4f166bb8c2bfcef2498d97b406" ON "product_images" ("product_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "product_features" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "feature_id" uuid NOT NULL, "value" character varying(255) NOT NULL, CONSTRAINT "UQ_3353c46dc9a352073d23cc2c060" UNIQUE ("product_id", "feature_id"), CONSTRAINT "PK_a022cf7f3a083036c0ebbcacbc0" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_939542cc775c7bb88faf24b23a" ON "product_features" ("product_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "user_id" uuid NOT NULL, "rating" integer NOT NULL, "comment" text, "likes_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_43968e5855f331f4f1355a3fb27" UNIQUE ("product_id", "user_id"), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9482e9567d8dcc2bc615981ef4" ON "reviews" ("product_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "user_favorites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "product_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d5394f21b0d6fe0e0f9f0c0e94e" UNIQUE ("user_id", "product_id"), CONSTRAINT "PK_6c472a19a7423cfbbf6b7c75939" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5238ce0a21cc77dc16c8efe3d3" ON "user_favorites" ("user_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_450f345c2e8eb1b4b38a6bc6be" ON "user_favorites" ("product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_757604add8a39d78a533dcb3f4" ON "user_favorites" ("user_id", "created_at") `
    );
    await queryRunner.query(
      `CREATE TABLE "recently_viewed" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "product_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "viewed_at" TIMESTAMP NOT NULL, CONSTRAINT "UQ_f65476c2f349ea1836c75da0b03" UNIQUE ("user_id", "product_id"), CONSTRAINT "PK_69c131fcd783f4d5a30f6bbcfd3" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_13c5b56da6d00c32cb4c0764a0" ON "recently_viewed" ("user_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_72ecdebddea783ebe1ef655bbd" ON "recently_viewed" ("product_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a659a668ff098ce43a940d7438" ON "recently_viewed" ("user_id", "viewed_at") `
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
      `CREATE TABLE "wallet_ledger" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "amount" numeric(10,2) NOT NULL, "balance_after" numeric(10,2) NOT NULL, "transaction_type" character varying(20) NOT NULL, "reason" character varying(50) NOT NULL, "reference_id" uuid, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d925214b1961738af45cc6959af" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c8d8f0ba3509cfa5878eb68c56" ON "wallet_ledger" ("user_id", "created_at") `
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
      `CREATE TABLE "chatrooms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "room_id" character varying(200) NOT NULL, "name" character varying(100) NOT NULL, "is_group" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d6b60872c210a769a9a77cf2a30" UNIQUE ("room_id"), CONSTRAINT "PK_d190d6f785fb99dffb138cd0443" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d6b60872c210a769a9a77cf2a3" ON "chatrooms" ("room_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "chatroom_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "chatroom_id" uuid NOT NULL, "user_id" uuid NOT NULL, "last_read_message_id" uuid, "last_read_at" TIMESTAMP, "joined_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_831eb2549102ce2b291ec831d5d" PRIMARY KEY ("id"))`
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
      `CREATE TABLE "otp_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phone" character varying(10) NOT NULL, "otp" character varying(6) NOT NULL, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9d0487965ac1837d57fec4d6a26" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4fc4f51a23f34ac45b3920f169" ON "otp_codes" ("phone", "expires_at") `
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
      `CREATE TABLE "features" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subcategory_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "description" text NOT NULL, "key" character varying(50), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5c1e336df2f4a7051e5bf08a941" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_93e8864031fab4b49493c926f7" ON "features" ("subcategory_id") `
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
      `ALTER TABLE "wallets" ADD CONSTRAINT "FK_92558c08091598f7a4439586cda" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "notification_history" ADD CONSTRAINT "FK_727a17e812879626235bc06cbe3" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD CONSTRAINT "FK_18af9fcaffac6d6d3b28130e149" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD CONSTRAINT "FK_6e8e92ccfe617224a7f30adb6b3" FOREIGN KEY ("referred_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "referral_redemptions" ADD CONSTRAINT "FK_1f68a0ad9eab8af5e5c5ecbcea5" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "subcategories" ADD CONSTRAINT "FK_f7b015bc580ae5179ba5a4f42ec" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" ADD CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "product_features" ADD CONSTRAINT "FK_939542cc775c7bb88faf24b23ab" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "product_features" ADD CONSTRAINT "FK_e8112444d4a4beec5f7d6dc5360" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_9482e9567d8dcc2bc615981ef44" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "user_favorites" ADD CONSTRAINT "FK_5238ce0a21cc77dc16c8efe3d36" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "user_favorites" ADD CONSTRAINT "FK_450f345c2e8eb1b4b38a6bc6be4" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "recently_viewed" ADD CONSTRAINT "FK_13c5b56da6d00c32cb4c0764a0e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "recently_viewed" ADD CONSTRAINT "FK_72ecdebddea783ebe1ef655bbd0" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "search_history" ADD CONSTRAINT "FK_d1ebf4101b2804213251e0a04d2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "user_analytics" ADD CONSTRAINT "FK_1b21a2704e98eb4ad610a671f2a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_ledger" ADD CONSTRAINT "FK_c7e9efe5a3b0a356eefbf012f64" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "FK_9df1b9bc48e3eea5da3762f8e56" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "FK_986f8dd830915cf2835f89709df" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "chatroom_members" ADD CONSTRAINT "FK_ff5e08f25be5a3ed0e486754fd8" FOREIGN KEY ("chatroom_id") REFERENCES "chatrooms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "chatroom_members" ADD CONSTRAINT "FK_1ab2a70203b9457454ab7928445" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_1dda4fc8dbeeff2ee71f0088ba0" FOREIGN KEY ("room_id") REFERENCES "chatrooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "fcm_devices" ADD CONSTRAINT "FK_cee8e59b0b919e0f0fea8a8e894" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "features" ADD CONSTRAINT "FK_93e8864031fab4b49493c926f7b" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "features" DROP CONSTRAINT "FK_93e8864031fab4b49493c926f7b"`
    );
    await queryRunner.query(
      `ALTER TABLE "fcm_devices" DROP CONSTRAINT "FK_cee8e59b0b919e0f0fea8a8e894"`
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_1dda4fc8dbeeff2ee71f0088ba0"`
    );
    await queryRunner.query(
      `ALTER TABLE "chatroom_members" DROP CONSTRAINT "FK_1ab2a70203b9457454ab7928445"`
    );
    await queryRunner.query(
      `ALTER TABLE "chatroom_members" DROP CONSTRAINT "FK_ff5e08f25be5a3ed0e486754fd8"`
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" DROP CONSTRAINT "FK_986f8dd830915cf2835f89709df"`
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" DROP CONSTRAINT "FK_9df1b9bc48e3eea5da3762f8e56"`
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_ledger" DROP CONSTRAINT "FK_c7e9efe5a3b0a356eefbf012f64"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_analytics" DROP CONSTRAINT "FK_1b21a2704e98eb4ad610a671f2a"`
    );
    await queryRunner.query(
      `ALTER TABLE "search_history" DROP CONSTRAINT "FK_d1ebf4101b2804213251e0a04d2"`
    );
    await queryRunner.query(
      `ALTER TABLE "recently_viewed" DROP CONSTRAINT "FK_72ecdebddea783ebe1ef655bbd0"`
    );
    await queryRunner.query(
      `ALTER TABLE "recently_viewed" DROP CONSTRAINT "FK_13c5b56da6d00c32cb4c0764a0e"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_favorites" DROP CONSTRAINT "FK_450f345c2e8eb1b4b38a6bc6be4"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_favorites" DROP CONSTRAINT "FK_5238ce0a21cc77dc16c8efe3d36"`
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf"`
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_9482e9567d8dcc2bc615981ef44"`
    );
    await queryRunner.query(
      `ALTER TABLE "product_features" DROP CONSTRAINT "FK_e8112444d4a4beec5f7d6dc5360"`
    );
    await queryRunner.query(
      `ALTER TABLE "product_features" DROP CONSTRAINT "FK_939542cc775c7bb88faf24b23ab"`
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068"`
    );
    await queryRunner.query(
      `ALTER TABLE "subcategories" DROP CONSTRAINT "FK_f7b015bc580ae5179ba5a4f42ec"`
    );
    await queryRunner.query(
      `ALTER TABLE "referral_redemptions" DROP CONSTRAINT "FK_1f68a0ad9eab8af5e5c5ecbcea5"`
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP CONSTRAINT "FK_6e8e92ccfe617224a7f30adb6b3"`
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP CONSTRAINT "FK_18af9fcaffac6d6d3b28130e149"`
    );
    await queryRunner.query(
      `ALTER TABLE "notification_history" DROP CONSTRAINT "FK_727a17e812879626235bc06cbe3"`
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "FK_92558c08091598f7a4439586cda"`
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
      `DROP INDEX "public"."IDX_93e8864031fab4b49493c926f7"`
    );
    await queryRunner.query(`DROP TABLE "features"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_785fe0046bfff3ba5fbe22ff6b"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cee8e59b0b919e0f0fea8a8e89"`
    );
    await queryRunner.query(`DROP TABLE "fcm_devices"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4fc4f51a23f34ac45b3920f169"`
    );
    await queryRunner.query(`DROP TABLE "otp_codes"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9364e6b3f140d619c2a191d538"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9567685b5f7232c895fc29375e"`
    );
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "chatroom_members"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d6b60872c210a769a9a77cf2a3"`
    );
    await queryRunner.query(`DROP TABLE "chatrooms"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_986f8dd830915cf2835f89709d"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9df1b9bc48e3eea5da3762f8e5"`
    );
    await queryRunner.query(`DROP TABLE "coupon_redemptions"`);
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
      `DROP INDEX "public"."IDX_a659a668ff098ce43a940d7438"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_72ecdebddea783ebe1ef655bbd"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_13c5b56da6d00c32cb4c0764a0"`
    );
    await queryRunner.query(`DROP TABLE "recently_viewed"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_757604add8a39d78a533dcb3f4"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_450f345c2e8eb1b4b38a6bc6be"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5238ce0a21cc77dc16c8efe3d3"`
    );
    await queryRunner.query(`DROP TABLE "user_favorites"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9482e9567d8dcc2bc615981ef4"`
    );
    await queryRunner.query(`DROP TABLE "reviews"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_939542cc775c7bb88faf24b23a"`
    );
    await queryRunner.query(`DROP TABLE "product_features"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4f166bb8c2bfcef2498d97b406"`
    );
    await queryRunner.query(`DROP TABLE "product_images"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f7b015bc580ae5179ba5a4f42e"`
    );
    await queryRunner.query(`DROP TABLE "subcategories"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a3cbd52956c4cc6fe840422bc6"`
    );
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1f68a0ad9eab8af5e5c5ecbcea"`
    );
    await queryRunner.query(`DROP TABLE "referral_redemptions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_18af9fcaffac6d6d3b28130e14"`
    );
    await queryRunner.query(`DROP TABLE "referrals"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_65bb163f315f8bc642a706db6a"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4be1055bf99ca49c468524a850"`
    );
    await queryRunner.query(`DROP TABLE "notification_history"`);
    await queryRunner.query(`DROP TABLE "wallets"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e025109230e82925843f2a14c4"`
    );
    await queryRunner.query(`DROP TABLE "coupons"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1846199852a695713b1f8f5e9a"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9a5f6868c96e0069e699f33e12"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_176b502c5ebd6e72cafbd9d6f7"`
    );
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a000cca60bcf04454e72769949"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`
    );
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
