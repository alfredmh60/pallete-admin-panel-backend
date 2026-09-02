import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { randomBytes } from 'crypto';

import { Admins } from '../entities/admins.entity';
import { Role } from '../entities/role.entity';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { BlacklistedToken } from '../entities/blacklisted-token.entity';
import { OtpService } from './otp.service';
import { KavenegarService } from '../sms/kavenegar.service';
import { normalizeIranianMobile } from '../utils/iranian-phone.util';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admins)
    private adminRepository: Repository<Admins>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(BlacklistedToken)
    private blacklistRepository: Repository<BlacklistedToken>,
    private jwtService: JwtService,
    private otpService: OtpService,
    private kavenegarService: KavenegarService,
  ) {}

  async requestOtp(requestOtpDto: RequestOtpDto) {
    const phone = normalizeIranianMobile(requestOtpDto.phone);
    if (!phone) {
      throw new BadRequestException('شماره موبایل معتبر نیست');
    }

    const admin = await this.adminRepository.findOne({
      where: { phone, isActive: true },
    });

    if (!admin) {
      throw new NotFoundException('ادمینی با این شماره موبایل یافت نشد');
    }

    if (!this.otpService.canResend(admin.otpRequestedAt)) {
      const retryAfter = this.otpService.resendCooldownSeconds(admin.otpRequestedAt);
      throw new HttpException(
        `لطفاً ${retryAfter} ثانیه دیگر دوباره تلاش کنید`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const { code, expiresAt } = this.otpService.generateOtp();
    const now = new Date();

    await this.adminRepository.update(admin.id, {
      otpCode: code,
      otpExpiresAt: expiresAt,
      otpRequestedAt: now,
    });

    await this.kavenegarService.sendOtp(phone, code);

    return {
      message: 'کد تأیید ارسال شد',
      expiresInSeconds: Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
      retryAfterSeconds: 60,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const phone = normalizeIranianMobile(verifyOtpDto.phone);
    if (!phone) {
      throw new BadRequestException('شماره موبایل معتبر نیست');
    }

    const admin = await this.adminRepository.findOne({
      where: { phone, isActive: true },
      relations: ['role', 'role.rolePermissions', 'role.rolePermissions.permission'],
    });

    if (!admin || !admin.otpCode) {
      throw new UnauthorizedException('کد تأیید نامعتبر است');
    }

    if (this.otpService.isExpired(admin.otpExpiresAt)) {
      throw new BadRequestException('کد تأیید منقضی شده است؛ دوباره درخواست دهید');
    }

    if (!this.otpService.isCorrect(verifyOtpDto.otp, admin.otpCode)) {
      throw new UnauthorizedException('کد تأیید نامعتبر است');
    }

    await this.adminRepository.update(admin.id, {
      otpCode: null,
      otpExpiresAt: null,
    });

    return this.buildAuthResponse(admin);
  }

  private buildAuthResponse(admin: Admins) {
    const permissions =
      admin.role?.rolePermissions?.map((rp) => rp.permission.name) || [];

    const payload: JwtPayload = {
      sub: admin.id,
      roleId: admin.roleId,
      role: admin.role?.name,
    };

    const token = this.jwtService.sign(payload);
    const refreshToken = randomBytes(40).toString('hex');

    return {
      token,
      refresh_token: refreshToken,
      user: {
        id: admin.id,
        phone: admin.phone,
        email: admin.email,
        name: admin.name,
        avatar: admin.avatar,
        role: admin.role?.name,
        roleId: admin.roleId,
        roleName: admin.roleName,
        isActive: admin.isActive,
        permissions,
      },
    };
  }

  async logout(token: string) {
    const expiresAt = this.getTokenExpiry(token);

    await this.blacklistRepository.save({
      token,
      expiresAt,
    });

    return { message: 'خروج با موفقیت انجام شد' };
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.blacklistRepository.findOne({
      where: { token },
    });
    return !!blacklisted;
  }

  private getTokenExpiry(token: string): Date {
    try {
      const decoded = this.jwtService.decode(token) as { exp: number };
      return new Date(decoded.exp * 1000);
    } catch {
      return new Date();
    }
  }

  async cleanExpiredTokens() {
    await this.blacklistRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  async refreshToken(refreshToken: string) {
    const admin = await this.adminRepository.findOne({
      where: { refreshToken } as any,
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('توکن نامعتبر است');
    }

    const payload: JwtPayload = {
      sub: admin.id,
      roleId: admin.roleId,
      role: admin.role?.name,
    };

    const token = this.jwtService.sign(payload);

    return { token };
  }

  async validateUser(payload: JwtPayload): Promise<Admins> {
    const admin = await this.adminRepository.findOne({
      where: { id: payload.sub, isActive: true },
      relations: ['role'],
    });

    if (!admin) {
      throw new UnauthorizedException('کاربر یافت نشد');
    }

    return admin;
  }
}
