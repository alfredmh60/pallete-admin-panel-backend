import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email.service';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                SMTP_HOST: 'smtp.gmail.com',
                SMTP_PORT: 587,
                SMTP_SECURE: false,
                SMTP_USER: 'test@gmail.com',
                SMTP_PASS: 'password',
                FROM_EMAIL: 'noreply@test.com',
                FROM_NAME: 'Test Panel',
              };
              return config[key];
            }),
          },
        },
        {
          provide: 'MAIL_TRANSPORT',
          useValue: {
            sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
            verify: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPasswordEmail', () => {
    it('should send password email', async () => {
      const result = await service.sendPasswordEmail({
        to: 'test@example.com',
        password: 'TestPass123',
        name: 'Test User',
      });
      expect(result).toBeDefined();
    });
  });

  describe('sendResetEmail', () => {
    it('should send reset password email', async () => {
      const result = await service.sendResetEmail({
        to: 'test@example.com',
        resetLink: 'http://localhost/reset?token=123',
        name: 'Test User',
      });
      expect(result).toBeDefined();
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email', async () => {
      const result = await service.sendWelcomeEmail({
        to: 'test@example.com',
        name: 'Test User',
        loginUrl: 'http://localhost/login',
      });
      expect(result).toBeDefined();
    });
  });

  describe('sendNotification', () => {
    it('should send notification email', async () => {
      const result = await service.sendNotification({
        to: 'test@example.com',
        subject: 'Test Notification',
        message: 'This is a test notification',
        type: 'info',
      });
      expect(result).toBeDefined();
    });
  });

  describe('sendTestEmail', () => {
    it('should send test email', async () => {
      const result = await service.sendTestEmail('test@example.com');
      expect(result).toBeDefined();
    });
  });
});