import { Injectable } from '@nestjs/common';
import { randomInt, timingSafeEqual } from 'crypto';

const OTP_EXPIRATION_MINUTES = 2;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

@Injectable()
export class OtpService {
  generateOtp(): { code: string; expiresAt: Date } {
    const code = String(randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);
    return { code, expiresAt };
  }

  isExpired(expiresAt?: Date | null): boolean {
    if (!expiresAt) {
      return true;
    }
    return expiresAt.getTime() < Date.now();
  }

  isCorrect(inputOtp: string, storedOtp: string): boolean {
    const input = Buffer.from(inputOtp.trim());
    const stored = Buffer.from(storedOtp.trim());
    if (input.length !== stored.length) {
      return false;
    }
    return timingSafeEqual(input, stored);
  }

  canResend(lastRequestedAt?: Date | null): boolean {
    if (!lastRequestedAt) {
      return true;
    }
    const elapsedSeconds = (Date.now() - lastRequestedAt.getTime()) / 1000;
    return elapsedSeconds >= OTP_RESEND_COOLDOWN_SECONDS;
  }

  resendCooldownSeconds(lastRequestedAt?: Date | null): number {
    if (!lastRequestedAt) {
      return 0;
    }
    const elapsedSeconds = (Date.now() - lastRequestedAt.getTime()) / 1000;
    return Math.max(0, Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds));
  }
}
