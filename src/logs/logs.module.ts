import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { Log } from '../entities/log.entity';
import { RolePermission } from '../entities/role-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Log, RolePermission])],
  controllers: [LogsController],
  providers: [LogsService],
  exports: [LogsService],
})
export class LogsModule {}
