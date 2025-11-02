import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1762101486201 implements MigrationInterface {
  name = 'Initial1762101486201';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admin_audit_log" DROP CONSTRAINT "admin_audit_log_admin_user_id_fkey"`
    );
    await queryRunner.query(
      `ALTER TABLE "admin_sessions" DROP CONSTRAINT "admin_sessions_admin_user_id_fkey"`
    );
    await queryRunner.query(
      `ALTER TABLE "chatroom_members" DROP CONSTRAINT "FK_1ab2a70203b9457454ab7928445"`
    );
    await queryRunner.query(
      `ALTER TABLE "chatroom_members" DROP CONSTRAINT "FK_ff5e08f25be5a3ed0e486754fd8"`
    );
    await queryRunner.query(`ALTER TABLE "alerts" DROP CONSTRAINT "alerts_created_by_fkey"`);
    await queryRunner.query(`ALTER TABLE "alerts" DROP CONSTRAINT "alerts_coupon_id_fkey"`);
    await queryRunner.query(
      `ALTER TABLE "job_applications" DROP CONSTRAINT "job_applications_reviewed_by_fkey"`
    );
    await queryRunner.query(
      `ALTER TABLE "job_applications" DROP CONSTRAINT "job_applications_user_id_fkey"`
    );
    await queryRunner.query(
      `ALTER TABLE "application_reviews" DROP CONSTRAINT "application_reviews_admin_user_id_fkey"`
    );
    await queryRunner.query(
      `ALTER TABLE "application_reviews" DROP CONSTRAINT "application_reviews_application_id_fkey"`
    );
    await queryRunner.query(
      `ALTER TABLE "application_documents" DROP CONSTRAINT "application_documents_application_id_fkey"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_reports" DROP CONSTRAINT "user_reports_admin_user_id_fkey"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_reports" DROP CONSTRAINT "user_reports_reported_user_id_fkey"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_reports" DROP CONSTRAINT "user_reports_reporter_user_id_fkey"`
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_ledger" DROP CONSTRAINT "FK_c7e9efe5a3b0a356eefbf012f64"`
    );
    await queryRunner.query(
      `ALTER TABLE "system_settings" DROP CONSTRAINT "system_settings_updated_by_fkey"`
    );
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "products_approved_by_fkey"`);
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "products_moderated_by_fkey"`);
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "FK_92558c08091598f7a4439586cda"`
    );
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "users_verified_by_fkey"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "users_muted_by_fkey"`);
    await queryRunner.query(
      `ALTER TABLE "support_cases" DROP CONSTRAINT "support_cases_assigned_admin_id_fkey"`
    );
    await queryRunner.query(
      `ALTER TABLE "support_cases" DROP CONSTRAINT "support_cases_user_id_fkey"`
    );
    await queryRunner.query(
      `ALTER TABLE "support_case_assignments" DROP CONSTRAINT "support_case_assignments_admin_user_id_fkey"`
    );
    await queryRunner.query(
      `ALTER TABLE "support_case_assignments" DROP CONSTRAINT "support_case_assignments_case_id_fkey"`
    );
    await queryRunner.query(
      `ALTER TABLE "support_messages" DROP CONSTRAINT "support_messages_case_id_fkey"`
    );
    await queryRunner.query(
      `ALTER TABLE "ad_moderation_history" DROP CONSTRAINT "ad_moderation_history_admin_user_id_fkey"`
    );
    await queryRunner.query(
      `ALTER TABLE "ad_moderation_history" DROP CONSTRAINT "ad_moderation_history_ad_id_fkey"`
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_admin_users_role"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_admin_users_active"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_admin_audit_log_resource"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_admin_audit_log_admin_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_admin_audit_log_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_admin_sessions_admin_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_admin_sessions_expires_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_alerts_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_alerts_created_by"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_job_applications_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_job_applications_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a659a668ff098ce43a940d7438"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_user_reports_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_user_reports_reported_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_moderation_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_moderated_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_status_moderated"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_support_cases_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_support_cases_assigned_admin"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_support_cases_status_priority"`);
    await queryRunner.query(
      `ALTER TABLE "recently_viewed" DROP CONSTRAINT "UQ_f65476c2f349ea1836c75da0b03"`
    );
    await queryRunner.query(
      `ALTER TABLE "product_features" DROP CONSTRAINT "UQ_3353c46dc9a352073d23cc2c060"`
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
    await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "position"`);
    await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "status"`);
    await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "cover_letter"`);
    await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "notes"`);
    await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "feedback"`);
    await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "reviewed_by"`);
    await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "reviewed_at"`);
    await queryRunner.query(`ALTER TABLE "recently_viewed" DROP COLUMN "created_at"`);
    await queryRunner.query(`ALTER TABLE "product_images" DROP COLUMN "cdn_public_id"`);
    await queryRunner.query(`ALTER TABLE "product_images" DROP COLUMN "cdn_url"`);
    await queryRunner.query(`ALTER TABLE "product_images" DROP COLUMN "cdn_resource_type"`);
    await queryRunner.query(`ALTER TABLE "product_images" DROP COLUMN "cdn_format"`);
    await queryRunner.query(`ALTER TABLE "product_images" DROP COLUMN "cdn_bytes"`);
    await queryRunner.query(`ALTER TABLE "product_images" DROP COLUMN "cdn_width"`);
    await queryRunner.query(`ALTER TABLE "product_images" DROP COLUMN "cdn_height"`);
    await queryRunner.query(`ALTER TABLE "product_images" DROP COLUMN "is_primary"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "googleId"`);
    await queryRunner.query(
      `ALTER TABLE "job_applications" ADD "name" character varying(255) NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "job_applications" ADD "email" character varying(255) NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "product_images" ADD "public_id" text NOT NULL`);
    await queryRunner.query(`ALTER TABLE "product_images" ADD "url" text NOT NULL`);
    await queryRunner.query(`ALTER TABLE "product_images" ADD "format" character varying(10)`);
    await queryRunner.query(`ALTER TABLE "product_images" ADD "bytes" integer`);
    await queryRunner.query(`ALTER TABLE "product_images" ADD "width" integer`);
    await queryRunner.query(`ALTER TABLE "product_images" ADD "height" integer`);
    await queryRunner.query(
      `ALTER TABLE "product_images" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "wallet_ledger" ADD "wallet_id" uuid NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "product_features" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "product_features" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TYPE "public"."admin_role_enum" RENAME TO "admin_role_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."admin_users_role_enum" AS ENUM('super-admin', 'admin', 'staff', 'support')`
    );
    await queryRunner.query(`ALTER TABLE "admin_users" ALTER COLUMN "role" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "admin_users" ALTER COLUMN "role" TYPE "public"."admin_users_role_enum" USING "role"::"text"::"public"."admin_users_role_enum"`
    );
    await queryRunner.query(`ALTER TABLE "admin_users" ALTER COLUMN "role" SET DEFAULT 'staff'`);
    await queryRunner.query(`DROP TYPE "public"."admin_role_enum_old"`);
    await queryRunner.query(`ALTER TABLE "admin_users" ALTER COLUMN "permissions" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "admin_users" ALTER COLUMN "is_active" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "admin_audit_log" ALTER COLUMN "admin_user_id" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "admin_sessions" ALTER COLUMN "admin_user_id" SET NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "alerts" ALTER COLUMN "status" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "alerts" ALTER COLUMN "send_immediately" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "alerts" ALTER COLUMN "delivered_count" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "alerts" ALTER COLUMN "clicked_count" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "job_applications" DROP CONSTRAINT "job_applications_pkey"`
    );
    await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "job_applications" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`
    );
    await queryRunner.query(
      `ALTER TABLE "job_applications" ADD CONSTRAINT "PK_c56a5e86707d0f0df18fa111280" PRIMARY KEY ("id")`
    );
    await queryRunner.query(`ALTER TABLE "application_reviews" DROP COLUMN "application_id"`);
    await queryRunner.query(`ALTER TABLE "application_reviews" ADD "application_id" uuid NOT NULL`);
    await queryRunner.query(`ALTER TABLE "application_documents" DROP COLUMN "application_id"`);
    await queryRunner.query(
      `ALTER TABLE "application_documents" ADD "application_id" uuid NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "recently_viewed" ALTER COLUMN "viewed_at" SET DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "user_reports" ALTER COLUMN "status" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "system_settings" ALTER COLUMN "is_public" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "product_features" DROP COLUMN "value"`);
    await queryRunner.query(`ALTER TABLE "product_features" ADD "value" text`);
    await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "moderation_status" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "google_id"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "google_id" character varying(50)`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "verification_status" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "verification_level" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "is_muted" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "support_cases" ALTER COLUMN "status" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "support_cases" ALTER COLUMN "priority" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "support_cases" ALTER COLUMN "last_message_at" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "support_cases" ALTER COLUMN "last_message_at" SET DEFAULT NOW()`
    );
    await queryRunner.query(`ALTER TABLE "support_messages" DROP COLUMN "sender_id"`);
    await queryRunner.query(
      `ALTER TABLE "support_messages" ADD "sender_id" character varying NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "support_messages" ALTER COLUMN "message_type" SET NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "support_messages" ALTER COLUMN "is_read" SET NOT NULL`);
    await queryRunner.query(
      `CREATE INDEX "IDX_e8112444d4a4beec5f7d6dc536" ON "product_features" ("feature_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b2286c6d70b3aaf12046aa7016" ON "products" ("moderation_status") `
    );
    await queryRunner.query(
      `ALTER TABLE "admin_audit_log" ADD CONSTRAINT "FK_7abbe8f7be301725ce49e822788" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "admin_sessions" ADD CONSTRAINT "FK_c1711b1831bdf66b77c3605bcdb" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "chatroom_members" ADD CONSTRAINT "FK_ff5e08f25be5a3ed0e486754fd8" FOREIGN KEY ("chatroom_id") REFERENCES "chatrooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "chatroom_members" ADD CONSTRAINT "FK_1ab2a70203b9457454ab7928445" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD CONSTRAINT "FK_13cc1efe00291983890dd809cfa" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD CONSTRAINT "FK_779c7c43268165afb5a947e0562" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" ADD CONSTRAINT "FK_35a6b05ee3b624d0de01ee50593" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" ADD CONSTRAINT "FK_003e599a9fc0e8f154b6313639f" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "application_reviews" ADD CONSTRAINT "FK_37429cb43f4837e1c8a0032ba51" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "application_reviews" ADD CONSTRAINT "FK_22d981457073eae92e8f9fa2e97" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "application_documents" ADD CONSTRAINT "FK_9ad8ab815e842d67e9aaec900cb" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
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
      `ALTER TABLE "wallet_ledger" ADD CONSTRAINT "FK_53d9fecd40f5fe635d119b49c4d" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "system_settings" ADD CONSTRAINT "FK_301c531938f84c39fa5019e7465" FOREIGN KEY ("updated_by") REFERENCES "admin_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_29565df5a020791583febb73c07" FOREIGN KEY ("moderated_by") REFERENCES "admin_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_641c6d1bb7d127da620b1179175" FOREIGN KEY ("approved_by") REFERENCES "admin_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "FK_92558c08091598f7a4439586cda" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "support_cases" ADD CONSTRAINT "FK_5a99a9d58af4a0e3093e2d14252" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "support_cases" ADD CONSTRAINT "FK_a39beb2b481b4920b76cf0eed86" FOREIGN KEY ("assigned_admin_id") REFERENCES "admin_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "support_case_assignments" ADD CONSTRAINT "FK_eb01a5e4cc56c669816c6d9fc05" FOREIGN KEY ("case_id") REFERENCES "support_cases"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "support_case_assignments" ADD CONSTRAINT "FK_7d3ff3317ac3b668637efbff05f" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "support_messages" ADD CONSTRAINT "FK_8c825aa202717f0516b512168d0" FOREIGN KEY ("case_id") REFERENCES "support_cases"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "ad_moderation_history" ADD CONSTRAINT "FK_6c3a43769f915528c2015c7f554" FOREIGN KEY ("ad_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "ad_moderation_history" ADD CONSTRAINT "FK_1351bfb68717889cfaddcbab342" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ad_moderation_history" DROP CONSTRAINT "FK_1351bfb68717889cfaddcbab342"`
    );
    await queryRunner.query(
      `ALTER TABLE "ad_moderation_history" DROP CONSTRAINT "FK_6c3a43769f915528c2015c7f554"`
    );
    await queryRunner.query(
      `ALTER TABLE "support_messages" DROP CONSTRAINT "FK_8c825aa202717f0516b512168d0"`
    );
    await queryRunner.query(
      `ALTER TABLE "support_case_assignments" DROP CONSTRAINT "FK_7d3ff3317ac3b668637efbff05f"`
    );
    await queryRunner.query(
      `ALTER TABLE "support_case_assignments" DROP CONSTRAINT "FK_eb01a5e4cc56c669816c6d9fc05"`
    );
    await queryRunner.query(
      `ALTER TABLE "support_cases" DROP CONSTRAINT "FK_a39beb2b481b4920b76cf0eed86"`
    );
    await queryRunner.query(
      `ALTER TABLE "support_cases" DROP CONSTRAINT "FK_5a99a9d58af4a0e3093e2d14252"`
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "FK_92558c08091598f7a4439586cda"`
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_641c6d1bb7d127da620b1179175"`
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_29565df5a020791583febb73c07"`
    );
    await queryRunner.query(
      `ALTER TABLE "system_settings" DROP CONSTRAINT "FK_301c531938f84c39fa5019e7465"`
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_ledger" DROP CONSTRAINT "FK_53d9fecd40f5fe635d119b49c4d"`
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
      `ALTER TABLE "application_documents" DROP CONSTRAINT "FK_9ad8ab815e842d67e9aaec900cb"`
    );
    await queryRunner.query(
      `ALTER TABLE "application_reviews" DROP CONSTRAINT "FK_22d981457073eae92e8f9fa2e97"`
    );
    await queryRunner.query(
      `ALTER TABLE "application_reviews" DROP CONSTRAINT "FK_37429cb43f4837e1c8a0032ba51"`
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" DROP CONSTRAINT "FK_003e599a9fc0e8f154b6313639f"`
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" DROP CONSTRAINT "FK_35a6b05ee3b624d0de01ee50593"`
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" DROP CONSTRAINT "FK_779c7c43268165afb5a947e0562"`
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" DROP CONSTRAINT "FK_13cc1efe00291983890dd809cfa"`
    );
    await queryRunner.query(
      `ALTER TABLE "chatroom_members" DROP CONSTRAINT "FK_1ab2a70203b9457454ab7928445"`
    );
    await queryRunner.query(
      `ALTER TABLE "chatroom_members" DROP CONSTRAINT "FK_ff5e08f25be5a3ed0e486754fd8"`
    );
    await queryRunner.query(
      `ALTER TABLE "admin_sessions" DROP CONSTRAINT "FK_c1711b1831bdf66b77c3605bcdb"`
    );
    await queryRunner.query(
      `ALTER TABLE "admin_audit_log" DROP CONSTRAINT "FK_7abbe8f7be301725ce49e822788"`
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_b2286c6d70b3aaf12046aa7016"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e8112444d4a4beec5f7d6dc536"`);
    await queryRunner.query(`ALTER TABLE "support_messages" ALTER COLUMN "is_read" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "support_messages" ALTER COLUMN "message_type" DROP NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "support_messages" DROP COLUMN "sender_id"`);
    await queryRunner.query(
      `ALTER TABLE "support_messages" ADD "sender_id" character varying(255) NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "support_cases" ALTER COLUMN "last_message_at" SET DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "support_cases" ALTER COLUMN "last_message_at" DROP NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "support_cases" ALTER COLUMN "priority" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "support_cases" ALTER COLUMN "status" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "is_muted" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "verification_level" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "verification_status" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "google_id"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "google_id" character varying`);
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "moderation_status" DROP NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "product_features" DROP COLUMN "value"`);
    await queryRunner.query(
      `ALTER TABLE "product_features" ADD "value" character varying(255) NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "system_settings" ALTER COLUMN "is_public" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "user_reports" ALTER COLUMN "status" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "recently_viewed" ALTER COLUMN "viewed_at" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "application_documents" DROP COLUMN "application_id"`);
    await queryRunner.query(
      `ALTER TABLE "application_documents" ADD "application_id" integer NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "application_reviews" DROP COLUMN "application_id"`);
    await queryRunner.query(
      `ALTER TABLE "application_reviews" ADD "application_id" integer NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "job_applications" DROP CONSTRAINT "PK_c56a5e86707d0f0df18fa111280"`
    );
    await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "job_applications" ADD "id" SERIAL NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")`
    );
    await queryRunner.query(`ALTER TABLE "alerts" ALTER COLUMN "clicked_count" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "alerts" ALTER COLUMN "delivered_count" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "alerts" ALTER COLUMN "send_immediately" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "alerts" ALTER COLUMN "status" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "admin_sessions" ALTER COLUMN "admin_user_id" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "admin_audit_log" ALTER COLUMN "admin_user_id" DROP NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "admin_users" ALTER COLUMN "is_active" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "admin_users" ALTER COLUMN "permissions" DROP NOT NULL`);
    await queryRunner.query(
      `CREATE TYPE "public"."admin_role_enum_old" AS ENUM('super-admin', 'admin', 'staff', 'support')`
    );
    await queryRunner.query(`ALTER TABLE "admin_users" ALTER COLUMN "role" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "admin_users" ALTER COLUMN "role" TYPE "public"."admin_role_enum_old" USING "role"::"text"::"public"."admin_role_enum_old"`
    );
    await queryRunner.query(`ALTER TABLE "admin_users" ALTER COLUMN "role" SET DEFAULT 'staff'`);
    await queryRunner.query(`DROP TYPE "public"."admin_users_role_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."admin_role_enum_old" RENAME TO "admin_role_enum"`
    );
    await queryRunner.query(`ALTER TABLE "product_features" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "product_features" DROP COLUMN "created_at"`);
    await queryRunner.query(`ALTER TABLE "wallet_ledger" DROP COLUMN "wallet_id"`);
    await queryRunner.query(`ALTER TABLE "product_images" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "product_images" DROP COLUMN "height"`);
    await queryRunner.query(`ALTER TABLE "product_images" DROP COLUMN "width"`);
    await queryRunner.query(`ALTER TABLE "product_images" DROP COLUMN "bytes"`);
    await queryRunner.query(`ALTER TABLE "product_images" DROP COLUMN "format"`);
    await queryRunner.query(`ALTER TABLE "product_images" DROP COLUMN "url"`);
    await queryRunner.query(`ALTER TABLE "product_images" DROP COLUMN "public_id"`);
    await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "email"`);
    await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "name"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "googleId" character varying(50)`);
    await queryRunner.query(
      `ALTER TABLE "product_images" ADD "is_primary" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(`ALTER TABLE "product_images" ADD "cdn_height" integer`);
    await queryRunner.query(`ALTER TABLE "product_images" ADD "cdn_width" integer`);
    await queryRunner.query(`ALTER TABLE "product_images" ADD "cdn_bytes" integer NOT NULL`);
    await queryRunner.query(`ALTER TABLE "product_images" ADD "cdn_format" text NOT NULL`);
    await queryRunner.query(`ALTER TABLE "product_images" ADD "cdn_resource_type" text NOT NULL`);
    await queryRunner.query(`ALTER TABLE "product_images" ADD "cdn_url" text NOT NULL`);
    await queryRunner.query(`ALTER TABLE "product_images" ADD "cdn_public_id" text NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "recently_viewed" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "job_applications" ADD "reviewed_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "job_applications" ADD "reviewed_by" integer`);
    await queryRunner.query(`ALTER TABLE "job_applications" ADD "feedback" text`);
    await queryRunner.query(`ALTER TABLE "job_applications" ADD "notes" text`);
    await queryRunner.query(`ALTER TABLE "job_applications" ADD "cover_letter" text`);
    await queryRunner.query(
      `ALTER TABLE "job_applications" ADD "status" character varying(50) DEFAULT 'pending'`
    );
    await queryRunner.query(
      `ALTER TABLE "job_applications" ADD "position" character varying(255) NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "job_applications" ADD "user_id" uuid NOT NULL`);
    await queryRunner.query(`DROP INDEX "public"."IDX_003e599a9fc0e8f154b6313639"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_35a6b05ee3b624d0de01ee5059"`);
    await queryRunner.query(`DROP TABLE "favorites"`);
    await queryRunner.query(
      `ALTER TABLE "product_features" ADD CONSTRAINT "UQ_3353c46dc9a352073d23cc2c060" UNIQUE ("product_id", "feature_id")`
    );
    await queryRunner.query(
      `ALTER TABLE "recently_viewed" ADD CONSTRAINT "UQ_f65476c2f349ea1836c75da0b03" UNIQUE ("user_id", "product_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_support_cases_status_priority" ON "support_cases" ("status", "priority") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_support_cases_assigned_admin" ON "support_cases" ("assigned_admin_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_support_cases_status" ON "support_cases" ("status") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_status_moderated" ON "products" ("moderation_status", "moderated_at") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_moderated_at" ON "products" ("moderated_at") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_moderation_status" ON "products" ("moderation_status") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_reports_reported_user" ON "user_reports" ("reported_user_id") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_user_reports_status" ON "user_reports" ("status") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_a659a668ff098ce43a940d7438" ON "recently_viewed" ("user_id", "viewed_at") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_job_applications_user" ON "job_applications" ("user_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_job_applications_status" ON "job_applications" ("status") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_alerts_created_by" ON "alerts" ("created_by") `);
    await queryRunner.query(`CREATE INDEX "IDX_alerts_status" ON "alerts" ("status") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_admin_sessions_expires_at" ON "admin_sessions" ("expires_at") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_admin_sessions_admin_user" ON "admin_sessions" ("admin_user_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_admin_audit_log_created_at" ON "admin_audit_log" ("created_at") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_admin_audit_log_admin_user" ON "admin_audit_log" ("admin_user_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_admin_audit_log_resource" ON "admin_audit_log" ("resource_type", "resource_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_admin_users_active" ON "admin_users" ("is_active") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_admin_users_role" ON "admin_users" ("role") `);
    await queryRunner.query(
      `ALTER TABLE "ad_moderation_history" ADD CONSTRAINT "ad_moderation_history_ad_id_fkey" FOREIGN KEY ("ad_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "ad_moderation_history" ADD CONSTRAINT "ad_moderation_history_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "support_cases"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "support_case_assignments" ADD CONSTRAINT "support_case_assignments_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "support_cases"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "support_case_assignments" ADD CONSTRAINT "support_case_assignments_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "support_cases" ADD CONSTRAINT "support_cases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "support_cases" ADD CONSTRAINT "support_cases_assigned_admin_id_fkey" FOREIGN KEY ("assigned_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "users_muted_by_fkey" FOREIGN KEY ("muted_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "users_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "FK_92558c08091598f7a4439586cda" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "products_moderated_by_fkey" FOREIGN KEY ("moderated_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "products_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_ledger" ADD CONSTRAINT "FK_c7e9efe5a3b0a356eefbf012f64" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "application_reviews" ADD CONSTRAINT "application_reviews_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "application_reviews" ADD CONSTRAINT "application_reviews_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD CONSTRAINT "alerts_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD CONSTRAINT "alerts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "chatroom_members" ADD CONSTRAINT "FK_ff5e08f25be5a3ed0e486754fd8" FOREIGN KEY ("chatroom_id") REFERENCES "chatrooms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "chatroom_members" ADD CONSTRAINT "FK_1ab2a70203b9457454ab7928445" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
  }
}
