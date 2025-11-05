/**
 * NotificationModule
 * User Story 6: Card Assignment and Notifications
 *
 * Module that wires together:
 * - NotificationService (in-memory notification management)
 * - NotificationEventSubscriber (listens to domain events)
 * - NotificationPreferencesEntity (user email preferences)
 * - EmailModule integration for email notifications
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from '../application/services/notification.service';
import { NotificationEventSubscriber } from '../infrastructure/events/notification-event-subscriber';
import { NotificationPreferencesEntity } from '../infrastructure/persistence/entities/notification-preferences.entity';
import { UserEntity } from '../infrastructure/persistence/entities/user.entity';
import { EmailModule } from '../infrastructure/email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationPreferencesEntity, UserEntity]),
    EmailModule, // T373: Import EmailModule for email notification support
  ],
  providers: [NotificationService, NotificationEventSubscriber],
  exports: [NotificationService],
})
export class NotificationModule {}
