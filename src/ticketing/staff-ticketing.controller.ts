import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TicketingService } from './ticketing.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { GetUser } from '../common/decorators/user.decorator';
import {
  AssignTicketDto,
  StaffInternalNoteDto,
  StaffReplyDto,
} from './dto/ticketing.dto';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class StaffTicketingController {
  constructor(private readonly ticketingService: TicketingService) {}

  @Get('stats')
  @Permissions('view_tickets')
  getStats() {
    return this.ticketingService.getStats();
  }

  @Get()
  @Permissions('view_tickets')
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('assignedAdminId') assignedAdminId?: string,
    @Query('search') search?: string,
  ) {
    return this.ticketingService.listStaffTickets({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status,
      assignedAdminId:
        assignedAdminId !== undefined && assignedAdminId !== ''
          ? Number(assignedAdminId)
          : undefined,
      search,
    });
  }

  @Get(':id')
  @Permissions('view_tickets')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.ticketingService.getStaffTicket(id);
  }

  @Post(':id/messages')
  @Permissions('reply_ticket')
  reply(
    @GetUser() user: { id: number; name?: string },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: StaffReplyDto,
  ) {
    return this.ticketingService.staffReply(user, id, dto);
  }

  @Post(':id/notes')
  @Permissions('reply_ticket')
  addNote(
    @GetUser() user: { id: number; name?: string },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: StaffInternalNoteDto,
  ) {
    return this.ticketingService.addInternalNote(user, id, dto);
  }

  @Patch(':id/close')
  @Permissions('close_ticket')
  close(@GetUser() user: { id: number }, @Param('id', ParseIntPipe) id: number) {
    return this.ticketingService.closeTicket(user, id);
  }

  @Patch(':id/reopen')
  @Permissions('edit_ticket')
  reopen(@GetUser() user: { id: number }, @Param('id', ParseIntPipe) id: number) {
    return this.ticketingService.reopenTicket(user, id);
  }

  @Patch(':id/assign')
  @Permissions('assign_ticket')
  assign(
    @GetUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignTicketDto,
  ) {
    return this.ticketingService.assignTicket(user, id, dto);
  }
}
