import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDatabase1772004208820 implements MigrationInterface {
    name = 'InitDatabase1772004208820'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "permissions" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "category" character varying, "description" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_48ce552495d14eae9b187bb6716" UNIQUE ("name"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "role_permissions" ("role_id" integer NOT NULL, "permission_id" integer NOT NULL, CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY ("role_id", "permission_id"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, "created_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "logs" ("id" SERIAL NOT NULL, "admin_id" integer, "action" character varying NOT NULL, "entity_type" character varying NOT NULL, "entity_id" integer, "details" text, "ip" character varying, "user_agent" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fb1b805f2f7795de79fa69340ba" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ticket_assignments" ("id" SERIAL NOT NULL, "ticket_id" integer NOT NULL, "admin_id" integer NOT NULL, "assigned_at" TIMESTAMP NOT NULL DEFAULT now(), "unassigned_at" TIMESTAMP, CONSTRAINT "PK_02235b218e5aa8feec218f459d2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "admin_tickets" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "message" text NOT NULL, "sender_id" integer NOT NULL, "receiver_type" character varying NOT NULL, "receiver_id" integer, "status" character varying NOT NULL DEFAULT 'unread', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "closed_at" TIMESTAMP, "closed_by" integer, CONSTRAINT "PK_246862868f321aea0f89567f544" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "admins" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "name" character varying, "avatar" character varying, "role_id" integer, "is_active" boolean NOT NULL DEFAULT true, "reset_token" character varying, "reset_token_expiry" TIMESTAMP, "created_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_051db7d37d478a69a7432df1479" UNIQUE ("email"), CONSTRAINT "PK_e3b38270c97a854c48d2e80874e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "admin_departments" ("admin_id" integer NOT NULL, "department_id" integer NOT NULL, CONSTRAINT "PK_e62a8f393b207406f4ad09fb052" PRIMARY KEY ("admin_id", "department_id"))`);
        await queryRunner.query(`CREATE TABLE "ticket_departments" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b76104f92cf8373fc2af6dbfa88" UNIQUE ("name"), CONSTRAINT "PK_5ef8f08e82446896fc8b244490f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ticket_messages" ("id" SERIAL NOT NULL, "ticket_id" integer NOT NULL, "sender_type" character varying NOT NULL, "sender_id" character varying NOT NULL, "message" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_37beb692dedf7eccb4e519ccec1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tickets" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "department_id" integer NOT NULL, "status" character varying NOT NULL DEFAULT 'new', "priority" character varying NOT NULL DEFAULT 'medium', "customer_id" character varying NOT NULL, "customer_name" character varying, "customer_email" character varying, "created_by" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "closed_at" TIMESTAMP, "closed_by" integer, CONSTRAINT "PK_343bc942ae261cf7a1377f48fd0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "blacklisted_tokens" ("id" SERIAL NOT NULL, "token" character varying(500) NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8fb1bc7333c3b9f249f9feaa55d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6a007e30533d353b3da953e94c" ON "blacklisted_tokens" ("expiresAt") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2b8c5de96ce5460b558e94f150" ON "blacklisted_tokens" ("token") `);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "logs" ADD CONSTRAINT "FK_92ec818c77748650cbfd4233672" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ticket_assignments" ADD CONSTRAINT "FK_1f28749f7471a43f237d79eb7fd" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ticket_assignments" ADD CONSTRAINT "FK_0e17e833b8df20d5bc013bcaea1" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "admin_tickets" ADD CONSTRAINT "FK_f7222eda75d40ac38ffeff64c0d" FOREIGN KEY ("sender_id") REFERENCES "admins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "admin_tickets" ADD CONSTRAINT "FK_60d62a01c2bac67ca56a5040a24" FOREIGN KEY ("receiver_id") REFERENCES "admins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "admin_tickets" ADD CONSTRAINT "FK_19418c92fdfb8923b4127116454" FOREIGN KEY ("closed_by") REFERENCES "admins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "admins" ADD CONSTRAINT "FK_5733c73cd81c566a90cc4802f96" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "admins" ADD CONSTRAINT "FK_df8988d920f8bd154c37cf81004" FOREIGN KEY ("created_by") REFERENCES "admins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "admin_departments" ADD CONSTRAINT "FK_59081c1c31132a396a276a3347c" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "admin_departments" ADD CONSTRAINT "FK_9d4189afdf3bbad66d05b6f5ae5" FOREIGN KEY ("department_id") REFERENCES "ticket_departments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ticket_messages" ADD CONSTRAINT "FK_75b3a5f421dbf7b73778da519cb" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "FK_fb1d03aa5fffa0e5ca41873a00a" FOREIGN KEY ("department_id") REFERENCES "ticket_departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "FK_06e9c7d7cd9faad009d4f1282fd" FOREIGN KEY ("closed_by") REFERENCES "admins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT "FK_06e9c7d7cd9faad009d4f1282fd"`);
        await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT "FK_fb1d03aa5fffa0e5ca41873a00a"`);
        await queryRunner.query(`ALTER TABLE "ticket_messages" DROP CONSTRAINT "FK_75b3a5f421dbf7b73778da519cb"`);
        await queryRunner.query(`ALTER TABLE "admin_departments" DROP CONSTRAINT "FK_9d4189afdf3bbad66d05b6f5ae5"`);
        await queryRunner.query(`ALTER TABLE "admin_departments" DROP CONSTRAINT "FK_59081c1c31132a396a276a3347c"`);
        await queryRunner.query(`ALTER TABLE "admins" DROP CONSTRAINT "FK_df8988d920f8bd154c37cf81004"`);
        await queryRunner.query(`ALTER TABLE "admins" DROP CONSTRAINT "FK_5733c73cd81c566a90cc4802f96"`);
        await queryRunner.query(`ALTER TABLE "admin_tickets" DROP CONSTRAINT "FK_19418c92fdfb8923b4127116454"`);
        await queryRunner.query(`ALTER TABLE "admin_tickets" DROP CONSTRAINT "FK_60d62a01c2bac67ca56a5040a24"`);
        await queryRunner.query(`ALTER TABLE "admin_tickets" DROP CONSTRAINT "FK_f7222eda75d40ac38ffeff64c0d"`);
        await queryRunner.query(`ALTER TABLE "ticket_assignments" DROP CONSTRAINT "FK_0e17e833b8df20d5bc013bcaea1"`);
        await queryRunner.query(`ALTER TABLE "ticket_assignments" DROP CONSTRAINT "FK_1f28749f7471a43f237d79eb7fd"`);
        await queryRunner.query(`ALTER TABLE "logs" DROP CONSTRAINT "FK_92ec818c77748650cbfd4233672"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2b8c5de96ce5460b558e94f150"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6a007e30533d353b3da953e94c"`);
        await queryRunner.query(`DROP TABLE "blacklisted_tokens"`);
        await queryRunner.query(`DROP TABLE "tickets"`);
        await queryRunner.query(`DROP TABLE "ticket_messages"`);
        await queryRunner.query(`DROP TABLE "ticket_departments"`);
        await queryRunner.query(`DROP TABLE "admin_departments"`);
        await queryRunner.query(`DROP TABLE "admins"`);
        await queryRunner.query(`DROP TABLE "admin_tickets"`);
        await queryRunner.query(`DROP TABLE "ticket_assignments"`);
        await queryRunner.query(`DROP TABLE "logs"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
    }

}
