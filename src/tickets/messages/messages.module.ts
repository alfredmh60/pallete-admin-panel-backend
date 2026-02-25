import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

import { TicketMessage } from '../../entities/ticket-message.entity';
import { Ticket } from '../../entities/ticket.entity';
import { TicketAssignment } from '../../entities/ticket-assignment.entity';
import { AdminDepartment } from '../../entities/admin-department.entity';
import { Admins } from '../../entities/admins.entity';
import { RolePermission } from 'src/entities/role-permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TicketMessage, Ticket, TicketAssignment, AdminDepartment, Admins,RolePermission]),
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}