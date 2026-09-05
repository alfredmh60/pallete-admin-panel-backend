import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSellerTicketing1774000000000 implements MigrationInterface {
  name = 'AddSellerTicketing1774000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tickets" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "subject" character varying(32) NOT NULL DEFAULT 'support',
        "status" character varying(32) NOT NULL DEFAULT 'open',
        "title" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "file_url" character varying,
        "file_mime_type" character varying(128),
        "seller_phone" character varying(32),
        "seller_name" character varying(255),
        "assigned_admin_id" integer,
        "assigned_admin_name" character varying(255),
        "closed_at" TIMESTAMP WITH TIME ZONE,
        "closed_by_admin_id" integer,
        "seller_last_seen_at" TIMESTAMP WITH TIME ZONE,
        "last_message_at" TIMESTAMP WITH TIME ZONE,
        "last_message_side" character varying(16),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tickets" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tickets_assigned_admin"
          FOREIGN KEY ("assigned_admin_id") REFERENCES "admins"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_TICKETS_USER_ID" ON "tickets" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_TICKETS_STATUS" ON "tickets" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_TICKETS_ASSIGNED_ADMIN" ON "tickets" ("assigned_admin_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ticket_answers" (
        "id" SERIAL NOT NULL,
        "ticket_id" integer NOT NULL,
        "side" character varying(16) NOT NULL,
        "message" text NOT NULL,
        "file_url" character varying,
        "file_mime_type" character varying(128),
        "sender_admin_id" integer,
        "sender_admin_name" character varying(255),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ticket_answers" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ticket_answers_ticket"
          FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_TICKET_ANSWERS_TICKET_ID" ON "ticket_answers" ("ticket_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ticket_assignments" (
        "id" SERIAL NOT NULL,
        "ticket_id" integer NOT NULL,
        "admin_id" integer NOT NULL,
        "admin_name" character varying(255),
        "assigned_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "unassigned_at" TIMESTAMP WITH TIME ZONE,
        "assigned_by_admin_id" integer,
        CONSTRAINT "PK_ticket_assignments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ticket_assignments_ticket"
          FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_ticket_assignments_admin"
          FOREIGN KEY ("admin_id") REFERENCES "admins"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_TICKET_ASSIGNMENTS_TICKET_ID" ON "ticket_assignments" ("ticket_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "seller_token_sessions" (
        "id" SERIAL NOT NULL,
        "token_hash" character varying(64) NOT NULL,
        "user_id" integer NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "phone" character varying(32),
        "name" character varying(255),
        "last_name" character varying(255),
        "language" character varying(8),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "last_used_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_seller_token_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_SELLER_TOKEN_SESSIONS_HASH" UNIQUE ("token_hash")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_SELLER_TOKEN_SESSIONS_USER_ID" ON "seller_token_sessions" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "seller_token_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ticket_assignments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ticket_answers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tickets"`);
  }
}
