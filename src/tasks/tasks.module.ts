import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from '../auth/auth.module';
import { TicketingModule } from '../ticketing/ticketing.module';
import { TokenCleanupTask } from './token-cleanup.task';

@Module({
  imports: [ScheduleModule.forRoot(), AuthModule, TicketingModule],
  providers: [TokenCleanupTask],
})
export class TasksModule {}
