import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // اعتبارسنجی سراسری
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // حذف فیلدهای اضافی
      forbidNonWhitelisted: true, // خطا برای فیلدهای اضافی
      transform: true, // تبدیل خودکار نوع‌ها
    }),
  );

  // CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // پیش‌وند سراسری برای API (اختیاری)
  // app.setGlobalPrefix('api');

  const port = configService.get('PORT') || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
}

bootstrap();