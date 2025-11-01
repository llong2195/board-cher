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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
