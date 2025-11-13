import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubscriptions1763033117000 implements MigrationInterface {
  name = 'CreateSubscriptions1763033117000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "plan_type" character varying(20) NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'pending',
        "start_date" TIMESTAMP NOT NULL,
        "end_date" TIMESTAMP NOT NULL,
        "price" decimal(10,2) NOT NULL,
        "payment_method" character varying(50),
        "transaction_id" uuid,
        "wallet_ledger_id" uuid,
        "metadata" jsonb,
        "cancellation_reason" text,
        "cancelled_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_subscriptions_user_id" ON "subscriptions" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_subscriptions_plan_type" ON "subscriptions" ("plan_type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_subscriptions_status" ON "subscriptions" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_subscriptions_user_status" ON "subscriptions" ("user_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_subscriptions_plan_status" ON "subscriptions" ("plan_type", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_subscriptions_dates" ON "subscriptions" ("start_date", "end_date")
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD CONSTRAINT "FK_subscriptions_user_id"
      FOREIGN KEY ("user_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_subscriptions_dates"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_subscriptions_plan_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_subscriptions_user_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_subscriptions_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_subscriptions_plan_type"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_subscriptions_user_id"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
  }
}


