import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { GetUser } from '../../common/decorators/user.decorator';
import { FieldSelectionInterceptor } from '../../common/interceptors/field-selection.interceptor';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('tickets/:ticketId/messages')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(FieldSelectionInterceptor)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @Permissions('reply_ticket')
  async create(
    @Param('ticketId') ticketId: string,
    @Body() createMessageDto: CreateMessageDto,
    @GetUser() user: any,
  ) {
    return this.messagesService.create(+ticketId, createMessageDto, user);
  }

  @Get()
  @Permissions('view_tickets')
  async findAll(
    @Param('ticketId') ticketId: string,
    @Query() query: any,
    @GetUser() user: any,
  ) {
    return this.messagesService.findAll(+ticketId, query, user);
  }

  @Get('latest')
  @Permissions('view_tickets')
  async findLatest(
    @Param('ticketId') ticketId: string,
    @GetUser() user: any,
  ) {
    return this.messagesService.findLatest(+ticketId, user);
  }

  @Delete(':id')
  @Roles('manager', 'super_admin')
  @Permissions('delete_ticket')
  async remove(
    @Param('ticketId') ticketId: string,
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return this.messagesService.remove(+ticketId, +id, user);
  }
}