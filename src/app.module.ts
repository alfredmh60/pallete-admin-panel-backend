import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// ماژول دیتابیس
import { DatabaseModule } from './database/database.module';

// ماژول‌های اصلی
import { AuthModule } from './auth/auth.module';
import { AdminsModule } from './admins/admins.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
// import { DiscountsModule } from './discounts/discounts.module';
// import { FinanceModule } from './finance/finance.module';
import { EmailModule } from './email/email.module';
import { TicketsModule } from './tickets/tickets.module';
import { LogsModule } from './logs/logs.module';
import { AdminTicketsModule } from './admin-tickets/admin-tickets.module';

@Module({
  imports: [
    // پیکربندی سراسری محیط
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ماژول دیتابیس (TypeORM)
    DatabaseModule,

    // ماژول‌های کاربردی
    EmailModule, // سرویس ایمیل (Global)

    AdminsModule, // مدیریت ادمین‌ها
    RolesModule, // مدیریت نقش‌ها
    PermissionsModule, // مدیریت مجوزها
    AuthModule, // احراز هویت
    TicketsModule, // مدیریت تیکت‌ها
    LogsModule, // مدیریت لاگ‌ها
    AdminTicketsModule, // تیکت‌های مدیریتی

    // // DiscountsModule,  // مدیریت تخفیف‌ها

    // FinanceModule,    // مدیریت مالی
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
