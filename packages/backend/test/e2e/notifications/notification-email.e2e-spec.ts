import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import * as request from 'supertest';
import { NotificationService } from '../../../src/application/services/notification.service';
import { EmailService } from '../../../src/application/services/email.service';
import { NotificationModule } from '../../../src/application/notification.module';
import { EmailModule } from '../../../src/infrastructure/email/email.module';
import { UserEntity } from '../../../src/infrastructure/persistence/entities/user.entity';
import { NotificationPreferencesEntity } from '../../../src/infrastructure/persistence/entities/notification-preferences.entity';
import { DataSource } from 'typeorm';
import emailConfig from '../../../src/config/email.config';

describe('Notification Email E2E Test', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let notificationService: NotificationService;
  let emailService: EmailService;
  let testUser: UserEntity;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [emailConfig],
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [UserEntity, NotificationPreferencesEntity],
          synchronize: true,
          dropSchema: true,
        }),
        EventEmitterModule.forRoot(),
        NotificationModule,
        EmailModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    notificationService =
      moduleFixture.get<NotificationService>(NotificationService);
    emailService = moduleFixture.get<EmailService>(EmailService);

    // Create test user
    const userRepository = dataSource.getRepository(UserEntity);
    testUser = userRepository.create({
      email: 'testuser@example.com',
      name: 'Test User',
      passwordHash: 'hashed_password',
    });
    await userRepository.save(testUser);

    // Create notification preferences with email enabled
    const preferencesRepository = dataSource.getRepository(
      NotificationPreferencesEntity,
    );
    const preferences = preferencesRepository.create({
      userId: testUser.id,
      emailEnabled: true,
      pushEnabled: false,
      cardAssignmentEnabled: true,
      commentEnabled: true,
      dueDateReminderEnabled: true,
    });
    await preferencesRepository.save(preferences);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Card Assignment Notification Flow', () => {
    it('should send email when user is assigned to card', async () => {
      // Spy on emailService.sendEmail
      const sendEmailSpy = jest.spyOn(emailService, 'sendEmail');

      // Create notification (simulating card assignment)
      await notificationService.createNotification(
        testUser.id,
        'card_assigned' as any,
        'Card Assigned',
        'You have been assigned to "Implement Email Service"',
        {
          cardId: 'card-123',
          cardTitle: 'Implement Email Service',
          boardName: 'Development Board',
          listName: 'In Progress',
          assignedBy: 'admin@example.com',
        },
      );

      // Wait for async email sending
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify email was sent
      expect(sendEmailSpy).toHaveBeenCalled();
      const emailCall = sendEmailSpy.mock.calls[0][0];
      expect(emailCall.to).toContain('testuser@example.com');
      expect(emailCall.subject).toBe('Card Assigned');

      sendEmailSpy.mockRestore();
    });

    it('should not send email when emailEnabled is false', async () => {
      // Disable email notifications
      const preferencesRepository = dataSource.getRepository(
        NotificationPreferencesEntity,
      );
      await preferencesRepository.update(
        { userId: testUser.id },
        { emailEnabled: false },
      );

      const sendEmailSpy = jest.spyOn(emailService, 'sendEmail');

      // Create notification
      await notificationService.createNotification(
        testUser.id,
        'card_assigned' as any,
        'Card Assigned',
        'You have been assigned to "Another Card"',
        {
          cardId: 'card-456',
          cardTitle: 'Another Card',
        },
      );

      // Wait for potential async email sending
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify email was NOT sent
      expect(sendEmailSpy).not.toHaveBeenCalled();

      // Re-enable for other tests
      await preferencesRepository.update(
        { userId: testUser.id },
        { emailEnabled: true },
      );

      sendEmailSpy.mockRestore();
    });

    it('should not send email when card assignment notifications are disabled', async () => {
      // Disable card assignment notifications specifically
      const preferencesRepository = dataSource.getRepository(
        NotificationPreferencesEntity,
      );
      await preferencesRepository.update(
        { userId: testUser.id },
        { cardAssignmentEnabled: false },
      );

      const sendEmailSpy = jest.spyOn(emailService, 'sendEmail');

      // Create notification
      await notificationService.createNotification(
        testUser.id,
        'card_assigned' as any,
        'Card Assigned',
        'You have been assigned to "Yet Another Card"',
        {
          cardId: 'card-789',
          cardTitle: 'Yet Another Card',
        },
      );

      // Wait for potential async email sending
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify email was NOT sent
      expect(sendEmailSpy).not.toHaveBeenCalled();

      // Re-enable for other tests
      await preferencesRepository.update(
        { userId: testUser.id },
        { cardAssignmentEnabled: true },
      );

      sendEmailSpy.mockRestore();
    });
  });

  describe('Comment Notification Flow', () => {
    it('should send email when comment is added to assigned card', async () => {
      const sendEmailSpy = jest.spyOn(emailService, 'sendEmail');

      // Create comment notification
      await notificationService.createNotification(
        testUser.id,
        'card_comment_added' as any,
        'New Comment',
        'New comment on "Implement Email Service"',
        {
          cardId: 'card-123',
          cardTitle: 'Implement Email Service',
          commentAuthor: 'colleague@example.com',
          comment: 'Great work on this!',
        },
      );

      // Wait for async email sending
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify email was sent
      expect(sendEmailSpy).toHaveBeenCalled();

      sendEmailSpy.mockRestore();
    });

    it('should not send email when comment notifications are disabled', async () => {
      // Disable comment notifications
      const preferencesRepository = dataSource.getRepository(
        NotificationPreferencesEntity,
      );
      await preferencesRepository.update(
        { userId: testUser.id },
        { commentEnabled: false },
      );

      const sendEmailSpy = jest.spyOn(emailService, 'sendEmail');

      // Create comment notification
      await notificationService.createNotification(
        testUser.id,
        'card_comment_added' as any,
        'New Comment',
        'New comment on card',
        {
          cardId: 'card-123',
          comment: 'Another comment',
        },
      );

      // Wait for potential async email sending
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify email was NOT sent
      expect(sendEmailSpy).not.toHaveBeenCalled();

      // Re-enable for other tests
      await preferencesRepository.update(
        { userId: testUser.id },
        { commentEnabled: true },
      );

      sendEmailSpy.mockRestore();
    });
  });

  describe('Due Date Reminder Flow', () => {
    it('should send email for due date reminders', async () => {
      const sendEmailSpy = jest.spyOn(emailService, 'sendEmail');

      // Create due date reminder notification
      await notificationService.createNotification(
        testUser.id,
        'card_due_soon' as any,
        'Card Due Soon',
        'Card "Implement Email Service" is due in 24 hours',
        {
          cardId: 'card-123',
          cardTitle: 'Implement Email Service',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      );

      // Wait for async email sending
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify email was sent
      expect(sendEmailSpy).toHaveBeenCalled();

      sendEmailSpy.mockRestore();
    });
  });

  describe('Email Service Integration', () => {
    it('should use LOCAL provider in test environment', () => {
      expect(emailService.getProviderName()).toBe('local');
    });

    it('should successfully deliver notification emails', async () => {
      const sendEmailSpy = jest.spyOn(emailService, 'sendEmail');

      await notificationService.createNotification(
        testUser.id,
        'card_assigned' as any,
        'Integration Test',
        'Testing email delivery',
        {
          cardId: 'test-card',
        },
      );

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(sendEmailSpy).toHaveBeenCalled();
      const result = await sendEmailSpy.mock.results[0].value;
      expect(result.success).toBe(true);

      sendEmailSpy.mockRestore();
    });
  });

  describe('User Without Preferences', () => {
    it('should not send email to user without notification preferences', async () => {
      // Create user without preferences
      const userRepository = dataSource.getRepository(UserEntity);
      const userWithoutPrefs = userRepository.create({
        email: 'noprefs@example.com',
        name: 'No Prefs User',
        passwordHash: 'hashed_password',
      });
      await userRepository.save(userWithoutPrefs);

      const sendEmailSpy = jest.spyOn(emailService, 'sendEmail');

      // Create notification
      await notificationService.createNotification(
        userWithoutPrefs.id,
        'card_assigned' as any,
        'Card Assigned',
        'Test notification',
        {},
      );

      // Wait for potential async email sending
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should not send email (no preferences found)
      expect(sendEmailSpy).not.toHaveBeenCalled();

      sendEmailSpy.mockRestore();
    });
  });
});
