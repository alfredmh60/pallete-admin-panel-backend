import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SMS_TEMPLATES } from './sms-templates.constants';

interface KavenegarLookupEntry {
  messageid?: number;
  status?: number;
  statustext?: string;
  receptor?: string;
}

interface KavenegarLookupResponse {
  return?: {
    status?: number;
    message?: string;
  };
  entries?: KavenegarLookupEntry[] | null;
}

@Injectable()
export class KavenegarService {
  private readonly logger = new Logger(KavenegarService.name);
  private readonly apiKey: string;
  private readonly smsEnabled: boolean;
  private readonly timeoutMs: number;
  private readonly isDev: boolean;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('KAVENEGAR_API_KEY', '').trim();
    this.smsEnabled = this.configService.get<string>('SMS_ENABLED', 'true') !== 'false';
    this.timeoutMs = Number(this.configService.get<string>('SMS_TIMEOUT_MS', '8000'));
    this.isDev = this.configService.get<string>('NODE_ENV', 'development') !== 'production';
  }

  async sendOtp(phone: string, otp: string): Promise<void> {
    const token = otp.replace(/\D/g, '');

    if (!this.smsEnabled) {
      this.logger.warn(`SMS_ENABLED=false — OTP for ${phone}: ${token}`);
      return;
    }

    if (!this.apiKey) {
      throw new Error('کلید کاوه‌نگار تنظیم نشده است');
    }

    const url = new URL(`https://api.kavenegar.com/v1/${this.apiKey}/verify/lookup.json`);
    url.searchParams.set('receptor', phone);
    url.searchParams.set('token', token);
    url.searchParams.set('template', SMS_TEMPLATES.SIGNUP_VERIFICATION);
    url.searchParams.set('type', 'sms');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url.toString(), { signal: controller.signal });
      const body = (await response.json()) as KavenegarLookupResponse;

      const returnStatus = body.return?.status;
      const entry = body.entries?.[0];

      if (!response.ok || returnStatus !== 200 || !entry?.messageid) {
        this.logger.error('Kavenegar OTP send failed', {
          httpStatus: response.status,
          returnStatus,
          returnMessage: body.return?.message,
          entryStatus: entry?.status,
          entryStatusText: entry?.statustext,
        });
        throw new Error(body.return?.message || entry?.statustext || 'ارسال پیامک با خطا مواجه شد');
      }

      this.logger.log(
        `Kavenegar accepted OTP for ${phone} (messageid=${entry.messageid}, status=${entry.statustext || entry.status})`,
      );

      if (this.isDev) {
        this.logger.warn(`[DEV] OTP for ${phone}: ${token}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send OTP SMS to ${phone}`, error);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
