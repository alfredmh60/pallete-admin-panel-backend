import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

import { DepartmentsModule } from './departments/departments.module';
import { MessagesModule } from './messages/messages.module';

import { Ticket } from '../entities/ticket.entity';
import { TicketMessage } from '../entities/ticket-message.entity';
import { TicketAssignment } from '../entities/ticket-assignment.entity';
import { TicketDepartment } from '../entities/ticket-department.entity';
import { AdminDepartment } from '../entities/admin-department.entity';
import { Admins } from '../entities/admins.entity';
import { RolePermission } from 'src/entities/role-permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
      TicketMessage,
      TicketAssignment,
      TicketDepartment,
      AdminDepartment,
      Admins,
      RolePermission
    ]),
    DepartmentsModule,
    MessagesModule,
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}