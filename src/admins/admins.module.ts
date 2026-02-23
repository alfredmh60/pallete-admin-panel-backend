import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';

import { Admins } from '../entities/admins.entity';
import { Role } from '../entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admins, Role]),
  ],
  controllers: [AdminsController],
  providers: [AdminsService],
  exports: [AdminsService],
})
export class AdminsModule {}
