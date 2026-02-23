import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { AuthService } from '../auth.service';
import { Admins } from '../../entities/admins.entity';
import { Role } from '../../entities/role.entity';
import { EmailService } from 'src/email/email.service';


describe('AuthService', () => {
  let service: AuthService;
  let adminRepository: Repository<Admins>;

  const mockAdmin = {
    id: 1,
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    isActive: true,
    roleId: 1,
    role: { name: 'admin' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Admins),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockAdmin),
            update: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: getRepositoryToken(Role),
          useValue: {
            findOne: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendResetEmail: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    adminRepository = module.get<Repository<Admins>>(getRepositoryToken(Admins));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return token and user data', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.login({
        email: 'manager@example.com',
        password: 'Manager@123456',
      });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('manager@example.com');
    });
  });
});