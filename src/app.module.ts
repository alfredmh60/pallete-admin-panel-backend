import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './database/database.module';

import { AuthModule } from './auth/auth.module';
import { AdminsModule } from './admins/admins.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { EmailModule } from './email/email.module';
import { LogsModule } from './logs/logs.module';
import { StaffChatModule } from './staff-chat/staff-chat.module';
import { TasksModule } from './tasks/tasks.module';
import { TicketingModule } from './ticketing/ticketing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    DatabaseModule,

    EmailModule,

    AdminsModule,
    RolesModule,
    PermissionsModule,
    AuthModule,
    LogsModule,
    StaffChatModule,
    TasksModule,
    TicketingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
