import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from './presentation/pipes/validation.pipe';
import {
  HttpExceptionFilter,
  AllExceptionsFilter,
} from './presentation/filters/http-exception.filter';
import { LoggerService } from './infrastructure/logging/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Logger
  const logger = new LoggerService();
  logger.setContext('Bootstrap');
  app.useLogger(logger);

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe());

  // Global exception filters (order matters: specific first, then general)
  app.useGlobalFilters(new HttpExceptionFilter(), new AllExceptionsFilter());

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
}

void bootstrap();
