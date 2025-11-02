import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import {
  ConfigModule as NestConfigModule,
  ConfigService,
} from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { databaseConfig } from './config/database.config';
import { CacheModuleWrapper } from './infrastructure/cache/cache.module';
import { WebSocketModule } from './infrastructure/websocket/websocket.module';
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

@Module({
  imports: [
    // Configuration (global)
    ConfigModule,

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
  providers: [AppService],
})
export class AppModule {}
