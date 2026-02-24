import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';

import { Admins } from '../entities/admins.entity';
import { Role } from '../entities/role.entity';
import { AdminDepartment } from 'src/entities/admin-department.entity';
import { AdminTicket } from 'src/entities/admin-ticket.entity';
import { RolePermission } from 'src/entities/role-permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admins, Role,AdminDepartment, AdminTicket,RolePermission]),
  ],
  controllers: [AdminsController],
  providers: [AdminsService],
  exports: [AdminsService],
})
export class AdminsModule {}
