import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { LogsService } from './logs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles as RolesDecorator } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { FieldSelectionInterceptor } from '../common/interceptors/field-selection.interceptor';

@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(FieldSelectionInterceptor)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @RolesDecorator('manager', 'super_admin')
  @Permissions('view_logs')
  findAll(@Query() query: Record<string, any>) {
    return this.logsService.findAll(query);
  }

  @Get('stats')
  @RolesDecorator('manager', 'super_admin')
  @Permissions('view_logs')
  getStats(@Query() query: { from?: string; to?: string }) {
    return this.logsService.getStats(query);
  }

  @Get('actions')
  @RolesDecorator('manager', 'super_admin')
  @Permissions('view_logs')
  getActions() {
    return this.logsService.getActions();
  }

  @Get('reports/daily')
  @RolesDecorator('manager', 'super_admin')
  @Permissions('view_logs')
  getDailyReport(@Query() query: { from?: string; to?: string }) {
    return this.logsService.getDailyReport(query);
  }

  @Get('users/:userId')
  @RolesDecorator('manager', 'super_admin')
  @Permissions('view_logs')
  getByUser(@Param('userId') userId: string, @Query() query: Record<string, any>) {
    return this.logsService.findAll({ ...query, adminId: userId });
  }

  @Get('resource/:entityType/:entityId')
  @RolesDecorator('manager', 'super_admin')
  @Permissions('view_logs')
  getByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.logsService.findAll({ ...query, entityType, entityId });
  }

  @Get(':id')
  @RolesDecorator('manager', 'super_admin')
  @Permissions('view_logs')
  findOne(@Param('id') id: string) {
    return this.logsService.findOne(+id);
  }

  @Delete('older-than/:days')
  @RolesDecorator('manager', 'super_admin')
  @Permissions('manage_logs')
  deleteOlderThan(@Param('days') days: string) {
    return this.logsService.deleteOlderThan(+days);
  }
}
