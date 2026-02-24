import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Patch,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AdminsService } from './admins.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

 import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
 import { RolesGuard } from '../common/guards/roles.guard';
 import { PermissionsGuard } from '../common/guards/permissions.guard';
 import { Roles } from '../common/decorators/roles.decorator';
 import { Permissions } from '../common/decorators/permissions.decorator';
 import { GetUser } from '../common/decorators/user.decorator';
 import { FieldSelectionInterceptor } from '../common/interceptors/field-selection.interceptor';


@Controller('admins')
 @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
 @UseInterceptors(FieldSelectionInterceptor)
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get()
 @Roles('manager', 'super_admin')
   @Permissions('view_admins')
  async findAll(@Query() query: any, @GetUser() user: any) {
    return this.adminsService.findAll(query, user);
  }

  @Get('me')
  async getMe(@GetUser() user: any, @Query() query: any) {
    return this.adminsService.findOne(user.id, query, user);
  }

  @Get(':id')
  @Roles('manager', 'super_admin')
  @Permissions('view_admins')
  async findOne(@Param('id') id: string, @Query() query: any, @GetUser() user: any) {
    return this.adminsService.findOne(+id, query, user);
  }

  @Post()
  @Roles('manager', 'super_admin')
  @Permissions('create_admin')
  async create(@Body() createAdminDto: CreateAdminDto, @GetUser() user: any) {
    return this.adminsService.create(createAdminDto, user.id);
  }

  @Put(':id')
  @Roles('manager', 'super_admin')
  @Permissions('edit_admin')
  async update(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
    @GetUser() user: any,
  ) {
    return this.adminsService.update(+id, updateAdminDto, user);
  }

  @Patch(':id/toggle-active')
  @Roles('manager', 'super_admin')
  @Permissions('toggle_admin')
  async toggleActive(@Param('id') id: string, @GetUser() user: any) {
    return this.adminsService.toggleActive(+id, user);
  }

  @Delete(':id')
  @Roles('manager', 'super_admin')
  @Permissions('delete_admin')
  async remove(@Param('id') id: string) {
    return this.adminsService.remove(+id);
  }

 // مسیرهای مدیریت دپارتمان‌های ادمین (اختیاری)
  @Get(':id/departments')
  @Roles('manager', 'super_admin')
  @Permissions('edit_admin')
  async getAdminDepartments(@Param('id') id: string) {
    return this.adminsService.getAdminDepartments(+id);
  }

  @Post(':id/departments')
  @Roles('manager', 'super_admin')
  @Permissions('edit_admin')
  async assignDepartments(
    @Param('id') id: string,
    @Body('departmentIds') departmentIds: number[],
  ) {
    return this.adminsService.assignDepartments(+id, departmentIds);
  }
}