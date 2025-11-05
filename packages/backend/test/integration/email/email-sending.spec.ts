import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from '../../../src/application/services/email.service';
import { EmailMessage } from '../../../src/domain/shared/value-objects/email-message.vo';
import emailConfig from '../../../src/config/email.config';

describe('Email Sending Integration Test', () => {
  let emailService: EmailService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [emailConfig],
          envFilePath: '.env.test',
        }),
      ],
      providers: [EmailService],
    }).compile();

    emailService = module.get<EmailService>(EmailService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Single Email Sending', () => {
    it('should send email with local adapter', async () => {
      const message = new EmailMessage(
        ['integration-test@example.com'],
        'noreply@kanbanboard.app',
        'Integration Test Email',
        '<html><body><h1>Integration Test</h1><p>This is a test email from the integration test suite.</p></body></html>',
        'Integration Test - This is a test email from the integration test suite.',
      );

      const result = await emailService.sendEmail(message);

      expect(result.success).toBe(true);
      expect(result.provider).toBe('local');
      expect(result.messageId).toBeDefined();
      expect(result.messageId).toMatch(/^local-/);
      expect(result.sentAt).toBeInstanceOf(Date);
      expect(result.recipients).toContain('integration-test@example.com');
      expect(result.subject).toBe('Integration Test Email');
      expect(result.error).toBeUndefined();
    });

    it('should send email with multiple recipients', async () => {
      const message = new EmailMessage(
        ['user1@example.com', 'user2@example.com', 'user3@example.com'],
        'noreply@kanbanboard.app',
        'Multi-Recipient Test',
        '<p>Testing multiple recipients</p>',
        'Testing multiple recipients',
      );

      const result = await emailService.sendEmail(message);

      expect(result.success).toBe(true);
      expect(result.recipients).toHaveLength(3);
      expect(result.recipients).toEqual(
        expect.arrayContaining([
          'user1@example.com',
          'user2@example.com',
          'user3@example.com',
        ]),
      );
    });

    it('should send email with CC and BCC', async () => {
      const message = new EmailMessage(
        ['primary@example.com'],
        'sender@kanbanboard.app',
        'CC/BCC Test',
        '<p>Testing CC and BCC functionality</p>',
        'Testing CC and BCC functionality',
        undefined,
        'replyto@kanbanboard.app',
        ['cc1@example.com', 'cc2@example.com'],
        ['bcc@example.com'],
      );

      const result = await emailService.sendEmail(message);

      expect(result.success).toBe(true);
      expect(result.recipients).toContain('primary@example.com');
      expect(result.recipients).toContain('cc1@example.com');
      expect(result.recipients).toContain('cc2@example.com');
      expect(result.recipients).toContain('bcc@example.com');
    });

    it('should handle rich HTML content', async () => {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; }
              .header { background: #667eea; color: white; padding: 20px; }
              .content { padding: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Rich HTML Email</h1>
            </div>
            <div class="content">
              <p>This email contains rich HTML formatting.</p>
              <ul>
                <li>Styled elements</li>
                <li>Multiple sections</li>
                <li>Proper HTML structure</li>
              </ul>
            </div>
          </body>
        </html>
      `;

      const message = new EmailMessage(
        ['richhtml@example.com'],
        'noreply@kanbanboard.app',
        'Rich HTML Test',
        htmlContent,
        'This email contains rich HTML formatting.',
      );

      const result = await emailService.sendEmail(message);

      expect(result.success).toBe(true);
    });
  });

  describe('Bulk Email Sending', () => {
    it('should send multiple emails in bulk', async () => {
      const messages = [
        new EmailMessage(
          ['bulk1@example.com'],
          'noreply@kanbanboard.app',
          'Bulk Email 1',
          '<p>First bulk email</p>',
          'First bulk email',
        ),
        new EmailMessage(
          ['bulk2@example.com'],
          'noreply@kanbanboard.app',
          'Bulk Email 2',
          '<p>Second bulk email</p>',
          'Second bulk email',
        ),
        new EmailMessage(
          ['bulk3@example.com'],
          'noreply@kanbanboard.app',
          'Bulk Email 3',
          '<p>Third bulk email</p>',
          'Third bulk email',
        ),
      ];

      const results = await emailService.sendBulkEmail(messages);

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.provider).toBe('local');
        expect(result.messageId).toBeDefined();
        expect(result.recipients).toContain(`bulk${index + 1}@example.com`);
      });
    });

    it('should handle large bulk email batch', async () => {
      const messages = Array.from({ length: 50 }, (_, i) => {
        return new EmailMessage(
          [`bulk-user-${i}@example.com`],
          'noreply@kanbanboard.app',
          `Bulk Email ${i}`,
          `<p>Bulk email number ${i}</p>`,
          `Bulk email number ${i}`,
        );
      });

      const results = await emailService.sendBulkEmail(messages);

      expect(results).toHaveLength(50);
      const successCount = results.filter((r) => r.success).length;
      expect(successCount).toBe(50);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid email addresses', () => {
      expect(() => {
        new EmailMessage(
          ['invalid-email'],
          'sender@example.com',
          'Test',
          '<p>Test</p>',
        );
      }).toThrow();
    });

    it('should handle missing subject', () => {
      expect(() => {
        new EmailMessage(
          ['test@example.com'],
          'sender@example.com',
          '',
          '<p>Test</p>',
        );
      }).toThrow();
    });

    it('should handle missing HTML body', () => {
      expect(() => {
        new EmailMessage(
          ['test@example.com'],
          'sender@example.com',
          'Test Subject',
          '',
        );
      }).toThrow();
    });
  });

  describe('Service Configuration', () => {
    it('should use LOCAL provider in test environment', () => {
      expect(emailService.getProviderName()).toBe('local');
    });

    it('should not have secondary provider in default test config', () => {
      expect(emailService.hasSecondaryProvider()).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should send email within acceptable time', async () => {
      const message = new EmailMessage(
        ['performance@example.com'],
        'noreply@kanbanboard.app',
        'Performance Test',
        '<p>Testing performance</p>',
        'Testing performance',
      );

      const startTime = Date.now();
      await emailService.sendEmail(message);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent email sends', async () => {
      const messages = Array.from({ length: 10 }, (_, i) => {
        return new EmailMessage(
          [`concurrent-${i}@example.com`],
          'noreply@kanbanboard.app',
          `Concurrent Email ${i}`,
          `<p>Concurrent test ${i}</p>`,
          `Concurrent test ${i}`,
        );
      });

      const startTime = Date.now();
      const results = await Promise.all(
        messages.map((msg) => emailService.sendEmail(msg)),
      );
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
});
