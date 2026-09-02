import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneOtpAuth1773000000002 implements MigrationInterface {
  name = 'AddPhoneOtpAuth1773000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "phone" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "otp_code" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "otp_expires_at" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "otp_requested_at" TIMESTAMP
    `);

    await queryRunner.query(`ALTER TABLE "admins" ALTER COLUMN "email" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "admins" ALTER COLUMN "password_hash" DROP NOT NULL`);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_admins_phone" ON "admins" ("phone")
      WHERE "phone" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."UQ_admins_phone"`);

    await queryRunner.query(`ALTER TABLE "admins" DROP COLUMN IF EXISTS "otp_requested_at"`);
    await queryRunner.query(`ALTER TABLE "admins" DROP COLUMN IF EXISTS "otp_expires_at"`);
    await queryRunner.query(`ALTER TABLE "admins" DROP COLUMN IF EXISTS "otp_code"`);
    await queryRunner.query(`ALTER TABLE "admins" DROP COLUMN IF EXISTS "phone"`);

    await queryRunner.query(`ALTER TABLE "admins" ALTER COLUMN "email" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "admins" ALTER COLUMN "password_hash" SET NOT NULL`);
  }
}
