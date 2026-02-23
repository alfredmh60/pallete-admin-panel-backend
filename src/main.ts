import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
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
    app.useGlobalFilters(
      new (class {
        catch(exception: any, host: any) {
          logger.error('global error:', exception);
          const ctx = host.switchToHttp();
          const response = ctx.getResponse();
          response.status(500).json({
            statusCode: 500,
            message: exception.message || 'Internal server error',
            error: exception.name,
          });
        }
      })(),
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

    logger.log(`🚀 Application is running on: http://localhost:${port}`);
  } catch (error) {
    logger.error('Error in running application', error);
  }
}

bootstrap();
