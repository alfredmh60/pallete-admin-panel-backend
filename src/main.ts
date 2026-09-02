import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
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
    app.useGlobalFilters(new HttpExceptionFilter());
    // CORS
    app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    // پیش‌وند سراسری برای API (اختیاری)
    // app.setGlobalPrefix('api');

    const port = configService.get('PORT') || 9051;
    await app.listen(port);

    logger.log(`🚀 Application is running on: http://localhost:${port}`);
  } catch (error) {
    logger.error('Error in running application', error);
  }
}

bootstrap();
