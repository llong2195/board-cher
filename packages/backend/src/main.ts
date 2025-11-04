import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
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

  // Security: Helmet - sets various HTTP headers for security
  app.use(
    helmet({
      // Content Security Policy - prevents XSS attacks
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for Swagger UI
          scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for Swagger UI
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      // HTTP Strict Transport Security - enforces HTTPS
      hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
      },
      // X-Frame-Options - prevents clickjacking
      frameguard: {
        action: 'deny',
      },
      // X-Content-Type-Options - prevents MIME sniffing
      noSniff: true,
      // X-XSS-Protection - enables XSS filter in older browsers
      xssFilter: true,
      // Referrer-Policy - controls referrer information
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
      // X-DNS-Prefetch-Control - controls DNS prefetching
      dnsPrefetchControl: {
        allow: false,
      },
      // X-Download-Options - prevents IE from executing downloads in site context
      ieNoOpen: true,
      // X-Permitted-Cross-Domain-Policies - controls cross-domain policies
      permittedCrossDomainPolicies: {
        permittedPolicies: 'none',
      },
    }),
  );
  logger.log('Security headers configured with Helmet');

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
