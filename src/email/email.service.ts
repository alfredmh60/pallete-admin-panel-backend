import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

import {
  EmailOptions,
  SendPasswordEmailOptions,
  SendResetEmailOptions,
  SendWelcomeEmailOptions,
  SendNotificationOptions,
} from './interfaces/email-options.interface';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private templates: Map<string, HandlebarsTemplateFunction> = new Map();

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
    this.loadTemplates();
  }

  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: this.configService.get('SMTP_SECURE', false),
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('خطا در اتصال به سرور ایمیل:', error);
      } else {
        this.logger.log('Application in conneced to Email service');
      }
    });
  }

  private loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, 'templates');
      if (fs.existsSync(templatesDir)) {
        const files = fs.readdirSync(templatesDir);
        files.forEach(file => {
          if (file.endsWith('.hbs')) {
            const templateName = file.replace('.hbs', '');
            const templateContent = fs.readFileSync(
              path.join(templatesDir, file),
              'utf-8',
            );
            this.templates.set(templateName, handlebars.compile(templateContent));
            this.logger.log(`قالب ایمیل ${templateName} بارگذاری شد`);
          }
        });
      }
    } catch (error) {
      this.logger.warn('پوشه قالب‌های ایمیل یافت نشد، از قالب‌های پیش‌فرض استفاده می‌شود');
    }
  }

  private async sendMail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: options.from || {
          name: this.configService.get('FROM_NAME', 'ادمین پنل'),
          address: this.configService.get('FROM_EMAIL', 'noreply@admin-panel.com'),
        },
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`ایمیل با موفقیت ارسال شد: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`خطا در ارسال ایمیل: ${error.message}`);
      return false;
    }
  }

  private renderTemplate(templateName: string, context: any): string | null {
    const template = this.templates.get(templateName);
    if (template) {
      return template(context);
    }
    return null;
  }

  // ========== ایمیل‌های سیستمی ==========

  async sendPasswordEmail(options: SendPasswordEmailOptions): Promise<boolean> {
    const { to, password, name } = options;

    const html = this.renderTemplate('welcome', { name, password }) || `
      <div dir="rtl" style="font-family: Vazir, Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #1976d2; text-align: center;">به پنل مدیریت خوش آمدید</h2>
        <p>کاربر گرامی،</p>
        <p>حساب کاربری شما با موفقیت ایجاد شد. اطلاعات ورود شما به شرح زیر است:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>نام کاربری:</strong> ${to}</p>
          <p><strong>رمز عبور موقت:</strong> ${password}</p>
        </div>
        <p>لطفاً پس از اولین ورود، رمز عبور خود را تغییر دهید.</p>
        <p style="color: #ff0000; font-size: 12px;">توجه: این ایمیل به صورت خودکار تولید شده است، لطفاً به آن پاسخ ندهید.</p>
        <hr style="border: 1px solid #e0e0e0;">
        <p style="text-align: center; color: #666; font-size: 12px;">© 2024 پنل مدیریت. تمامی حقوق محفوظ است.</p>
      </div>
    `;

    return this.sendMail({
      to,
      subject: '📬 اطلاعات حساب کاربری شما',
      html,
    });
  }

  async sendResetEmail(options: SendResetEmailOptions): Promise<boolean> {
    const { to, resetLink, name } = options;

    const html = this.renderTemplate('reset-password', { name, resetLink }) || `
      <div dir="rtl" style="font-family: Vazir, Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #1976d2; text-align: center;">بازیابی رمز عبور</h2>
        <p>کاربر گرامی،</p>
        <p>درخواست بازیابی رمز عبور برای حساب کاربری شما ثبت شده است.</p>
        <p>برای تنظیم رمز عبور جدید، روی لینک زیر کلیک کنید:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">بازیابی رمز عبور</a>
        </div>
        <p>این لینک به مدت ۱ ساعت معتبر است.</p>
        <p>اگر شما این درخواست را نداده‌اید، لطفاً این ایمیل را نادیده بگیرید.</p>
        <hr style="border: 1px solid #e0e0e0;">
        <p style="text-align: center; color: #666; font-size: 12px;">© 2024 پنل مدیریت. تمامی حقوق محفوظ است.</p>
      </div>
    `;

    return this.sendMail({
      to,
      subject: '🔐 درخواست بازیابی رمز عبور',
      html,
    });
  }

  async sendWelcomeEmail(options: SendWelcomeEmailOptions): Promise<boolean> {
    const { to, name, loginUrl } = options;

    const html = this.renderTemplate('welcome', { name, loginUrl }) || `
      <div dir="rtl" style="font-family: Vazir, Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #1976d2; text-align: center;">خوش آمدید!</h2>
        <p>کاربر گرامی ${name || ''}،</p>
        <p>به پنل مدیریت خوش آمدید. حساب کاربری شما با موفقیت فعال شد.</p>
        <p>برای ورود به سیستم از لینک زیر استفاده کنید:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">ورود به پنل</a>
        </div>
        <hr style="border: 1px solid #e0e0e0;">
        <p style="text-align: center; color: #666; font-size: 12px;">© 2024 پنل مدیریت. تمامی حقوق محفوظ است.</p>
      </div>
    `;

    return this.sendMail({
      to,
      subject: '🎉 خوش آمدید به پنل مدیریت',
      html,
    });
  }

  async sendNotification(options: SendNotificationOptions): Promise<boolean> {
    const { to, subject, message, type = 'info' } = options;

    const colors = {
      info: '#1976d2',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
    };

    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    };

    const html = `
      <div dir="rtl" style="font-family: Vazir, Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: ${colors[type]}; text-align: center;">${icons[type]} ${subject}</h2>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="white-space: pre-line;">${message}</p>
        </div>
        <hr style="border: 1px solid #e0e0e0;">
        <p style="text-align: center; color: #666; font-size: 12px;">این ایمیل به صورت خودکار ارسال شده است.</p>
      </div>
    `;

    return this.sendMail({
      to,
      subject: `${icons[type]} ${subject}`,
      html,
    });
  }

  // ========== ایمیل‌های تست ==========

  async sendTestEmail(to: string): Promise<boolean> {
    return this.sendMail({
      to,
      subject: '🧪 ایمیل تست',
      html: `
        <div dir="rtl" style="font-family: Vazir, Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #4caf50; text-align: center;">ایمیل تست با موفقیت ارسال شد</h2>
          <p>اگر این ایمیل را مشاهده می‌کنید، یعنی تنظیمات SMTP شما به درستی پیکربندی شده است.</p>
          <p><strong>زمان ارسال:</strong> ${new Date().toLocaleString('fa-IR')}</p>
        </div>
      `,
    });
  }
}