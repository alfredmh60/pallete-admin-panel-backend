import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { AdminsService } from '../admins.service';
import { Admins } from '../../entities/admin.entity';
// import { Role } from '../../entities/role.entity';
// import { AdminDepartment } from '../../entities/admin-department.entity';
// import { EmailService } from '../../email/email.service';

describe('AdminsService', () => {
  let service: AdminsService;
  let adminRepository: Repository<Admins>;

  const mockAdmin = {
    id: 1,
    email: 'test@example.com',
    name: 'Test Admin',
    passwordHash: 'hashedPassword',
    isActive: true,
    roleId: 1,
    role: { id: 1, name: 'admin' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminsService,
        {
          provide: getRepositoryToken(Admins),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockAdmin),
            find: jest.fn().mockResolvedValue([mockAdmin]),
            create: jest.fn().mockReturnValue(mockAdmin),
            save: jest.fn().mockResolvedValue(mockAdmin),
            update: jest.fn().mockResolvedValue({ affected: 1 }),
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn().mockResolvedValue([[mockAdmin], 1]),
            })),
          },
        },
        //{
        //   provide: getRepositoryToken(Role),
        //   useValue: {
        //     findOne: jest.fn().mockResolvedValue({ id: 1, name: 'admin' }),
        //   },
        // },
        // {
        //   provide: getRepositoryToken(AdminDepartment),
        //   useValue: {
        //     find: jest.fn().mockResolvedValue([]),
        //     delete: jest.fn().mockResolvedValue({}),
        //     create: jest.fn().mockReturnValue({}),
        //     save: jest.fn().mockResolvedValue({}),
        //   },
        // },
        // {
        //   provide: EmailService,
        //   useValue: {
        //     sendPasswordEmail: jest.fn().mockResolvedValue(true),
        //   },
        // },
      ],
    }).compile();

    service = module.get<AdminsService>(AdminsService);
    adminRepository = module.get<Repository<Admins>>(getRepositoryToken(Admins));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list of admins', async () => {
      const result = await service.findAll({}, { role: 'manager' });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  // describe('findOne', () => {
  //   it('should return a single admin', async () => {
  //     const result = await service.findOne(1, {}, { role: 'manager' });
  //     expect(result.id).toBe(1);
  //     expect(result.email).toBe('test@example.com');
  //   });
  // });

  // describe('create', () => {
  //   it('should create a new admin', async () => {
  //     const createDto = {
  //       email: 'new@example.com',
  //       name: 'New Admin',
  //       roleId: 1,
  //     };
  //     const result = await service.create(createDto, 1);
  //     expect(result).toBeDefined();
  //   });
  // });
});