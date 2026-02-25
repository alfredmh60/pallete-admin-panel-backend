import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';

import { TicketMessage } from '../../entities/ticket-message.entity';
import { Ticket } from '../../entities/ticket.entity';
import { TicketAssignment } from '../../entities/ticket-assignment.entity';
import { AdminDepartment } from '../../entities/admin-department.entity';
import { Admins } from '../../entities/admins.entity';

import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(TicketMessage)
    private messageRepository: Repository<TicketMessage>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketAssignment)
    private assignmentRepository: Repository<TicketAssignment>,
    @InjectRepository(AdminDepartment)
    private adminDepartmentRepository: Repository<AdminDepartment>,
    @InjectRepository(Admins)
    private adminRepository: Repository<Admins>,
  ) {}

  private async checkTicketAccess(ticketId: number, user: any): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['department'],
    });

    if (!ticket) {
      throw new NotFoundException('تیکت مورد نظر یافت نشد');
    }

    // بررسی دسترسی بر اساس نقش
    if (user.role === 'admin_support') {
      const assignment = await this.assignmentRepository.findOne({
        where: {
          ticketId,
          adminId: user.id,
          unassignedAt: IsNull(),
        },
      });
      if (!assignment) {
        throw new ForbiddenException('شما به این تیکت دسترسی ندارید');
      }
    } else if (user.role === 'admin_finance') {
      const adminDepts = await this.adminDepartmentRepository.find({
        where: { adminId: user.id },
      });
      const deptIds = adminDepts.map(ad => ad.departmentId);
      if (!deptIds.includes(ticket.departmentId)) {
        throw new ForbiddenException('شما به این تیکت دسترسی ندارید');
      }
    }

    return ticket;
  }

  async create(
    ticketId: number,
    createMessageDto: CreateMessageDto,
    user: any,
  ): Promise<TicketMessage> {
    const ticket = await this.checkTicketAccess(ticketId, user);

    const message = this.messageRepository.create({
      ticketId,
      senderType: 'admin',
      senderId: user.id.toString(),
      message: createMessageDto.message,
    });

    const savedMessage = await this.messageRepository.save(message);

    // اگر تیکت جدید بود، وضعیت رو به در حال بررسی تغییر بده
    if (ticket.status === 'new') {
      await this.ticketRepository.update(ticketId, { status: 'in_progress' });
    }

    return savedMessage;
  }

  async findAll(
    ticketId: number,
    query: any,
    user: any,
  ): Promise<{ data: TicketMessage[]; total: number }> {
    await this.checkTicketAccess(ticketId, user);

    const { limit = 100, offset = 0 } = query;

    const [messages, total] = await this.messageRepository.findAndCount({
      where: { ticketId },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    return { data: messages, total };
  }

  async findLatest(ticketId: number, user: any): Promise<TicketMessage> {
    await this.checkTicketAccess(ticketId, user);

    const message = await this.messageRepository.findOne({
      where: { ticketId },
      order: { createdAt: 'DESC' },
    });

    if (!message) {
      throw new NotFoundException('پیامی یافت نشد');
    }

    return message;
  }

  async remove(ticketId: number, messageId: number, user: any): Promise<{ message: string }> {
    await this.checkTicketAccess(ticketId, user);

    const message = await this.messageRepository.findOne({
      where: { id: messageId, ticketId },
    });

    if (!message) {
      throw new NotFoundException('پیام مورد نظر یافت نشد');
    }

    // فقط مدیر و سوپرادمین می‌تونن پیام رو حذف کنن
    if (user.role !== 'manager' && user.role !== 'super_admin') {
      throw new ForbiddenException('شما اجازه حذف پیام را ندارید');
    }

    await this.messageRepository.delete(messageId);

    return { message: 'پیام با موفقیت حذف شد' };
  }
}