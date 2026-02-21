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
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles as RolesDecorator } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { GetUser } from '../common/decorators/user.decorator';
import { FieldSelectionInterceptor } from '../common/interceptors/field-selection.interceptor';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(FieldSelectionInterceptor)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RolesDecorator('manager', 'super_admin')
  @Permissions('manage_roles')
  async findAll(@Query() query: any) {
    return this.rolesService.findAll(query);
  }

  @Get(':id')
  @RolesDecorator('manager', 'super_admin')
  @Permissions('manage_roles')
  async findOne(@Param('id') id: string, @Query() query: any) {
    return this.rolesService.findOne(+id, query);
  }

  @Post()
  @RolesDecorator('manager', 'super_admin')
  @Permissions('manage_roles')
  async create(@Body() createRoleDto: CreateRoleDto, @GetUser() user: any) {
    return this.rolesService.create(createRoleDto, user.id);
  }

  @Put(':id')
  @RolesDecorator('manager', 'super_admin')
  @Permissions('manage_roles')
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(+id, updateRoleDto);
  }

  @Delete(':id')
  @RolesDecorator('manager', 'super_admin')
  @Permissions('manage_roles')
  async remove(@Param('id') id: string) {
    return this.rolesService.remove(+id);
  }

  // ========== مدیریت مجوزهای نقش ==========

  // @Get(':id/permissions')
  // @RolesDecorator('manager', 'super_admin')
  // @Permissions('manage_roles')
  // async getRolePermissions(@Param('id') id: string) {
  //   return this.rolesService.getRolePermissions(+id);
  // }

  @Post(':id/permissions')
  @RolesDecorator('manager', 'super_admin')
  @Permissions('manage_roles')
  async assignPermissions(
    @Param('id') id: string,
    @Body('permissionIds') permissionIds: number[],
  ) {
    return this.rolesService.assignPermissions(+id, permissionIds);
  }

  @Delete(':id/permissions/:permissionId')
  @RolesDecorator('manager', 'super_admin')
  @Permissions('manage_roles')
  async removePermission(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rolesService.removePermission(+id, +permissionId);
  }

  // ========== آمار نقش‌ها ==========

  @Get('stats/counts')
  @RolesDecorator('manager', 'super_admin')
  @Permissions('view_admins')
  async getRoleStats() {
    return this.rolesService.getRoleStats();
  }
}