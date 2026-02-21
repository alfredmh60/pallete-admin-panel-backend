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
// import { TicketsModule } from './tickets/tickets.module';
// import { FinanceModule } from './finance/finance.module';
// import { AdminTicketsModule } from './admin-tickets/admin-tickets.module';
// import { LogsModule } from './logs/logs.module';
import { EmailModule } from './email/email.module';

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
    EmailModule,      // سرویس ایمیل (Global)
    AuthModule,       // احراز هویت
    AdminsModule,     // مدیریت ادمین‌ها
    RolesModule,      // مدیریت نقش‌ها
    PermissionsModule, // مدیریت مجوزها
    // DiscountsModule,  // مدیریت تخفیف‌ها
    // TicketsModule,    // مدیریت تیکت‌ها
    // FinanceModule,    // مدیریت مالی
    // AdminTicketsModule, // تیکت‌های مدیریتی
    // LogsModule,       // مدیریت لاگ‌ها
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}