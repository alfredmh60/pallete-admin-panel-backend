import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { FieldSelectionInterceptor } from '../common/interceptors/field-selection.interceptor';

@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(FieldSelectionInterceptor)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Roles('manager', 'super_admin')
  @Permissions('manage_roles')
  async findAll(@Query() query: any) {
    return this.permissionsService.findAll(query);
  }

  @Get(':id')
  @Roles('manager', 'super_admin')
  @Permissions('manage_roles')
  async findOne(@Param('id') id: string, @Query() query: any) {
    return this.permissionsService.findOne(+id, query);
  }

  @Post()
  @Roles('manager', 'super_admin')
  @Permissions('manage_roles')
  async create(@Body() createPermissionDto: CreatePermissionDto, @Query() query: any) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Put(':id')
  @Roles('manager', 'super_admin')
  @Permissions('manage_roles')
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(+id, updatePermissionDto);
  }

  @Delete(':id')
  @Roles('manager', 'super_admin')
  @Permissions('manage_roles')
  async remove(@Param('id') id: string) {
    return this.permissionsService.remove(+id);
  }

  // ========== آمار و گزارشات ==========

  @Get('stats/usage')
  @Roles('manager', 'super_admin')
  @Permissions('view_logs')
  async getPermissionUsageStats() {
    return this.permissionsService.getPermissionUsageStats();
  }

  @Get('stats/unused')
  @Roles('manager', 'super_admin')
  @Permissions('view_logs')
  async getUnusedPermissions() {
    return this.permissionsService.getUnusedPermissions();
  }

  // ========== دسته‌بندی مجوزها ==========

//   @Get('categories/all')
//   @Roles('manager', 'super_admin')
//   @Permissions('manage_roles')
//   async getPermissionsByCategory() {
//     return this.permissionsService.getPermissionsByCategory();
//   }
}