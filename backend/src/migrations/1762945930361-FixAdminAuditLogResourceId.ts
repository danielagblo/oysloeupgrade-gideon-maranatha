import type { MigrationInterface, QueryRunner } from "typeorm";

export class FixAdminAuditLogResourceId1762945930361 implements MigrationInterface {
    name = 'FixAdminAuditLogResourceId1762945930361'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "admin_audit_log" ALTER COLUMN "resource_id" TYPE varchar(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "admin_audit_log" ALTER COLUMN "resource_id" TYPE integer USING resource_id::integer`);
    }

}
