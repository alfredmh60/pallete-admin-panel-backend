import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

import { Ticket } from '../entities/ticket.entity';
import { TicketMessage } from '../entities/ticket-message.entity';
import { TicketAssignment } from '../entities/ticket-assignment.entity';
import { TicketDepartment } from '../entities/ticket-department.entity';
import { AdminDepartment } from '../entities/admin-department.entity';
import { Admins } from '../entities/admins.entity';

import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { ITicketResponse, ITicketStats, ITicketWithMessages } from './interface/ticket.interface';


@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketMessage)
    private messageRepository: Repository<TicketMessage>,
    @InjectRepository(TicketAssignment)
    private assignmentRepository: Repository<TicketAssignment>,
    @InjectRepository(TicketDepartment)
    private departmentRepository: Repository<TicketDepartment>,
    @InjectRepository(AdminDepartment)
    private adminDepartmentRepository: Repository<AdminDepartment>,
    @InjectRepository(Admins)
    private adminRepository: Repository<Admins>,
  ) {}

  // ========== توابع کمکی ==========

  private async findLeastBusyAdminInDepartment(departmentId: number): Promise<number | null> {
    // پیدا کردن ادمین‌های فعال در این دپارتمان
    const adminDepartments = await this.adminDepartmentRepository.find({
      where: { departmentId },
      relations: ['admin'],
    });

    const activeAdminIds = adminDepartments
      .filter(ad => ad.admin.isActive)
      .map(ad => ad.adminId);

    if (activeAdminIds.length === 0) return null;

    // شمارش تیکت‌های باز هر ادمین
    const assignments = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .select('assignment.adminId', 'adminId')
      .addSelect('COUNT(*)', 'count')
      .innerJoin(Ticket, 'ticket', 'ticket.id = assignment.ticketId')
      .where('assignment.adminId IN (:...adminIds)', { adminIds: activeAdminIds })
      .andWhere('assignment.unassignedAt IS NULL')
      .andWhere('ticket.status IN (:...statuses)', { statuses: ['new', 'in_progress'] })
      .groupBy('assignment.adminId')
      .getRawMany();

    const workloadMap = new Map(activeAdminIds.map(id => [id, 0]));
    assignments.forEach(row => workloadMap.set(row.adminId, parseInt(row.count)));

    // پیدا کردن ادمین با کمترین بار کاری
    let minAdminId: number | null = null;
    let minCount = Infinity;

    for (const [id, cnt] of workloadMap) {
      if (cnt < minCount) {
        minCount = cnt;
        minAdminId = id;
      }
    }

    return minAdminId;
  }

  private async getAdminDepartmentIds(adminId: number): Promise<number[]> {
    const adminDepts = await this.adminDepartmentRepository.find({
      where: { adminId },
    });
    return adminDepts.map(ad => ad.departmentId);
  }

  private async checkTicketAccess(ticketId: number, user: any): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['department', 'assignments', 'assignments.admin'],
    });

    if (!ticket) {
      throw new NotFoundException('تیکت مورد نظر یافت نشد');
    }

    // بررسی دسترسی بر اساس نقش
    if (user.role === 'admin_support') {
      const assigned = ticket.assignments.find(
        a => a.unassignedAt === null && a.adminId === user.id,
      );
      if (!assigned) {
        throw new ForbiddenException('شما به این تیکت دسترسی ندارید');
      }
    } else if (user.role === 'admin_finance') {
      const deptIds = await this.getAdminDepartmentIds(user.id);
      if (!deptIds.includes(ticket.departmentId)) {
        throw new ForbiddenException('شما به این تیکت دسترسی ندارید');
      }
    }

    return ticket;
  }
    // ========== عملیات اصلی ==========

  async findAll(query: any, user: any): Promise<{ data: ITicketResponse[]; total: number }> {
    const {
      status,
      priority,
      departmentId,
      customerId,
      from,
      to,
      search,
      limit = 100,
      offset = 0,
    } = query;

    const queryBuilder = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.department', 'department')
      .leftJoinAndSelect('ticket.assignments', 'assignments')
      .leftJoinAndSelect('assignments.admin', 'admin');

    // فیلترهای عمومی
    if (status) {
      queryBuilder.andWhere('ticket.status = :status', { status });
    }
    if (priority) {
      queryBuilder.andWhere('ticket.priority = :priority', { priority });
    }
    if (departmentId) {
      queryBuilder.andWhere('ticket.departmentId = :departmentId', { departmentId });
    }
    if (customerId) {
      queryBuilder.andWhere('ticket.customerId = :customerId', { customerId });
    }
    if (search) {
      queryBuilder.andWhere(
        '(ticket.title ILIKE :search OR ticket.description ILIKE :search OR ticket.customerName ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (from && to) {
      queryBuilder.andWhere('ticket.createdAt BETWEEN :from AND :to', {
        from: new Date(from),
        to: new Date(to),
      });
    } else if (from) {
      queryBuilder.andWhere('ticket.createdAt >= :from', { from: new Date(from) });
    } else if (to) {
      queryBuilder.andWhere('ticket.createdAt <= :to', { to: new Date(to) });
    }

    // محدودیت بر اساس نقش
    if (user.role === 'admin_support') {
      const assignments = await this.assignmentRepository.find({
        where: {
          adminId: user.id,
          unassignedAt: IsNull(),
        },
      });
      const ticketIds = assignments.map(a => a.ticketId);
      if (ticketIds.length === 0) {
        return { data: [], total: 0 };
      }
      queryBuilder.andWhere('ticket.id IN (:...ticketIds)', { ticketIds });
    } else if (user.role === 'admin_finance') {
      const deptIds = await this.getAdminDepartmentIds(user.id);
      if (deptIds.length === 0) {
        return { data: [], total: 0 };
      }
      queryBuilder.andWhere('ticket.departmentId IN (:...deptIds)', { deptIds });
    }

    queryBuilder.orderBy('ticket.createdAt', 'DESC');
    queryBuilder.skip(offset).take(limit);

    const [tickets, total] = await queryBuilder.getManyAndCount();

    const data = tickets.map(ticket => this.mapToResponse(ticket));
    return { data, total };
  }

  async findOne(id: number, user: any): Promise<ITicketWithMessages> {
    const ticket = await this.checkTicketAccess(id, user);

    const messages = await this.messageRepository.find({
      where: { ticketId: id },
      order: { createdAt: 'ASC' },
    });

    return this.mapToDetailResponse(ticket, messages);
  }

  async create(createTicketDto: CreateTicketDto, creatorId?: number): Promise<ITicketResponse> {
    const {
      departmentId,
      title,
      description,
      customerId,
      customerName,
      customerEmail,
      priority,
    } = createTicketDto;

    // بررسی وجود دپارتمان
    const department = await this.departmentRepository.findOne({
      where: { id: departmentId },
    });
    if (!department) {
      throw new BadRequestException('دپارتمان انتخاب شده معتبر نیست');
    }

    // ایجاد تیکت جدید
    const ticket = this.ticketRepository.create({
      title,
      description,
      departmentId,
      customerId,
      customerName,
      customerEmail,
      priority: priority || 'medium',
      status: 'new',
      createdBy: creatorId?.toString(),
    });

    const savedTicket = await this.ticketRepository.save(ticket);

    // انتساب خودکار به ادمین با کمترین بار کاری
    const adminId = await this.findLeastBusyAdminInDepartment(departmentId);
    if (adminId) {
      const assignment = this.assignmentRepository.create({
        ticketId: savedTicket.id,
        adminId,
      });
      await this.assignmentRepository.save(assignment);
    }

    return this.mapToResponse(savedTicket);
  }

  async update(
    id: number,
    updateTicketDto: UpdateTicketDto,
    user: any,
  ): Promise<ITicketResponse> {
    const ticket = await this.checkTicketAccess(id, user);

    const updateData: Partial<Ticket> = {};
    if (updateTicketDto.title) updateData.title = updateTicketDto.title;
    if (updateTicketDto.description) updateData.description = updateTicketDto.description;
    if (updateTicketDto.priority) updateData.priority = updateTicketDto.priority;
    if (updateTicketDto.departmentId) {
      // بررسی وجود دپارتمان جدید
      const department = await this.departmentRepository.findOne({
        where: { id: updateTicketDto.departmentId },
      });
      if (!department) {
        throw new BadRequestException('دپارتمان انتخاب شده معتبر نیست');
      }
      updateData.departmentId = updateTicketDto.departmentId;
    }

    await this.ticketRepository.update(id, updateData);

    const updatedTicket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['department'],
    });

    return this.mapToResponse(updatedTicket);
  }

  async updateStatus(id: number, status: string, user: any): Promise<ITicketResponse> {
    const ticket = await this.checkTicketAccess(id, user);

    const validStatuses = ['new', 'in_progress', 'closed', 'expired', 'archived'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('وضعیت نامعتبر است');
    }

    await this.ticketRepository.update(id, { status });

    const updatedTicket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['department'],
    });

    return this.mapToResponse(updatedTicket);
  }

  async updatePriority(id: number, priority: string, user: any): Promise<ITicketResponse> {
    const ticket = await this.checkTicketAccess(id, user);

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      throw new BadRequestException('اولویت نامعتبر است');
    }

    await this.ticketRepository.update(id, { priority });

    const updatedTicket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['department'],
    });

    return this.mapToResponse(updatedTicket);
  }

  async assignTicket(id: number, adminId: number, user: any): Promise<{ message: string }> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('تیکت مورد نظر یافت نشد');
    }

    // بررسی وجود ادمین
    const admin = await this.adminRepository.findOne({
      where: { id: adminId, isActive: true },
    });
    if (!admin) {
      throw new BadRequestException('ادمین انتخاب شده معتبر نیست');
    }

    // بستن انتساب قبلی
    await this.assignmentRepository.update(
      { ticketId: id, unassignedAt: IsNull() },
      { unassignedAt: new Date() },
    );

    // ایجاد انتساب جدید
    const assignment = this.assignmentRepository.create({
      ticketId: id,
      adminId,
    });
    await this.assignmentRepository.save(assignment);

    // تغییر وضعیت تیکت به در حال بررسی
    if (ticket.status === 'new') {
      await this.ticketRepository.update(id, { status: 'in_progress' });
    }

    return { message: 'تیکت با موفقیت به ادمین منتخب اختصاص یافت' };
  }

  async closeTicket(id: number, user: any): Promise<{ message: string }> {
    const ticket = await this.checkTicketAccess(id, user);

    if (ticket.status === 'closed') {
      throw new BadRequestException('تیکت قبلاً بسته شده است');
    }

    await this.ticketRepository.update(id, {
      status: 'closed',
      closedAt: new Date(),
      closedBy: user.id,
    });

    // بستن انتساب فعلی
    await this.assignmentRepository.update(
      { ticketId: id, unassignedAt: IsNull() },
      { unassignedAt: new Date() },
    );

    return { message: 'تیکت با موفقیت بسته شد' };
  }

  async reopenTicket(id: number, user: any): Promise<ITicketResponse> {
    const ticket = await this.checkTicketAccess(id, user);

    if (ticket.status !== 'closed') {
      throw new BadRequestException('فقط تیکت‌های بسته شده را می‌توان دوباره باز کرد');
    }

    await this.ticketRepository.update(id, {
      status: 'in_progress',
      closedAt: undefined,
      closedBy: undefined,
    });

    const updatedTicket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['department'],
    });

    return this.mapToResponse(updatedTicket);
  }

  async remove(id: number): Promise<{ message: string }> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('تیکت مورد نظر یافت نشد');
    }

    // حذف فیزیکی (یا می‌تونی soft delete استفاده کنی)
    await this.ticketRepository.delete(id);

    return { message: 'تیکت با موفقیت حذف شد' };
  }
    // ========== مدیریت پیام‌ها ==========

  async addMessage(
    ticketId: number,
    addMessageDto: AddMessageDto,
    user: any,
  ): Promise<TicketMessage> {
    await this.checkTicketAccess(ticketId, user);

    const message = this.messageRepository.create({
      ticketId,
      senderType: 'admin',
      senderId: user.id.toString(),
      message: addMessageDto.message,
    });

    const savedMessage = await this.messageRepository.save(message);

    // اگر تیکت جدید بود، وضعیت رو به در حال بررسی تغییر بده
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
    });
    if (ticket?.status === 'new') {
      await this.ticketRepository.update(ticketId, { status: 'in_progress' });
    }

    return savedMessage;
  }

  async getMessages(ticketId: number, user: any): Promise<TicketMessage[]> {
    await this.checkTicketAccess(ticketId, user);

    return this.messageRepository.find({
      where: { ticketId },
      order: { createdAt: 'ASC' },
    });
  }

  // ========== مدیریت دپارتمان‌ها ==========

  async getAllDepartments(): Promise<TicketDepartment[]> {
    return this.departmentRepository.find({
      order: { name: 'ASC' },
    });
  }

  async transferDepartment(ticketId: number, departmentId: number, user: any): Promise<ITicketResponse> {
    const ticket = await this.checkTicketAccess(ticketId, user);

    // بررسی وجود دپارتمان جدید
    const newDepartment = await this.departmentRepository.findOne({
      where: { id: departmentId },
    });
    if (!newDepartment) {
      throw new BadRequestException('دپارتمان انتخاب شده معتبر نیست');
    }

    // انتقال تیکت به دپارتمان جدید
    await this.ticketRepository.update(ticketId, { departmentId });

    // بستن انتساب فعلی
    await this.assignmentRepository.update(
      { ticketId, unassignedAt: IsNull() },
      { unassignedAt: new Date() },
    );

    // انتساب خودکار به ادمین جدید در دپارتمان جدید
    const newAdminId = await this.findLeastBusyAdminInDepartment(departmentId);
    if (newAdminId) {
      const assignment = this.assignmentRepository.create({
        ticketId,
        adminId: newAdminId,
      });
      await this.assignmentRepository.save(assignment);
    }

    const updatedTicket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['department'],
    });

    return this.mapToResponse(updatedTicket);
  }

  // ========== آمار ==========

  async getStats(user: any): Promise<ITicketStats> {
    const queryBuilder = this.ticketRepository.createQueryBuilder('ticket');

    // اعمال محدودیت بر اساس نقش
    if (user.role === 'admin_support') {
      const assignments = await this.assignmentRepository.find({
        where: {
          adminId: user.id,
          unassignedAt: IsNull(),
        },
      });
      const ticketIds = assignments.map(a => a.ticketId);
      queryBuilder.where('ticket.id IN (:...ticketIds)', { ticketIds });
    } else if (user.role === 'admin_finance') {
      const deptIds = await this.getAdminDepartmentIds(user.id);
      queryBuilder.where('ticket.departmentId IN (:...deptIds)', { deptIds });
    }

    // آمار وضعیت‌ها
    const statusStats = await queryBuilder
      .clone()
      .select('ticket.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ticket.status')
      .getRawMany();

    // آمار اولویت‌ها
    const priorityStats = await queryBuilder
      .clone()
      .select('ticket.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ticket.priority')
      .getRawMany();

    // آمار روزانه
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const dailyStats = await queryBuilder
      .clone()
      .select('DATE(ticket.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('ticket.createdAt >= :lastWeek', { lastWeek })
      .groupBy('DATE(ticket.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    // میانگین زمان پاسخ (به ساعت)
    const avgResponseTime = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .innerJoin(Ticket, 'ticket', 'ticket.id = assignment.ticketId')
      .select('AVG(EXTRACT(EPOCH FROM (assignment.assignedAt - ticket.createdAt))/3600)', 'avg')
      .where('ticket.status != :status', { status: 'new' })
      .getRawOne();

    return {
      total: await queryBuilder.getCount(),
      byStatus: statusStats.reduce((acc, curr) => {
        acc[curr.status] = parseInt(curr.count);
        return acc;
      }, {}),
      byPriority: priorityStats.reduce((acc, curr) => {
        acc[curr.priority] = parseInt(curr.count);
        return acc;
      }, {}),
      daily: dailyStats.map(d => ({
        date: d.date,
        count: parseInt(d.count),
      })),
      avgResponseTime: parseFloat(avgResponseTime?.avg || 0).toFixed(1),
    };
  }

  // ========== توابع تبدیل ==========

  private mapToResponse(ticket: any): ITicketResponse {
    const currentAssignment = ticket.assignments?.find(a => !a.unassignedAt);

    return {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      departmentId: ticket.departmentId,
      departmentName: ticket.department?.name,
      status: ticket.status,
      priority: ticket.priority,
      customerId: ticket.customerId,
      customerName: ticket.customerName,
      customerEmail: ticket.customerEmail,
      assignedTo: currentAssignment?.adminId,
      assignedToName: currentAssignment?.admin?.name,
      createdBy: ticket.createdBy,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      closedAt: ticket.closedAt,
      closedBy: ticket.closedBy,
    };
  }

  private mapToDetailResponse(ticket: any, messages: TicketMessage[]): ITicketWithMessages {
    const base = this.mapToResponse(ticket);
    return {
      ...base,
      messages: messages.map(msg => ({
        id: msg.id,
        senderType: msg.senderType,
        senderId: msg.senderId,
        message: msg.message,
        createdAt: msg.createdAt,
      })),
    };
  }
}