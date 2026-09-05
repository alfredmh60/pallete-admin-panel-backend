import { createHash } from 'crypto';
import {
  Injectable,
  UnauthorizedException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { SellerTokenSession } from '../entities/seller-token-session.entity';

export interface ValidatedSeller {
  userId: number;
  phone: string | null;
  name: string | null;
  lastName: string | null;
  language: string | null;
  expiresAt: Date;
}

interface CoreValidateSuccess {
  valid: true;
  userId: number;
  expiresAt: string;
  role?: string;
  phone?: string | null;
  name?: string | null;
  lastName?: string | null;
  language?: string | null;
}

@Injectable()
export class SellerAuthService {
  private readonly logger = new Logger(SellerAuthService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(SellerTokenSession)
    private readonly sessionsRepo: Repository<SellerTokenSession>,
  ) {}

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async validateBearerToken(authorization?: string): Promise<ValidatedSeller> {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing seller token');
    }

    const token = authorization.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Missing seller token');
    }

    const tokenHash = this.hashToken(token);
    const now = new Date();

    const cached = await this.sessionsRepo.findOne({ where: { tokenHash } });
    if (cached && cached.expiresAt > now) {
      cached.lastUsedAt = now;
      await this.sessionsRepo.save(cached);
      return {
        userId: cached.userId,
        phone: cached.phone,
        name: cached.name,
        lastName: cached.lastName,
        language: cached.language,
        expiresAt: cached.expiresAt,
      };
    }

    if (cached) {
      await this.sessionsRepo.delete({ id: cached.id });
    }

    const validated = await this.validateWithCore(token);
    await this.sessionsRepo.save(
      this.sessionsRepo.create({
        tokenHash,
        userId: validated.userId,
        expiresAt: validated.expiresAt,
        phone: validated.phone,
        name: validated.name,
        lastName: validated.lastName,
        language: validated.language,
        lastUsedAt: now,
      }),
    );

    return validated;
  }

  async purgeExpiredSessions(): Promise<number> {
    const result = await this.sessionsRepo.delete({ expiresAt: LessThan(new Date()) });
    return result.affected ?? 0;
  }

  private async validateWithCore(token: string): Promise<ValidatedSeller> {
    const coreBase =
      this.configService.get<string>('CORE_BACKEND_URL') || 'http://localhost:9050';
    const serviceKey = this.configService.get<string>('ADMIN_PANEL_SERVICE_API_KEY');

    if (!serviceKey) {
      this.logger.error('ADMIN_PANEL_SERVICE_API_KEY is not configured');
      throw new ServiceUnavailableException('Seller auth is not configured');
    }

    const url = `${coreBase.replace(/\/$/, '')}/internal/admin-panel/validate-seller-token`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Key': serviceKey,
        },
        body: JSON.stringify({ token }),
      });
    } catch (error) {
      this.logger.error(`Core validate request failed: ${String(error)}`);
      throw new ServiceUnavailableException('Unable to reach core backend');
    }

    if (response.status === 401) {
      throw new UnauthorizedException('Invalid or expired seller token');
    }

    if (!response.ok) {
      this.logger.error(`Core validate returned ${response.status}`);
      throw new ServiceUnavailableException('Core token validation failed');
    }

    const body = (await response.json()) as CoreValidateSuccess;
    if (!body?.valid || !body.userId || !body.expiresAt) {
      throw new UnauthorizedException('Invalid or expired seller token');
    }

    const expiresAt = new Date(body.expiresAt);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid or expired seller token');
    }

    const displayName = [body.name, body.lastName].filter(Boolean).join(' ').trim() || null;

    return {
      userId: body.userId,
      phone: body.phone ?? null,
      name: displayName || body.name || null,
      lastName: body.lastName ?? null,
      language: body.language ?? null,
      expiresAt,
    };
  }
}
