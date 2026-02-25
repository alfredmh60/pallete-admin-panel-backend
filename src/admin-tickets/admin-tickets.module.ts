import { Module } from '@nestjs/common';
import { AdminTicketsController } from './admin-tickets.controller';
import { AdminTicketsService } from './admin-tickets.service';

@Module({
  controllers: [AdminTicketsController],
  providers: [AdminTicketsService]
})
export class AdminTicketsModule {}
