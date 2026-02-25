import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';

import { TicketDepartment } from '../../entities/ticket-department.entity';
import { AdminDepartment } from '../../entities/admin-department.entity';
import { Admins } from '../../entities/admins.entity';
import { Ticket } from '../../entities/ticket.entity';
import { RolePermission } from 'src/entities/role-permission.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([TicketDepartment, AdminDepartment, Admins, Ticket,RolePermission]),
  ],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}