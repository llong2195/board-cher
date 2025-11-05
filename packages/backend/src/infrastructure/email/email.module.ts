import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from '../../application/services/email.service';
import { NotificationEmailSubscriber } from '../../application/subscribers/notification-email.subscriber';
import emailConfig from '../../config/email.config';
import { NotificationPreferencesEntity } from '../persistence/entities/notification-preferences.entity';
import { UserEntity } from '../persistence/entities/user.entity';

/**
 * EmailModule
 * Provides email sending functionality with multi-provider support
 * T375: Includes NotificationEmailSubscriber for domain event handling
 */
@Module({
  imports: [
    ConfigModule.forFeature(emailConfig),
    TypeOrmModule.forFeature([NotificationPreferencesEntity, UserEntity]),
  ],
  providers: [EmailService, NotificationEmailSubscriber],
  exports: [EmailService, NotificationEmailSubscriber],
})
export class EmailModule {}
