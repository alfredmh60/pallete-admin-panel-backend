import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { SellerAuthService } from '../seller-auth.service';
import { SellerTokenSession } from '../../entities/seller-token-session.entity';

describe('SellerAuthService', () => {
  let service: SellerAuthService;

  const sessionsRepo = {
    findOne: jest.fn(),
    save: jest.fn(async (v) => v),
    create: jest.fn((v) => v),
    delete: jest.fn(),
  };

  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'CORE_BACKEND_URL') return 'http://localhost:9050';
      if (key === 'ADMIN_PANEL_SERVICE_API_KEY') return 'test-service-key';
      return undefined;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerAuthService,
        { provide: ConfigService, useValue: configService },
        { provide: getRepositoryToken(SellerTokenSession), useValue: sessionsRepo },
      ],
    }).compile();

    service = module.get(SellerAuthService);
  });

  it('rejects missing bearer token', async () => {
    await expect(service.validateBearerToken(undefined)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('returns cached seller when session is still valid without rewriting lastUsedAt every time', async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    sessionsRepo.findOne.mockResolvedValue({
      id: 1,
      tokenHash: service.hashToken('abc'),
      userId: 7,
      phone: '09121111111',
      name: 'Cached',
      lastName: null,
      language: 'fa',
      expiresAt,
      lastUsedAt: new Date(), // freshly used — should not save again
    });

    const result = await service.validateBearerToken('Bearer abc');

    expect(result.userId).toBe(7);
    expect(result.phone).toBe('09121111111');
    expect(sessionsRepo.save).not.toHaveBeenCalled();
  });

  it('updates lastUsedAt when cached session is stale', async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    sessionsRepo.findOne.mockResolvedValue({
      id: 1,
      tokenHash: service.hashToken('abc'),
      userId: 7,
      phone: '09121111111',
      name: 'Cached',
      lastName: null,
      language: 'fa',
      expiresAt,
      lastUsedAt: new Date(Date.now() - 11 * 60 * 1000),
    });

    await service.validateBearerToken('Bearer abc');
    expect(sessionsRepo.save).toHaveBeenCalled();
  });
  it('validates with core and caches session when no cache hit', async () => {
    sessionsRepo.findOne.mockResolvedValue(null);
    const expiresAt = new Date(Date.now() + 120_000).toISOString();

    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        valid: true,
        userId: 11,
        expiresAt,
        phone: '09122222222',
        name: 'New',
        lastName: 'Seller',
        language: 'fa',
      }),
    }) as unknown as typeof fetch;

    const result = await service.validateBearerToken('Bearer fresh-token');

    expect(result.userId).toBe(11);
    expect(result.name).toBe('New Seller');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:9050/internal/admin-panel/validate-seller-token',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-Service-Key': 'test-service-key',
        }),
      }),
    );
    expect(sessionsRepo.save).toHaveBeenCalled();
  });

  it('maps core 401 to UnauthorizedException', async () => {
    sessionsRepo.findOne.mockResolvedValue(null);
    global.fetch = jest.fn().mockResolvedValue({
      status: 401,
      ok: false,
    }) as unknown as typeof fetch;

    await expect(service.validateBearerToken('Bearer bad')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('maps core network failure to ServiceUnavailableException', async () => {
    sessionsRepo.findOne.mockResolvedValue(null);
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED')) as unknown as typeof fetch;

    await expect(service.validateBearerToken('Bearer x')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
