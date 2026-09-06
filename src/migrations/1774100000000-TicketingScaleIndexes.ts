import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Indexes for staff inbox sort/filter and seller unread polls.
 */
export class TicketingScaleIndexes1774100000000 implements MigrationInterface {
  name = 'TicketingScaleIndexes1774100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_TICKETS_STATUS_ASSIGNED_UPDATED"
      ON "tickets" ("status", "assigned_admin_id", "updated_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_TICKETS_USER_UNREAD"
      ON "tickets" ("user_id", "last_message_side", "last_message_at")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_SELLER_TOKEN_SESSIONS_EXPIRES_AT"
      ON "seller_token_sessions" ("expires_at")
    `);

    // Trigram search (optional if extension available)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_TICKETS_TITLE_TRGM"
      ON "tickets" USING gin ("title" gin_trgm_ops)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_TICKETS_SELLER_PHONE_TRGM"
      ON "tickets" USING gin ("seller_phone" gin_trgm_ops)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_TICKETS_SELLER_NAME_TRGM"
      ON "tickets" USING gin ("seller_name" gin_trgm_ops)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_TICKETS_SELLER_NAME_TRGM"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_TICKETS_SELLER_PHONE_TRGM"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_TICKETS_TITLE_TRGM"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_SELLER_TOKEN_SESSIONS_EXPIRES_AT"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_TICKETS_USER_UNREAD"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_TICKETS_STATUS_ASSIGNED_UPDATED"`);
  }
}
