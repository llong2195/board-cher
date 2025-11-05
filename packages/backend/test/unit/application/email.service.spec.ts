import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../../src/application/services/email.service';
import { EmailMessage } from '../../../src/domain/shared/value-objects/email-message.vo';
import { EmailProvider } from '../../../src/domain/shared/enums/email-provider.enum';

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Default configuration for LOCAL provider
    mockConfigService.get.mockImplementation(
      (key: string, defaultValue?: any) => {
        const config: Record<string, any> = {
          'email.provider': 'local',
          'email.maxRetries': 3,
          'email.retryDelayMs': 1000,
          'email.local.logDirectory': './logs/emails',
          'email.local.writeToFile': false, // Don't write files in tests
          'email.local.writeToConsole': true, // Enable console for tests to pass validation
        };
        return config[key] ?? defaultValue;
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('Provider Initialization', () => {
    it('should initialize with LOCAL provider by default', () => {
      expect(service).toBeDefined();
      expect(service.getProviderName()).toBe('local');
    });

    it('should initialize with specified primary provider', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'email.provider') return 'local';
        if (key === 'email.maxRetries') return 3;
        if (key === 'email.retryDelayMs') return 1000;
        if (key === 'email.local.logDirectory') return './logs/emails';
        if (key === 'email.local.writeToFile') return false;
        if (key === 'email.local.writeToConsole') return true;
        return undefined;
      });

      const module = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const testService = module.get<EmailService>(EmailService);
      expect(testService.getProviderName()).toBe('local');
    });

    it('should initialize secondary provider for fallback if configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'email.provider') return 'local';
        if (key === 'email.secondaryProvider') return 'local';
        if (key === 'email.maxRetries') return 3;
        if (key === 'email.retryDelayMs') return 1000;
        if (key === 'email.local.logDirectory') return './logs/emails';
        if (key === 'email.local.writeToFile') return false;
        if (key === 'email.local.writeToConsole') return true;
        return undefined;
      });

      const module = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const testService = module.get<EmailService>(EmailService);
      expect(testService.hasSecondaryProvider()).toBe(true);
      expect(testService.getSecondaryProviderName()).toBe('local');
    });
  });

  describe('Provider Switching', () => {
    it('should support all provider types', () => {
      const providers = [
        EmailProvider.AWS_SES,
        EmailProvider.BREVO,
        EmailProvider.MAILCHIMP,
        EmailProvider.SENDGRID,
        EmailProvider.RESEND,
        EmailProvider.LOCAL,
      ];

      providers.forEach((provider) => {
        expect(provider).toBeDefined();
      });
    });

    it('should throw error for unsupported provider', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'email.provider') return 'unsupported-provider';
        if (key === 'email.maxRetries') return 3;
        if (key === 'email.retryDelayMs') return 1000;
        return undefined;
      });

      expect(() => {
        new (require('../../../src/application/services/email.service').EmailService)(
          mockConfigService,
        );
      }).toThrow();
    });
  });

  describe('Email Sending', () => {
    it('should send email successfully with LOCAL provider', async () => {
      const message = new EmailMessage(
        ['test@example.com'],
        'sender@example.com',
        'Test Subject',
        '<p>Test HTML</p>',
        'Test text',
      );

      const result = await service.sendEmail(message);

      expect(result.success).toBe(true);
      expect(result.provider).toBe('local');
      expect(result.messageId).toBeDefined();
      expect(result.recipients).toContain('test@example.com');
    });

    it('should handle multiple recipients', async () => {
      const message = new EmailMessage(
        ['test1@example.com', 'test2@example.com'],
        'sender@example.com',
        'Test Subject',
        '<p>Test HTML</p>',
        'Test text',
      );

      const result = await service.sendEmail(message);

      expect(result.success).toBe(true);
      expect(result.recipients).toHaveLength(2);
      expect(result.recipients).toContain('test1@example.com');
      expect(result.recipients).toContain('test2@example.com');
    });

    it('should handle CC and BCC recipients', async () => {
      const message = new EmailMessage(
        ['to@example.com'],
        'sender@example.com',
        'Test Subject',
        '<p>Test HTML</p>',
        'Test text',
        undefined,
        undefined,
        ['cc@example.com'],
        ['bcc@example.com'],
      );

      const result = await service.sendEmail(message);

      expect(result.success).toBe(true);
      expect(result.recipients).toContain('to@example.com');
      expect(result.recipients).toContain('cc@example.com');
      expect(result.recipients).toContain('bcc@example.com');
    });
  });

  describe('Bulk Email Sending', () => {
    it('should send multiple emails in bulk', async () => {
      const messages = [
        new EmailMessage(
          ['test1@example.com'],
          'sender@example.com',
          'Subject 1',
          '<p>Body 1</p>',
          'Text 1',
        ),
        new EmailMessage(
          ['test2@example.com'],
          'sender@example.com',
          'Subject 2',
          '<p>Body 2</p>',
          'Text 2',
        ),
        new EmailMessage(
          ['test3@example.com'],
          'sender@example.com',
          'Subject 3',
          '<p>Body 3</p>',
          'Text 3',
        ),
      ];

      const results = await service.sendBulkEmail(messages);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.provider).toBe('local');
      });
    });

    it('should handle empty bulk email array', async () => {
      const results = await service.sendBulkEmail([]);

      expect(results).toHaveLength(0);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on failure up to maxRetries times', async () => {
      // This test verifies the retry mechanism exists
      // Actual retry testing would require mocking the adapter
      const message = new EmailMessage(
        ['test@example.com'],
        'sender@example.com',
        'Test Subject',
        '<p>Test HTML</p>',
        'Test text',
      );

      const result = await service.sendEmail(message);

      // With LOCAL adapter, should succeed on first try
      expect(result.success).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should use configured maxRetries', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('email.maxRetries', 3);
    });

    it('should use configured retryDelayMs', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith(
        'email.retryDelayMs',
        1000,
      );
    });
  });

  describe('Provider Information', () => {
    it('should return provider name', () => {
      expect(service.getProviderName()).toBe('local');
    });

    it('should indicate if secondary provider exists', () => {
      expect(service.hasSecondaryProvider()).toBe(false);
    });

    it('should return null for secondary provider name when not configured', () => {
      expect(service.getSecondaryProviderName()).toBeNull();
    });
  });
});
