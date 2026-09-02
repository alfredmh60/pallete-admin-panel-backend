import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateStaffChatPermissions1773000000001 implements MigrationInterface {
  name = 'UpdateStaffChatPermissions1773000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "permissions"
      SET "name" = 'view_staff_chat',
          "description" = 'مشاهده چت کارکنان',
          "category" = 'staffChat'
      WHERE "name" = 'view_admin_tickets'
    `);

    await queryRunner.query(`
      UPDATE "permissions"
      SET "name" = 'send_staff_chat',
          "description" = 'ارسال پیام در چت کارکنان',
          "category" = 'staffChat'
      WHERE "name" = 'send_admin_ticket'
    `);

    await queryRunner.query(`
      UPDATE "permissions"
      SET "name" = 'manage_staff_conversations',
          "description" = 'ایجاد و مدیریت گفتگوهای گروهی',
          "category" = 'staffChat'
      WHERE "name" = 'close_admin_ticket'
    `);

    await queryRunner.query(`
      INSERT INTO "permissions" ("name", "description", "category", "created_at")
      SELECT 'view_staff_chat', 'مشاهده چت کارکنان', 'staffChat', now()
      WHERE NOT EXISTS (SELECT 1 FROM "permissions" WHERE "name" = 'view_staff_chat')
    `);

    await queryRunner.query(`
      INSERT INTO "permissions" ("name", "description", "category", "created_at")
      SELECT 'send_staff_chat', 'ارسال پیام در چت کارکنان', 'staffChat', now()
      WHERE NOT EXISTS (SELECT 1 FROM "permissions" WHERE "name" = 'send_staff_chat')
    `);

    await queryRunner.query(`
      INSERT INTO "permissions" ("name", "description", "category", "created_at")
      SELECT 'manage_staff_conversations', 'ایجاد و مدیریت گفتگوهای گروهی', 'staffChat', now()
      WHERE NOT EXISTS (SELECT 1 FROM "permissions" WHERE "name" = 'manage_staff_conversations')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "permissions"
      SET "name" = 'view_admin_tickets',
          "description" = 'مشاهده تیکت‌های مدیریتی',
          "category" = 'adminTickets'
      WHERE "name" = 'view_staff_chat'
    `);

    await queryRunner.query(`
      UPDATE "permissions"
      SET "name" = 'send_admin_ticket',
          "description" = 'ارسال تیکت مدیریتی',
          "category" = 'adminTickets'
      WHERE "name" = 'send_staff_chat'
    `);

    await queryRunner.query(`
      UPDATE "permissions"
      SET "name" = 'close_admin_ticket',
          "description" = 'بستن تیکت مدیریتی',
          "category" = 'adminTickets'
      WHERE "name" = 'manage_staff_conversations'
    `);
  }
}
