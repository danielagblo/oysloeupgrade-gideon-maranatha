import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRegionsAndTownsTables1762428000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "regions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "code" character varying(10) NOT NULL,
                "coordinates" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_regions" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_regions_code" UNIQUE ("code")
            )`
        );

        await queryRunner.query(
            `CREATE TABLE "towns" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "region_id" uuid NOT NULL,
                "coordinates" jsonb,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_towns" PRIMARY KEY ("id"),
                CONSTRAINT "FK_towns_region" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE CASCADE
            )`
        );

        await queryRunner.query(
            `CREATE INDEX "IDX_regions_code" ON "regions" ("code")`
        );

        await queryRunner.query(
            `CREATE INDEX "IDX_towns_region_id" ON "towns" ("region_id")`
        );

        await queryRunner.query(
            `CREATE INDEX "IDX_towns_active" ON "towns" ("is_active")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_towns_active"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_towns_region_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_regions_code"`);

        await queryRunner.query(`DROP TABLE "towns"`);
        await queryRunner.query(`DROP TABLE "regions"`);
    }

}
