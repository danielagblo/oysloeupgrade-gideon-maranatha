import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1762101486201 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Note: Enum types are pre-created to avoid migration issues

    // Create core tables
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
      `CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(50) NOT NULL,
        "phone" character varying(15),
        "password_hash" character varying(128),
        "google_id" character varying(50),
        "first_name" character varying(50),
        "last_name" character varying(50),
        "display_name" character varying(100),
        "avatar_url" character varying(500),
        "bio" text,
        "location" character varying(100),
        "verification_status" "users_verification_status_enum" NOT NULL DEFAULT 'unverified',
        "verification_level" "users_verification_level_enum" NOT NULL DEFAULT 'basic',
        "is_muted" boolean NOT NULL DEFAULT false,
        "muted_by" integer,
        "muted_until" TIMESTAMP,
        "verified_by" integer,
        "verified_at" TIMESTAMP,
        "last_login_at" TIMESTAMP,
        "is_active" boolean NOT NULL DEFAULT true,
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
        "title" character varying(200) NOT NULL,
        "description" text NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "category_id" integer NOT NULL,
        "user_id" uuid NOT NULL,
        "status" "products_status_enum" NOT NULL DEFAULT 'draft',
        "moderation_status" "products_moderation_status_enum" NOT NULL DEFAULT 'pending',
        "moderated_by" integer,
        "moderated_at" TIMESTAMP,
        "approved_by" integer,
        "approved_at" TIMESTAMP,
        "condition" character varying(50),
        "location" character varying(100),
        "coordinates" jsonb,
        "is_negotiable" boolean NOT NULL DEFAULT false,
        "is_featured" boolean NOT NULL DEFAULT false,
        "views_count" integer NOT NULL DEFAULT 0,
        "favorites_count" integer NOT NULL DEFAULT 0,
        "images_count" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_products" PRIMARY KEY ("id")
      )`
    );

    // Add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_products_category_id" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_products_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "products" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "test_table" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_users" CASCADE`);

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
