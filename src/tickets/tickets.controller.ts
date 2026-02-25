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
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AddMessageDto } from './dto/add-message.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { GetUser } from '../common/decorators/user.decorator';
import { FieldSelectionInterceptor } from '../common/interceptors/field-selection.interceptor';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(FieldSelectionInterceptor)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // ========== مدیریت تیکت‌ها ==========

  @Get()
  @Permissions('view_tickets')
  async findAll(@Query() query: any, @GetUser() user: any) {
    return this.ticketsService.findAll(query, user);
  }

  @Get('stats')
  @Permissions('view_tickets')
  async getStats(@GetUser() user: any) {
    return this.ticketsService.getStats(user);
  }

  @Get(':id')
  @Permissions('view_tickets')
  async findOne(@Param('id') id: string, @GetUser() user: any) {
    return this.ticketsService.findOne(+id, user);
  }

  @Post()
  @Roles('manager', 'super_admin')
  @Permissions('manage_tickets')
  async create(@Body() createTicketDto: CreateTicketDto, @GetUser() user: any) {
    return this.ticketsService.create(createTicketDto, user.id);
  }

  @Put(':id')
  @Permissions('edit_ticket')
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
    @GetUser() user: any,
  ) {
    return this.ticketsService.update(+id, updateTicketDto, user);
  }

  @Patch(':id/status')
  @Permissions('edit_ticket')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @GetUser() user: any,
  ) {
    return this.ticketsService.updateStatus(+id, status, user);
  }

  @Patch(':id/priority')
  @Permissions('edit_ticket')
  async updatePriority(
    @Param('id') id: string,
    @Body('priority') priority: string,
    @GetUser() user: any,
  ) {
    return this.ticketsService.updatePriority(+id, priority, user);
  }

  @Patch(':id/assign')
  @Roles('manager', 'super_admin')
  @Permissions('assign_ticket')
  async assignTicket(
    @Param('id') id: string,
    @Body('adminId') adminId: number,
    @GetUser() user: any,
  ) {
    return this.ticketsService.assignTicket(+id, adminId, user);
  }

  @Patch(':id/close')
  @Permissions('close_ticket')
  async closeTicket(@Param('id') id: string, @GetUser() user: any) {
    return this.ticketsService.closeTicket(+id, user);
  }

  @Patch(':id/reopen')
  @Permissions('edit_ticket')
  async reopenTicket(@Param('id') id: string, @GetUser() user: any) {
    return this.ticketsService.reopenTicket(+id, user);
  }

  @Delete(':id')
  @Roles('manager', 'super_admin')
  @Permissions('delete_ticket')
  async remove(@Param('id') id: string) {
    return this.ticketsService.remove(+id);
  }

  // ========== مدیریت پیام‌های تیکت ==========

  @Post(':id/messages')
  @Permissions('reply_ticket')
  async addMessage(
    @Param('id') id: string,
    @Body() addMessageDto: AddMessageDto,
    @GetUser() user: any,
  ) {
    return this.ticketsService.addMessage(+id, addMessageDto, user);
  }

  @Get(':id/messages')
  @Permissions('view_tickets')
  async getMessages(@Param('id') id: string, @GetUser() user: any) {
    return this.ticketsService.getMessages(+id, user);
  }

  // ========== دپارتمان‌ها ==========

  @Get('departments/all')
  async getAllDepartments() {
    return this.ticketsService.getAllDepartments();
  }

  @Post(':id/transfer')
  @Permissions('edit_ticket')
  async transferDepartment(
    @Param('id') id: string,
    @Body('departmentId') departmentId: number,
    @GetUser() user: any,
  ) {
    return this.ticketsService.transferDepartment(+id, departmentId, user);
  }
}