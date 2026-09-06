import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TicketingService } from '../ticketing.service';
import { Ticket } from '../../entities/ticket.entity';
import { TicketAnswer } from '../../entities/ticket-answer.entity';
import { TicketAssignment } from '../../entities/ticket-assignment.entity';
import { Admins } from '../../entities/admins.entity';
import { ValidatedSeller } from '../seller-auth.service';

describe('TicketingService', () => {
  let service: TicketingService;

  const seller: ValidatedSeller = {
    userId: 10,
    phone: '09120000000',
    name: 'Seller',
    lastName: null,
    language: 'fa',
    expiresAt: new Date(Date.now() + 60_000),
  };

  const ticketsRepo = {
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => ({ id: 1, ...v })),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
    manager: {
      query: jest.fn(),
    },
  };

  const answersRepo = {
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => ({ id: 5, ...v })),
    find: jest.fn(),
  };

  const assignmentsRepo = {
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => v),
  };

  const adminsRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    manager: {
      query: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    ticketsRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    });
    adminsRepo.manager.query.mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketingService,
        { provide: getRepositoryToken(Ticket), useValue: ticketsRepo },
        { provide: getRepositoryToken(TicketAnswer), useValue: answersRepo },
        { provide: getRepositoryToken(TicketAssignment), useValue: assignmentsRepo },
        { provide: getRepositoryToken(Admins), useValue: adminsRepo },
      ],
    }).compile();

    service = module.get(TicketingService);
  });

  it('creates seller ticket with attachment metadata and auto-assigns least-loaded admin', async () => {
    adminsRepo.manager.query.mockResolvedValue([
      { id: 3, name: 'Admin B', is_active: true },
    ]);

    const result = await service.createSellerTicket(seller, {
      subject: 'support',
      title: 'Need help',
      description: 'Details here',
      fileUrl: '/images/x.webp',
      fileMimeType: 'image/webp',
    });

    expect(result.success).toBe(true);
    expect(ticketsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 10,
        subject: 'support',
        title: 'Need help',
        description: 'Details here',
        fileUrl: '/images/x.webp',
        fileMimeType: 'image/webp',
        assignedAdminId: 3,
        assignedAdminName: 'Admin B',
        status: 'open',
      }),
    );
    expect(assignmentsRepo.save).toHaveBeenCalled();
  });

  it('lists seller tickets for the authenticated user', async () => {
    const createdAt = new Date('2026-09-01T10:00:00Z');
    ticketsRepo.findAndCount.mockResolvedValue([
      [
        {
          id: 9,
          createdAt,
          title: 'T1',
          subject: 'support',
          description: 'D',
          status: 'open',
          fileUrl: null,
          fileMimeType: null,
          lastMessageAt: createdAt,
          lastMessageSide: 'user',
          sellerLastSeenAt: createdAt,
        },
      ],
      1,
    ]);

    const result = await service.listSellerTickets(seller, 1, 10);

    expect(ticketsRepo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 10 } }),
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('9');
    expect(result.metadata.pagination.totalRecords).toBe(1);
  });

  it('answers open ticket with attachment metadata', async () => {
    ticketsRepo.findOne.mockResolvedValue({
      id: 9,
      userId: 10,
      status: 'open',
    });

    await service.answerSellerTicket(seller, 9, {
      message: 'Follow up',
      fileUrl: '/files/a.pdf',
      fileMimeType: 'application/pdf',
    });

    expect(answersRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ticketId: 9,
        side: 'user',
        message: 'Follow up',
        fileUrl: '/files/a.pdf',
        fileMimeType: 'application/pdf',
      }),
    );
    expect(ticketsRepo.save).toHaveBeenCalled();
  });

  it('rejects answering a closed ticket', async () => {
    ticketsRepo.findOne.mockResolvedValue({
      id: 9,
      userId: 10,
      status: 'closed',
    });

    await expect(
      service.answerSellerTicket(seller, 9, { message: 'Nope' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('closes ticket as staff', async () => {
    const ticket = { id: 4, status: 'open' };
    ticketsRepo.findOne.mockResolvedValue(ticket);

    const result = await service.closeTicket({ id: 1, name: 'Admin' }, 4);

    expect(result.status).toBe('closed');
    expect(result.closedByAdminId).toBe(1);
    expect(ticketsRepo.save).toHaveBeenCalledWith(ticket);
  });

  it('throws when staff ticket is missing', async () => {
    ticketsRepo.findOne.mockResolvedValue(null);
    await expect(service.getStaffTicket(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('counts unread seller tickets with a SQL count query', async () => {
    const getCount = jest.fn().mockResolvedValue(1);
    ticketsRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount,
    });

    const result = await service.getSellerUnreadCount(seller);
    expect(result.data.unreadCount).toBe(1);
    expect(getCount).toHaveBeenCalled();
  });
});