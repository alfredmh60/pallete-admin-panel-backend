import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EmailService } from './email.service';

@Global() // این ماژول در کل پروژه در دسترسه
@Module({
  providers: [
    EmailService,
    {
      provide: 'MAIL_TRANSPORT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodemailer = require('nodemailer');
        return nodemailer.createTransport({
          host: configService.get('SMTP_HOST'),
          port: configService.get('SMTP_PORT'),
          secure: configService.get('SMTP_SECURE', false),
          auth: {
            user: configService.get('SMTP_USER'),
            pass: configService.get('SMTP_PASS'),
          },
        });
      },
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}