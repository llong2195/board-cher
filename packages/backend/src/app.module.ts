import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import {
  ConfigModule as NestConfigModule,
  ConfigService,
} from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { databaseConfig } from './config/database.config';
import { CacheModuleWrapper } from './infrastructure/cache/cache.module';
import { WebSocketModule } from './infrastructure/websocket/websocket.module';
import { AuthModule } from './infrastructure/auth/auth.module';
import { UserModule } from './domain/user/user.module';
import { BoardModule } from './domain/board/board.module';
import { ListModule } from './domain/list/list.module';
import { CardModule } from './domain/card/card.module';
import { OrganizationModule } from './domain/organization/organization.module';
import { CommentModule } from './domain/comment/comment.module';
import { AttachmentModule } from './domain/attachment/attachment.module';
import { LabelModule } from './domain/label/label.module';
import { ChecklistModule } from './domain/checklist/checklist.module';
import { SharedModule } from './domain/shared/shared.module';
import { ActivityModule } from './application/activity.module';
import { NotificationModule } from './application/notification.module';
import { EmailModule } from './infrastructure/email/email.module';

@Module({
  imports: [
    // Configuration (global)
    ConfigModule,

    // Event Emitter for domain events (global)
    EventEmitterModule.forRoot({
      // Use wildcards to support namespaced events
      wildcard: false,
      // Set max listeners to avoid memory leaks warning
      maxListeners: 10,
      // Log emitted events in development
      verboseMemoryLeak: process.env.NODE_ENV === 'development',
      global: true,
    }),

    // Rate limiting (global)
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 50, // 50 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 200, // 200 requests per minute
      },
    ]),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [NestConfigModule.forFeature(databaseConfig)],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get<TypeOrmModuleOptions>('database');
        if (!dbConfig) {
          throw new Error('Database configuration not found');
        }
        return dbConfig;
      },
    }),

    // Infrastructure modules
    CacheModuleWrapper,
    WebSocketModule,
    SharedModule,
    AuthModule,
    ActivityModule,
    NotificationModule, // T373-T375: Notification with email integration
    EmailModule, // T365-T372: Multi-provider email service

    // Domain modules
    UserModule,
    BoardModule,
    ListModule,
    CardModule,
    OrganizationModule,
    CommentModule,
    AttachmentModule,
    LabelModule,
    ChecklistModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
