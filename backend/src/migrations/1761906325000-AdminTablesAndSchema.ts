import type { MigrationInterface, QueryRunner } from "typeorm";

export class AdminTablesAndSchema1761906325000 implements MigrationInterface {
  name = "AdminTablesAndSchema1761906325000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create AdminRole enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "admin_role_enum" AS ENUM('super-admin', 'admin', 'staff', 'support');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create admin_users table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_users" (
        "id" SERIAL PRIMARY KEY,
        "username" VARCHAR(50) UNIQUE NOT NULL,
        "email" VARCHAR(255) UNIQUE,
        "password_hash" VARCHAR(255) NOT NULL,
        "role" "admin_role_enum" NOT NULL DEFAULT 'staff',
        "sub_role" VARCHAR(50),
        "permissions" JSONB DEFAULT '[]',
        "is_active" BOOLEAN DEFAULT true,
        "profile_image_url" VARCHAR(500),
        "business_name" VARCHAR(255),
        "business_logo_url" VARCHAR(500),
        "last_login_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create admin_sessions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_sessions" (
        "id" SERIAL PRIMARY KEY,
        "admin_user_id" INTEGER REFERENCES "admin_users"("id") ON DELETE CASCADE,
        "token_hash" VARCHAR(255) UNIQUE NOT NULL,
        "refresh_token_hash" VARCHAR(255) UNIQUE,
        "expires_at" TIMESTAMP NOT NULL,
        "ip_address" INET,
        "user_agent" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create admin_audit_log table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_audit_log" (
        "id" SERIAL PRIMARY KEY,
        "admin_user_id" INTEGER REFERENCES "admin_users"("id") ON DELETE SET NULL,
        "action" VARCHAR(100) NOT NULL,
        "resource_type" VARCHAR(50) NOT NULL,
        "resource_id" INTEGER,
        "old_values" JSONB,
        "new_values" JSONB,
        "ip_address" INET,
        "user_agent" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create support_cases table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "support_cases" (
        "id" SERIAL PRIMARY KEY,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "subject" VARCHAR(255) NOT NULL,
        "status" VARCHAR(20) DEFAULT 'open',
        "priority" VARCHAR(20) DEFAULT 'normal',
        "category" VARCHAR(50),
        "assigned_admin_id" INTEGER REFERENCES "admin_users"("id") ON DELETE SET NULL,
        "last_message_at" TIMESTAMP DEFAULT NOW(),
        "resolved_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create support_messages table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "support_messages" (
        "id" SERIAL PRIMARY KEY,
        "case_id" INTEGER NOT NULL REFERENCES "support_cases"("id") ON DELETE CASCADE,
        "sender_id" VARCHAR(255) NOT NULL,
        "sender_type" VARCHAR(20) NOT NULL,
        "message_type" VARCHAR(20) DEFAULT 'text',
        "content" TEXT,
        "file_url" VARCHAR(500),
        "file_name" VARCHAR(255),
        "file_size" INTEGER,
        "is_read" BOOLEAN DEFAULT false,
        "read_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create support_case_assignments table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "support_case_assignments" (
        "id" SERIAL PRIMARY KEY,
        "case_id" INTEGER NOT NULL REFERENCES "support_cases"("id") ON DELETE CASCADE,
        "admin_user_id" INTEGER NOT NULL REFERENCES "admin_users"("id") ON DELETE CASCADE,
        "assigned_at" TIMESTAMP NOT NULL DEFAULT now(),
        "unassigned_at" TIMESTAMP,
        "notes" TEXT
      )
    `);

    // Create ad_moderation_history table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ad_moderation_history" (
        "id" SERIAL PRIMARY KEY,
        "ad_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "admin_user_id" INTEGER NOT NULL REFERENCES "admin_users"("id") ON DELETE SET NULL,
        "action" VARCHAR(50) NOT NULL,
        "reason" TEXT,
        "old_status" VARCHAR(20),
        "new_status" VARCHAR(20),
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create user_reports table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_reports" (
        "id" SERIAL PRIMARY KEY,
        "reporter_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "reported_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "report_type" VARCHAR(50) NOT NULL,
        "description" TEXT NOT NULL,
        "status" VARCHAR(20) DEFAULT 'pending',
        "admin_user_id" INTEGER REFERENCES "admin_users"("id") ON DELETE SET NULL,
        "resolution" TEXT,
        "resolved_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create system_settings table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "system_settings" (
        "id" SERIAL PRIMARY KEY,
        "key" VARCHAR(100) UNIQUE NOT NULL,
        "value" JSONB,
        "description" TEXT,
        "category" VARCHAR(50),
        "is_public" BOOLEAN DEFAULT false,
        "updated_by" INTEGER REFERENCES "admin_users"("id") ON DELETE SET NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create alerts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "alerts" (
        "id" SERIAL PRIMARY KEY,
        "title" VARCHAR(255) NOT NULL,
        "message" TEXT NOT NULL,
        "type" VARCHAR(20) NOT NULL,
        "status" VARCHAR(20) DEFAULT 'active',
        "recipient_ids" JSONB NOT NULL,
        "linked_ad_ids" JSONB,
        "coupon_id" uuid REFERENCES "coupons"("id") ON DELETE SET NULL,
        "created_by" INTEGER NOT NULL REFERENCES "admin_users"("id") ON DELETE CASCADE,
        "send_immediately" BOOLEAN DEFAULT true,
        "scheduled_for" TIMESTAMP,
        "delivered_count" INTEGER DEFAULT 0,
        "clicked_count" INTEGER DEFAULT 0,
        "expires_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create job_applications table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "job_applications" (
        "id" SERIAL PRIMARY KEY,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "position" VARCHAR(255) NOT NULL,
        "status" VARCHAR(50) DEFAULT 'pending',
        "cover_letter" TEXT,
        "notes" TEXT,
        "feedback" TEXT,
        "reviewed_by" INTEGER REFERENCES "admin_users"("id") ON DELETE SET NULL,
        "reviewed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create application_documents table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "application_documents" (
        "id" SERIAL PRIMARY KEY,
        "application_id" INTEGER NOT NULL REFERENCES "job_applications"("id") ON DELETE CASCADE,
        "document_type" VARCHAR(50) NOT NULL,
        "file_url" VARCHAR(500) NOT NULL,
        "file_name" VARCHAR(255) NOT NULL,
        "file_size" INTEGER NOT NULL,
        "mime_type" VARCHAR(100),
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create application_reviews table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "application_reviews" (
        "id" SERIAL PRIMARY KEY,
        "application_id" INTEGER NOT NULL REFERENCES "job_applications"("id") ON DELETE CASCADE,
        "admin_user_id" INTEGER NOT NULL REFERENCES "admin_users"("id") ON DELETE CASCADE,
        "action" VARCHAR(50) NOT NULL,
        "notes" TEXT,
        "feedback" TEXT,
        "old_status" VARCHAR(50),
        "new_status" VARCHAR(50),
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Add User table extensions
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "verification_status" VARCHAR(20) DEFAULT 'unverified',
      ADD COLUMN IF NOT EXISTS "verification_level" VARCHAR(20) DEFAULT 'basic',
      ADD COLUMN IF NOT EXISTS "is_muted" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "muted_by" INTEGER REFERENCES "admin_users"("id") ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS "muted_at" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "mute_reason" TEXT,
      ADD COLUMN IF NOT EXISTS "verified_by" INTEGER REFERENCES "admin_users"("id") ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "admin_notes" TEXT
    `);

    // Add Product table moderation fields
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "moderation_status" VARCHAR(20) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS "moderated_by" INTEGER REFERENCES "admin_users"("id") ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS "moderated_at" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "suspension_reason" TEXT,
      ADD COLUMN IF NOT EXISTS "approved_by" INTEGER REFERENCES "admin_users"("id") ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT,
      ADD COLUMN IF NOT EXISTS "admin_notes" TEXT
    `);

    // Create indexes for admin tables
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_admin_users_role" ON "admin_users"("role")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_admin_users_active" ON "admin_users"("is_active")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_admin_sessions_admin_user" ON "admin_sessions"("admin_user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_admin_sessions_expires_at" ON "admin_sessions"("expires_at")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_admin_audit_log_admin_user" ON "admin_audit_log"("admin_user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_admin_audit_log_created_at" ON "admin_audit_log"("created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_admin_audit_log_resource" ON "admin_audit_log"("resource_type", "resource_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_moderation_status" ON "products"("moderation_status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_moderated_at" ON "products"("moderated_at")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_status_moderated" ON "products"("moderation_status", "moderated_at")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_support_cases_status" ON "support_cases"("status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_support_cases_assigned_admin" ON "support_cases"("assigned_admin_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_support_cases_status_priority" ON "support_cases"("status", "priority")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_reports_status" ON "user_reports"("status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_reports_reported_user" ON "user_reports"("reported_user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_alerts_status" ON "alerts"("status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_alerts_created_by" ON "alerts"("created_by")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_job_applications_status" ON "job_applications"("status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_job_applications_user" ON "job_applications"("user_id")
    `);

    // Insert default system settings
    await queryRunner.query(`
      INSERT INTO "system_settings" ("key", "value", "description", "category", "is_public")
      VALUES 
        ('privacy_policy', '{"title": "Privacy Policy", "content": "...", "version": "1.0"}', 'Platform privacy policy', 'legal', true),
        ('terms_conditions', '{"title": "Terms & Conditions", "content": "...", "version": "1.0"}', 'Platform terms and conditions', 'legal', true)
      ON CONFLICT ("key") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_job_applications_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_job_applications_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_alerts_created_by"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_alerts_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_reports_reported_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_reports_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_support_cases_status_priority"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_support_cases_assigned_admin"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_support_cases_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_status_moderated"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_moderated_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_moderation_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admin_audit_log_resource"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admin_audit_log_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admin_audit_log_admin_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admin_sessions_expires_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admin_sessions_admin_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admin_users_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admin_users_role"`);

    // Remove Product table moderation fields
    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN IF EXISTS "admin_notes",
      DROP COLUMN IF EXISTS "rejection_reason",
      DROP COLUMN IF EXISTS "approved_at",
      DROP COLUMN IF EXISTS "approved_by",
      DROP COLUMN IF EXISTS "suspension_reason",
      DROP COLUMN IF EXISTS "moderated_at",
      DROP COLUMN IF EXISTS "moderated_by",
      DROP COLUMN IF EXISTS "moderation_status"
    `);

    // Remove User table extensions
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "admin_notes",
      DROP COLUMN IF EXISTS "verified_at",
      DROP COLUMN IF EXISTS "verified_by",
      DROP COLUMN IF EXISTS "mute_reason",
      DROP COLUMN IF EXISTS "muted_at",
      DROP COLUMN IF EXISTS "muted_by",
      DROP COLUMN IF EXISTS "is_muted",
      DROP COLUMN IF EXISTS "verification_level",
      DROP COLUMN IF EXISTS "verification_status"
    `);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "application_reviews"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "application_documents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "job_applications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "alerts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "system_settings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_reports"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ad_moderation_history"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "support_case_assignments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "support_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "support_cases"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_audit_log"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_users"`);

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS "admin_role_enum"`);
  }
}

