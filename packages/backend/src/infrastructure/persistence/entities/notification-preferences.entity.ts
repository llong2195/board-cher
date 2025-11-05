import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { UserEntity } from './user.entity';

/**
 * NotificationPreferences entity for user notification settings
 * Supports email, in-app, and notification type preferences
 */
@Entity('notification_preferences')
export class NotificationPreferencesEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  @Index()
  userId!: string;

  @OneToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  // Email notification settings (T374)
  @Column({ name: 'email_enabled', type: 'boolean', default: true })
  emailEnabled!: boolean;

  @Column({ name: 'push_enabled', type: 'boolean', default: true })
  pushEnabled!: boolean;

  // Notification type preferences
  @Column({
    name: 'card_assignment_enabled',
    type: 'boolean',
    default: true,
  })
  cardAssignmentEnabled!: boolean;

  @Column({ name: 'comment_enabled', type: 'boolean', default: true })
  commentEnabled!: boolean;

  @Column({
    name: 'due_date_reminder_enabled',
    type: 'boolean',
    default: true,
  })
  dueDateReminderEnabled!: boolean;

  // Quiet hours settings (nullable)
  @Column({ name: 'quiet_hours_start', type: 'time', nullable: true })
  quietHoursStart?: string;

  @Column({ name: 'quiet_hours_end', type: 'time', nullable: true })
  quietHoursEnd?: string;
}
