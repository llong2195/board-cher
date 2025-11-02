import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggerService } from './infrastructure/logging/logger.service';
import {
  AllExceptionsFilter,
  HttpExceptionFilter,
} from './presentation/filters/http-exception.filter';
import { ValidationPipe } from './presentation/pipes/validation.pipe';

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

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Trello Vibe - Kanban Board API')
    .setDescription(
      'REST API for collaborative Kanban board application with real-time updates. ' +
        'Supports boards, lists, cards, organizations, users, and team collaboration features.',
    )
    .setVersion('1.0')
    .setContact(
      'Trello Vibe Team',
      'https://github.com/llong2195/board-cher',
      'support@trello-vibe.com',
    )
    .setLicense('UNLICENSED', '')
    .addTag('auth', 'Authentication and authorization endpoints')
    .addTag('boards', 'Board management endpoints')
    .addTag('lists', 'List management endpoints')
    .addTag('cards', 'Card management endpoints')
    .addTag('organizations', 'Organization management endpoints')
    .addTag('users', 'User management endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Trello Vibe API Documentation',
    customfavIcon: 'https://swagger.io/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(
    `API Documentation available at: http://localhost:${port}/api/docs`,
  );
}

void bootstrap();
