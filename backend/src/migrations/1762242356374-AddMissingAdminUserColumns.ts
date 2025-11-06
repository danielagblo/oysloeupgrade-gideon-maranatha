import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingAdminUserColumns1762242356374 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "password_hash" character varying(255) NOT NULL DEFAULT 'temp_password'`
        );

        await queryRunner.query(
            `ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "sub_role" character varying(50)`
        );

        await queryRunner.query(
            `ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "permissions" jsonb NOT NULL DEFAULT '[]'`
        );

        await queryRunner.query(
            `ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "profile_image_url" character varying(500)`
        );

        await queryRunner.query(
            `ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "business_name" character varying(255)`
        );

        await queryRunner.query(
            `ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "business_logo_url" character varying(500)`
        );

        await queryRunner.query(
            `ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMP`
        );

        const hasPasswordHashColumn = await queryRunner.query(
            `SELECT column_name FROM information_schema.columns WHERE table_name = 'admin_users' AND column_name = 'passwordHash'`
        );

        if (hasPasswordHashColumn.length > 0) {
            await queryRunner.query(
                `ALTER TABLE "admin_users" RENAME COLUMN "passwordHash" TO "password_hash"`
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "admin_users" DROP COLUMN IF EXISTS "last_login_at"`);
        await queryRunner.query(`ALTER TABLE "admin_users" DROP COLUMN IF EXISTS "business_logo_url"`);
        await queryRunner.query(`ALTER TABLE "admin_users" DROP COLUMN IF EXISTS "business_name"`);
        await queryRunner.query(`ALTER TABLE "admin_users" DROP COLUMN IF EXISTS "profile_image_url"`);
        await queryRunner.query(`ALTER TABLE "admin_users" DROP COLUMN IF EXISTS "permissions"`);
        await queryRunner.query(`ALTER TABLE "admin_users" DROP COLUMN IF EXISTS "sub_role"`);
        await queryRunner.query(`ALTER TABLE "admin_users" DROP COLUMN IF EXISTS "password_hash"`);
    }

}
