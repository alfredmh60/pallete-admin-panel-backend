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
import { SellerAuthGuard } from './seller-auth.guard';
import { CurrentSeller } from './decorators/current-seller.decorator';
import type { ValidatedSeller } from './seller-auth.service';
import { AnswerSellerTicketDto, CreateSellerTicketDto } from './dto/ticketing.dto';

/**
 * Seller-facing routes — same paths as core `/ticketing` so Frontend can switch base URL.
 * Auth: core seller JWT validated via SellerAuthGuard.
 */
@Controller('ticketing')
@UseGuards(SellerAuthGuard)
export class SellerTicketingController {
  constructor(private readonly ticketingService: TicketingService) {}

  @Get('unread-count')
  getUnreadCount(@CurrentSeller() seller: ValidatedSeller) {
    return this.ticketingService.getSellerUnreadCount(seller);
  }

  @Get()
  list(
    @CurrentSeller() seller: ValidatedSeller,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.ticketingService.listSellerTickets(
      seller,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 10,
    );
  }

  @Post()
  create(@CurrentSeller() seller: ValidatedSeller, @Body() dto: CreateSellerTicketDto) {
    return this.ticketingService.createSellerTicket(seller, dto);
  }

  @Get(':id')
  getOne(@CurrentSeller() seller: ValidatedSeller, @Param('id', ParseIntPipe) id: number) {
    return this.ticketingService.getSellerTicket(seller, id);
  }

  @Post(':id/answer')
  answer(
    @CurrentSeller() seller: ValidatedSeller,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AnswerSellerTicketDto,
  ) {
    return this.ticketingService.answerSellerTicket(seller, id, dto);
  }

  @Patch(':id/close')
  close(@CurrentSeller() seller: ValidatedSeller, @Param('id', ParseIntPipe) id: number) {
    return this.ticketingService.closeSellerTicket(seller, id);
  }

  @Patch(':id/reopen')
  reopen(@CurrentSeller() seller: ValidatedSeller, @Param('id', ParseIntPipe) id: number) {
    return this.ticketingService.reopenSellerTicket(seller, id);
  }
}
