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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { GetUser } from '../../common/decorators/user.decorator';
import { FieldSelectionInterceptor } from '../../common/interceptors/field-selection.interceptor';

@Controller('ticket-departments')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(FieldSelectionInterceptor)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @Permissions('view_tickets')
  async findAll(@Query() query: any) {
    return this.departmentsService.findAll(query);
  }

  @Get('stats')
  @Roles('manager', 'super_admin')
  @Permissions('view_tickets')
  async getStats() {
    return this.departmentsService.getStats();
  }

  @Get(':id')
  @Permissions('view_tickets')
  async findOne(@Param('id') id: string, @Query() query: any) {
    return this.departmentsService.findOne(+id, query);
  }

  @Get(':id/admins')
  @Roles('manager', 'super_admin')
  @Permissions('edit_admin')
  async getDepartmentAdmins(@Param('id') id: string) {
    return this.departmentsService.getDepartmentAdmins(+id);
  }

  @Post()
  @Roles('manager', 'super_admin')
  @Permissions('manage_tickets')
  async create(@Body() createDepartmentDto: CreateDepartmentDto, @GetUser() user: any) {
    return this.departmentsService.create(createDepartmentDto, user.id);
  }

  @Put(':id')
  @Roles('manager', 'super_admin')
  @Permissions('manage_tickets')
  async update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(+id, updateDepartmentDto);
  }

  @Delete(':id')
  @Roles('manager', 'super_admin')
  @Permissions('manage_tickets')
  async remove(@Param('id') id: string) {
    return this.departmentsService.remove(+id);
  }

  @Post(':id/admins')
  @Roles('manager', 'super_admin')
  @Permissions('edit_admin')
  async assignAdmins(
    @Param('id') id: string,
    @Body('adminIds') adminIds: number[],
  ) {
    return this.departmentsService.assignAdmins(+id, adminIds);
  }

  @Delete(':id/admins/:adminId')
  @Roles('manager', 'super_admin')
  @Permissions('edit_admin')
  async removeAdmin(
    @Param('id') id: string,
    @Param('adminId') adminId: string,
  ) {
    return this.departmentsService.removeAdmin(+id, +adminId);
  }
}