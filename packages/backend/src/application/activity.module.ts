/**
 * T254 + T263 - Activity Module
 * User Story 7: Activity History and Audit Trail
 *
 * Module that wires together:
 * - ActivityLogger service (subscribes to domain events)
 * - Activity query handlers
 * - Activity repository
 * - Activity controller
 * - WebSocket integration for real-time activity updates
 *
 * This module is imported into AppModule to enable activity logging
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityEntity } from '../infrastructure/persistence/entities/activity.entity';
import { ActivityLoggerService } from './services/activity-logger.service';
import { GetCardActivityHandler } from './queries/activity/get-card-activity.handler';
import { GetBoardActivityHandler } from './queries/activity/get-board-activity.handler';
import { ActivityController } from '../presentation/controllers/activity.controller';
import { ActivityRepositoryImpl } from '../infrastructure/persistence/repositories/activity.repository.impl';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { IActivityRepository } from '../domain/activity/activity.repository';
import { WebSocketModule } from '../infrastructure/websocket/websocket.module';
import { AuthModule } from '../infrastructure/auth/auth.module';
import { BoardEntity } from '../infrastructure/persistence/entities/board.entity';
import { BoardMemberEntity } from '../infrastructure/persistence/entities/board-member.entity';
import { OrganizationMemberEntity } from '../infrastructure/persistence/entities/organization-member.entity';
import { ListEntity } from '../infrastructure/persistence/entities/list.entity';
import { CardEntity } from '../infrastructure/persistence/entities/card.entity';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([
      ActivityEntity,
      // Import entities needed by BoardPermissionGuard
      BoardEntity,
      BoardMemberEntity,
      OrganizationMemberEntity,
      ListEntity,
      CardEntity,
    ]),
    WebSocketModule, // Import to access BoardGateway for real-time updates
    AuthModule, // Import for BoardPermissionGuard and auth infrastructure
  ],
  controllers: [ActivityController],
  providers: [
    // Services
    ActivityLoggerService,

    // Query handlers
    GetCardActivityHandler,
    GetBoardActivityHandler,

    // Repository
    {
      provide: 'IActivityRepository',
      useClass: ActivityRepositoryImpl,
    },
  ],
  exports: [ActivityLoggerService, 'IActivityRepository'],
})
export class ActivityModule {}
