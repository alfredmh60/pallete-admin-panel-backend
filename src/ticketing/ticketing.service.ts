import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { TicketAnswer } from '../entities/ticket-answer.entity';
import { TicketAssignment } from '../entities/ticket-assignment.entity';
import { Admins } from '../entities/admins.entity';
import { ValidatedSeller } from './seller-auth.service';
import {
  AnswerSellerTicketDto,
  AssignTicketDto,
  CreateSellerTicketDto,
  StaffInternalNoteDto,
  StaffReplyDto,
} from './dto/ticketing.dto';

type StaffActor = { id: number; name?: string | null };

@Injectable()
export class TicketingService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepo: Repository<Ticket>,
    @InjectRepository(TicketAnswer)
    private readonly answersRepo: Repository<TicketAnswer>,
    @InjectRepository(TicketAssignment)
    private readonly assignmentsRepo: Repository<TicketAssignment>,
    @InjectRepository(Admins)
    private readonly adminsRepo: Repository<Admins>,
  ) {}

  // ─── Seller ─────────────────────────────────────────────────────────────

  async listSellerTickets(seller: ValidatedSeller, page = 1, pageSize = 10) {
    const safePage = Math.max(1, page);
    const safeSize = Math.min(100, Math.max(1, pageSize));

    const [rows, total] = await this.ticketsRepo.findAndCount({
      where: { userId: seller.userId },
      order: { createdAt: 'DESC' },
      skip: (safePage - 1) * safeSize,
      take: safeSize,
    });

    return {
      success: true,
      data: rows.map((ticket) => this.toSellerListItem(ticket)),
      metadata: {
        pagination: {
          pageNumber: safePage,
          pageSize: safeSize,
          totalRecords: total,
        },
        unreadCount: await this.countSellerUnread(seller.userId),
      },
      message: 'OK',
    };
  }

  async getSellerTicket(seller: ValidatedSeller, id: number) {
    const ticket = await this.findSellerTicketOrFail(seller.userId, id);
    const answers = await this.answersRepo.find({
      where: { ticketId: ticket.id },
      order: { createdAt: 'ASC' },
    });

    // Only advance read cursor when there is something new — avoids write-on-every-poll.
    if (this.isUnreadForSeller(ticket)) {
      ticket.sellerLastSeenAt = new Date();
      await this.ticketsRepo.save(ticket);
    }

    const publicAnswers = answers
      .filter((a) => a.side !== 'internal')
      .map((a) => this.toSellerAnswer(a));

    return {
      success: true,
      data: {
        ...this.toSellerListItem(ticket),
        answers: publicAnswers,
      },
      message: 'OK',
    };
  }

  async createSellerTicket(seller: ValidatedSeller, dto: CreateSellerTicketDto) {
    const now = new Date();
    const assignee = await this.pickAutoAssignee();

    const ticket = this.ticketsRepo.create({
      userId: seller.userId,
      subject: dto.subject,
      status: 'open',
      title: dto.title.trim(),
      description: dto.description.trim(),
      fileUrl: dto.fileUrl ?? null,
      fileMimeType: dto.fileMimeType ?? null,
      sellerPhone: seller.phone,
      sellerName: seller.name,
      assignedAdminId: assignee?.id ?? null,
      assignedAdminName: assignee?.name ?? null,
      lastMessageAt: now,
      lastMessageSide: 'user',
      sellerLastSeenAt: now,
    });

    const saved = await this.ticketsRepo.save(ticket);

    if (assignee) {
      await this.assignmentsRepo.save(
        this.assignmentsRepo.create({
          ticketId: saved.id,
          adminId: assignee.id,
          adminName: assignee.name ?? null,
          assignedAt: now,
          assignedByAdminId: null,
        }),
      );
    }

    return {
      success: true,
      data: {},
      message: 'OK',
    };
  }

  async answerSellerTicket(
    seller: ValidatedSeller,
    id: number,
    dto: AnswerSellerTicketDto,
  ) {
    const ticket = await this.findSellerTicketOrFail(seller.userId, id);
    if (ticket.status === 'closed') {
      throw new BadRequestException('Ticket is closed');
    }

    const now = new Date();
    await this.answersRepo.save(
      this.answersRepo.create({
        ticketId: ticket.id,
        side: 'user',
        message: dto.message.trim(),
        fileUrl: dto.fileUrl ?? null,
        fileMimeType: dto.fileMimeType ?? null,
      }),
    );

    ticket.lastMessageAt = now;
    ticket.lastMessageSide = 'user';
    ticket.sellerLastSeenAt = now;
    ticket.updatedAt = now;
    await this.ticketsRepo.save(ticket);

    return { success: true, data: {}, message: 'OK' };
  }

  async closeSellerTicket(seller: ValidatedSeller, id: number) {
    const ticket = await this.findSellerTicketOrFail(seller.userId, id);
    ticket.status = 'closed';
    ticket.closedAt = new Date();
    await this.ticketsRepo.save(ticket);
    return { success: true, data: {}, message: 'OK' };
  }

  async reopenSellerTicket(seller: ValidatedSeller, id: number) {
    const ticket = await this.findSellerTicketOrFail(seller.userId, id);
    ticket.status = 'open';
    ticket.closedAt = null;
    ticket.closedByAdminId = null;
    await this.ticketsRepo.save(ticket);
    return { success: true, data: {}, message: 'OK' };
  }

  async getSellerUnreadCount(seller: ValidatedSeller) {
    const unreadCount = await this.countSellerUnread(seller.userId);

    return {
      success: true,
      data: { unreadCount },
      message: 'OK',
    };
  }

  // ─── Staff ──────────────────────────────────────────────────────────────

  async listStaffTickets(query: {
    page?: number;
    limit?: number;
    status?: string;
    assignedAdminId?: number;
    search?: string;
  }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));

    const qb = this.ticketsRepo.createQueryBuilder('ticket').orderBy('ticket.updatedAt', 'DESC');

    if (query.status) {
      qb.andWhere('ticket.status = :status', { status: query.status });
    }
    if (query.assignedAdminId === 0) {
      qb.andWhere('ticket.assignedAdminId IS NULL');
    } else if (query.assignedAdminId) {
      qb.andWhere('ticket.assignedAdminId = :assignedAdminId', {
        assignedAdminId: query.assignedAdminId,
      });
    }
    if (query.search) {
      qb.andWhere(
        '(ticket.title ILIKE :q OR ticket.description ILIKE :q OR ticket.sellerPhone ILIKE :q OR ticket.sellerName ILIKE :q)',
        { q: `%${query.search}%` },
      );
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async getStaffTicket(id: number) {
    const ticket = await this.ticketsRepo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const answers = await this.answersRepo.find({
      where: { ticketId: id },
      order: { createdAt: 'ASC' },
    });

    return { ticket, answers };
  }

  async staffReply(admin: StaffActor, id: number, dto: StaffReplyDto) {
    const ticket = await this.ticketsRepo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.status === 'closed') {
      throw new BadRequestException('Ticket is closed');
    }

    const actorAdmin = await this.resolveAdmin(admin);
    const now = new Date();
    const answer = await this.answersRepo.save(
      this.answersRepo.create({
        ticketId: id,
        side: 'admin',
        message: dto.message.trim(),
        fileUrl: dto.fileUrl ?? null,
        fileMimeType: dto.fileMimeType ?? null,
        senderAdminId: actorAdmin.id,
        senderAdminName: actorAdmin.name ?? null,
      }),
    );

    if (!ticket.assignedAdminId) {
      await this.assignTicket(actorAdmin, id, { adminId: actorAdmin.id }, true);
    }

    ticket.lastMessageAt = now;
    ticket.lastMessageSide = 'admin';
    ticket.updatedAt = now;
    await this.ticketsRepo.save(ticket);

    return answer;
  }

  async addInternalNote(admin: StaffActor, id: number, dto: StaffInternalNoteDto) {
    const ticket = await this.ticketsRepo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const actorAdmin = await this.resolveAdmin(admin);
    return this.answersRepo.save(
      this.answersRepo.create({
        ticketId: id,
        side: 'internal',
        message: dto.message.trim(),
        senderAdminId: actorAdmin.id,
        senderAdminName: actorAdmin.name ?? null,
      }),
    );
  }

  async closeTicket(admin: StaffActor, id: number) {
    const ticket = await this.ticketsRepo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    ticket.status = 'closed';
    ticket.closedAt = new Date();
    ticket.closedByAdminId = admin.id;
    await this.ticketsRepo.save(ticket);
    return ticket;
  }

  async reopenTicket(_admin: StaffActor, id: number) {
    const ticket = await this.ticketsRepo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    ticket.status = 'open';
    ticket.closedAt = null;
    ticket.closedByAdminId = null;
    await this.ticketsRepo.save(ticket);
    return ticket;
  }

  async assignTicket(
    actor: StaffActor,
    id: number,
    dto: AssignTicketDto,
    silent = false,
  ) {
    const ticket = await this.ticketsRepo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const now = new Date();
    await this.assignmentsRepo.update(
      { ticketId: id, unassignedAt: IsNull() },
      { unassignedAt: now },
    );

    if (dto.adminId == null) {
      ticket.assignedAdminId = null;
      ticket.assignedAdminName = null;
      await this.ticketsRepo.save(ticket);
      return ticket;
    }

    const target = await this.adminsRepo.findOne({
      where: { id: dto.adminId, isActive: true },
    });
    if (!target) {
      if (silent) return ticket;
      throw new BadRequestException('Admin not found');
    }

    await this.assignmentsRepo.save(
      this.assignmentsRepo.create({
        ticketId: id,
        adminId: target.id,
        adminName: target.name ?? null,
        assignedAt: now,
        assignedByAdminId: actor.id,
      }),
    );

    ticket.assignedAdminId = target.id;
    ticket.assignedAdminName = target.name ?? null;
    await this.ticketsRepo.save(ticket);
    return ticket;
  }

  async getStats() {
    const [total, open, closed, unassigned] = await Promise.all([
      this.ticketsRepo.count(),
      this.ticketsRepo.count({ where: { status: 'open' } }),
      this.ticketsRepo.count({ where: { status: 'closed' } }),
      this.ticketsRepo.count({ where: { assignedAdminId: IsNull(), status: 'open' } }),
    ]);

    return { total, open, closed, unassigned };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  private async countSellerUnread(userId: number): Promise<number> {
    return this.ticketsRepo
      .createQueryBuilder('ticket')
      .where('ticket.user_id = :userId', { userId })
      .andWhere("ticket.last_message_side = 'admin'")
      .andWhere('ticket.last_message_at IS NOT NULL')
      .andWhere(
        '(ticket.seller_last_seen_at IS NULL OR ticket.last_message_at > ticket.seller_last_seen_at)',
      )
      .getCount();
  }

  private async resolveAdmin(actor: StaffActor): Promise<Admins> {
    const admin = await this.adminsRepo.findOne({ where: { id: actor.id } });
    if (!admin) throw new BadRequestException('Admin not found');
    return admin;
  }

  private async findSellerTicketOrFail(userId: number, id: number) {
    const ticket = await this.ticketsRepo.findOne({ where: { id, userId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  private async pickAutoAssignee(): Promise<Admins | null> {
    const rows: Array<Admins & { open_count?: string | number }> =
      await this.adminsRepo.manager.query(
        `
        SELECT a.*, COALESCE(c.open_count, 0)::int AS open_count
        FROM admins a
        LEFT JOIN (
          SELECT assigned_admin_id, COUNT(*)::int AS open_count
          FROM tickets
          WHERE status = 'open' AND assigned_admin_id IS NOT NULL
          GROUP BY assigned_admin_id
        ) c ON c.assigned_admin_id = a.id
        WHERE a.is_active = true AND a.deleted_at IS NULL
        ORDER BY open_count ASC, a.id ASC
        LIMIT 1
        `,
      );

    if (!rows.length) return null;
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      isActive: row.is_active ?? row.isActive,
    } as Admins;
  }

  private isUnreadForSeller(ticket: Pick<Ticket, 'lastMessageAt' | 'lastMessageSide' | 'sellerLastSeenAt'>) {
    if (ticket.lastMessageSide !== 'admin' || !ticket.lastMessageAt) return false;
    if (!ticket.sellerLastSeenAt) return true;
    return ticket.lastMessageAt > ticket.sellerLastSeenAt;
  }

  private toSellerListItem(ticket: Ticket) {
    return {
      id: String(ticket.id),
      createdAt: ticket.createdAt.toISOString(),
      title: ticket.title,
      subject: ticket.subject,
      description: ticket.description,
      fileUrl: ticket.fileUrl ?? undefined,
      fileMimeType: ticket.fileMimeType ?? undefined,
      status: ticket.status === 'closed' ? 'close' : 'open',
      unread: this.isUnreadForSeller(ticket),
      answers: [] as unknown[],
    };
  }

  private toSellerAnswer(answer: TicketAnswer) {
    return {
      id: String(answer.id),
      side: answer.side === 'admin' ? 'admin' : 'user',
      message: answer.message,
      fileUrl: answer.fileUrl ?? undefined,
      fileMimeType: answer.fileMimeType ?? undefined,
      createdAt: answer.createdAt.toISOString(),
    };
  }
}
