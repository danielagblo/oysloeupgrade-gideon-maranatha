import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserIdToJobApplications1762444331285 implements MigrationInterface {
    name = 'AddUserIdToJobApplications1762444331285'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "user_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "phone" character varying(15)`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "status" character varying(50) NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "cover_letter" text`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "experience" text`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "skills" text`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "position" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "admin_notes" text`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "feedback" text`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "reviewed_by" integer`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD "reviewed_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD CONSTRAINT "FK_fcfc78a3be953dac2443b9b53db" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_applications" ADD CONSTRAINT "FK_c3999006594d0112ae19443cf27" FOREIGN KEY ("reviewed_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_applications" DROP CONSTRAINT "FK_c3999006594d0112ae19443cf27"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP CONSTRAINT "FK_fcfc78a3be953dac2443b9b53db"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "reviewed_at"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "reviewed_by"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "feedback"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "admin_notes"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "position"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "skills"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "experience"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "cover_letter"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "job_applications" DROP COLUMN "user_id"`);
    }

}
