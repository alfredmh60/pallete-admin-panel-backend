import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

import { Admins } from '../entities/admins.entity';
import { Role } from '../entities/role.entity';
import { EmailService } from '../email/email.service';

import { LoginDto } from './dto/login.dto';
import { RequestResetDto } from './dto/request-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { Logger } from '@nestjs/common';
import { BlacklistedToken } from '../entities/blacklisted-token.entity'; // یه entity جدید


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
    private emailService: EmailService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
  
   // پیدا کردن کاربر با ایمیل
    // const admin = await this.adminRepository.findOne({
    //   where: { email },
    //   relations: ['role', 'role.rolePermissions', 'role.rolePermissions.permission'],
    // });
const admin = await this.adminRepository.findOneBy({ email });

    // بررسی وجود کاربر و صحت رمز
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('ایمیل یا رمز عبور اشتباه است');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('ایمیل یا رمز عبور اشتباه است');
    }

    // گرفتن مجوزها از نقش
    const permissions = admin.role?.rolePermissions?.map(
      rp => rp.permission.name
    ) || [];

    // ایجاد payload برای JWT
    const payload: JwtPayload = {
      sub: admin.id,
      roleId: admin.roleId,
      role: admin.role?.name,
    };

    // تولید توکن
    const token = this.jwtService.sign(payload);
    
    // تولید refresh token (اختیاری)
    const refreshToken = randomBytes(40).toString('hex');

    // ذخیره refresh token در دیتابیس (اختیاری)
   //  await this.adminRepository.update(admin.id, { refreshToken });

    return {
      token,
      refresh_token: refreshToken,
      user: {
        id: admin.id,
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
    // توکن رو به لیست سیاه اضافه کن
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
      const decoded = this.jwtService.decode(token) as any;
      return new Date(decoded.exp * 1000);
    } catch {
      return new Date();
    }
  }

  // پاک کردن توکن‌های منقضی شده (کرون جاب)
  async cleanExpiredTokens() {
    await this.blacklistRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }


  async requestReset(requestResetDto: RequestResetDto) {
    const { email } = requestResetDto;

    const admin = await this.adminRepository.findOne({ 
      where: { email } 
    });

    if (admin) {
      // تولید توکن یکبار مصرف
      const resetToken = randomBytes(32).toString('hex');
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 1); // 1 ساعت اعتبار

      // ذخیره توکن در دیتابیس
      await this.adminRepository.update(admin.id, {
        resetToken,
        resetTokenExpiry: expiry,
      });

      // ارسال ایمیل
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await this.emailService.sendResetEmail({ to: admin.email,resetLink: resetLink });
    }

    // همیشه همین پیام رو برمی‌گردونیم (حتی اگه ایمیل وجود نداشته باشه)
    return { 
      message: 'اگر ایمیل شما در سیستم ثبت شده باشد، لینک بازیابی برای شما ارسال خواهد شد' 
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    const admin = await this.adminRepository.findOne({
      where: { resetToken: token },
    });

    if (!admin || !admin.resetTokenExpiry || admin.resetTokenExpiry < new Date()) {
      throw new BadRequestException('توکن نامعتبر یا منقضی شده است');
    }

    // هش کردن رمز جدید
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // بروزرسانی رمز و پاک کردن توکن
    await this.adminRepository.update(admin.id, {
      passwordHash,
      resetToken: "",
      resetTokenExpiry: "",
    });

    return { message: 'رمز عبور با موفقیت تغییر کرد' };
  }

  async refreshToken(refreshToken: string) {
    // پیدا کردن کاربر با refresh token
    const admin = await this.adminRepository.findOne({
      where: ({refreshToken }as any),
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('توکن نامعتبر است');
    }

    // ایجاد payload جدید
    const payload: JwtPayload = {
      sub: admin.id,
      roleId: admin.roleId,
      role: admin.role?.name,
    };

    // تولید توکن جدید
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