import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveSellerTicketingAddStaffChat1773000000000 implements MigrationInterface {
  name = 'RemoveSellerTicketingAddStaffChat1773000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ticket_messages" DROP CONSTRAINT IF EXISTS "FK_75b3a5f421dbf7b73778da519cb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_assignments" DROP CONSTRAINT IF EXISTS "FK_1f28749f7471a43f237d79eb7fd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_assignments" DROP CONSTRAINT IF EXISTS "FK_0e17e833b8df20d5bc013bcaea1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "FK_fb1d03aa5fffa0e5ca41873a00a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "FK_06e9c7d7cd9faad009d4f1282fd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_departments" DROP CONSTRAINT IF EXISTS "FK_9d4189afdf3bbad66d05b6f5ae5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_departments" DROP CONSTRAINT IF EXISTS "FK_59081c1c31132a396a276a3347c"`,
    );

    await queryRunner.query(`DROP TABLE IF EXISTS "ticket_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ticket_assignments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tickets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_departments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ticket_departments"`);

    await queryRunner.query(
      `ALTER TABLE "admin_tickets" DROP CONSTRAINT IF EXISTS "FK_19418c92fdfb8923b4127116454"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_tickets" DROP CONSTRAINT IF EXISTS "FK_60d62a01c2bac67ca56a5040a24"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_tickets" DROP CONSTRAINT IF EXISTS "FK_f7222eda75d40ac38ffeff64c0d"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_tickets"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "staff_conversations" (
        "id" SERIAL NOT NULL,
        "type" character varying NOT NULL DEFAULT 'direct',
        "title" character varying,
        "created_by" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_staff_conversations" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "staff_conversation_members" (
        "id" SERIAL NOT NULL,
        "conversation_id" integer NOT NULL,
        "admin_id" integer NOT NULL,
        "joined_at" TIMESTAMP NOT NULL DEFAULT now(),
        "last_read_at" TIMESTAMP,
        CONSTRAINT "PK_staff_conversation_members" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_staff_conversation_members_pair" UNIQUE ("conversation_id", "admin_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "staff_messages" (
        "id" SERIAL NOT NULL,
        "conversation_id" integer NOT NULL,
        "sender_id" integer NOT NULL,
        "message" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_staff_messages" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "staff_conversations"
        ADD CONSTRAINT "FK_staff_conversations_created_by"
        FOREIGN KEY ("created_by") REFERENCES "admins"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "staff_conversation_members"
        ADD CONSTRAINT "FK_staff_conversation_members_conversation"
        FOREIGN KEY ("conversation_id") REFERENCES "staff_conversations"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "staff_conversation_members"
        ADD CONSTRAINT "FK_staff_conversation_members_admin"
        FOREIGN KEY ("admin_id") REFERENCES "admins"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "staff_messages"
        ADD CONSTRAINT "FK_staff_messages_conversation"
        FOREIGN KEY ("conversation_id") REFERENCES "staff_conversations"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "staff_messages"
        ADD CONSTRAINT "FK_staff_messages_sender"
        FOREIGN KEY ("sender_id") REFERENCES "admins"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_staff_conversation_members_admin_id"
      ON "staff_conversation_members" ("admin_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_staff_messages_conversation_id"
      ON "staff_messages" ("conversation_id", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_staff_messages_conversation_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_staff_conversation_members_admin_id"`);

    await queryRunner.query(
      `ALTER TABLE "staff_messages" DROP CONSTRAINT IF EXISTS "FK_staff_messages_sender"`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff_messages" DROP CONSTRAINT IF EXISTS "FK_staff_messages_conversation"`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff_conversation_members" DROP CONSTRAINT IF EXISTS "FK_staff_conversation_members_admin"`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff_conversation_members" DROP CONSTRAINT IF EXISTS "FK_staff_conversation_members_conversation"`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff_conversations" DROP CONSTRAINT IF EXISTS "FK_staff_conversations_created_by"`,
    );

    await queryRunner.query(`DROP TABLE IF EXISTS "staff_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "staff_conversation_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "staff_conversations"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_tickets" (
        "id" SERIAL NOT NULL,
        "title" character varying NOT NULL,
        "message" text NOT NULL,
        "sender_id" integer NOT NULL,
        "receiver_type" character varying NOT NULL,
        "receiver_id" integer,
        "status" character varying NOT NULL DEFAULT 'unread',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "closed_at" TIMESTAMP,
        "closed_by" integer,
        CONSTRAINT "PK_246862868f321aea0f89567f544" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ticket_departments" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "description" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_b76104f92cf8373fc2af6dbfa88" UNIQUE ("name"),
        CONSTRAINT "PK_5ef8f08e82446896fc8b244490f" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_departments" (
        "admin_id" integer NOT NULL,
        "department_id" integer NOT NULL,
        CONSTRAINT "PK_e62a8f393b207406f4ad09fb052" PRIMARY KEY ("admin_id", "department_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tickets" (
        "id" SERIAL NOT NULL,
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "department_id" integer NOT NULL,
        "status" character varying NOT NULL DEFAULT 'new',
        "priority" character varying NOT NULL DEFAULT 'medium',
        "customer_id" character varying NOT NULL,
        "customer_name" character varying,
        "customer_email" character varying,
        "created_by" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "closed_at" TIMESTAMP,
        "closed_by" integer,
        CONSTRAINT "PK_343bc942ae261cf7a1377f48fd0" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ticket_messages" (
        "id" SERIAL NOT NULL,
        "ticket_id" integer NOT NULL,
        "sender_type" character varying NOT NULL,
        "sender_id" character varying NOT NULL,
        "message" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_37beb692dedf7eccb4e519ccec1" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ticket_assignments" (
        "id" SERIAL NOT NULL,
        "ticket_id" integer NOT NULL,
        "admin_id" integer NOT NULL,
        "assigned_at" TIMESTAMP NOT NULL DEFAULT now(),
        "unassigned_at" TIMESTAMP,
        CONSTRAINT "PK_02235b218e5aa8feec218f459d2" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "admin_tickets" ADD CONSTRAINT "FK_f7222eda75d40ac38ffeff64c0d"
        FOREIGN KEY ("sender_id") REFERENCES "admins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "admin_tickets" ADD CONSTRAINT "FK_60d62a01c2bac67ca56a5040a24"
        FOREIGN KEY ("receiver_id") REFERENCES "admins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "admin_tickets" ADD CONSTRAINT "FK_19418c92fdfb8923b4127116454"
        FOREIGN KEY ("closed_by") REFERENCES "admins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "admin_departments" ADD CONSTRAINT "FK_59081c1c31132a396a276a3347c"
        FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "admin_departments" ADD CONSTRAINT "FK_9d4189afdf3bbad66d05b6f5ae5"
        FOREIGN KEY ("department_id") REFERENCES "ticket_departments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "tickets" ADD CONSTRAINT "FK_fb1d03aa5fffa0e5ca41873a00a"
        FOREIGN KEY ("department_id") REFERENCES "ticket_departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "tickets" ADD CONSTRAINT "FK_06e9c7d7cd9faad009d4f1282fd"
        FOREIGN KEY ("closed_by") REFERENCES "admins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "ticket_messages" ADD CONSTRAINT "FK_75b3a5f421dbf7b73778da519cb"
        FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "ticket_assignments" ADD CONSTRAINT "FK_1f28749f7471a43f237d79eb7fd"
        FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "ticket_assignments" ADD CONSTRAINT "FK_0e17e833b8df20d5bc013bcaea1"
        FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
  }
}
