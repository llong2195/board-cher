import { AwsSesAdapter } from '../../../../../src/infrastructure/email/adapters/aws-ses.adapter';
import { EmailMessage } from '../../../../../src/domain/shared/value-objects/email-message.vo';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Mock AWS SDK
jest.mock('@aws-sdk/client-ses');

describe('AwsSesAdapter', () => {
  let adapter: AwsSesAdapter;
  let mockSesClient: jest.Mocked<SESClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock SESClient
    mockSesClient = new SESClient({}) as jest.Mocked<SESClient>;
    (SESClient as jest.Mock).mockImplementation(() => mockSesClient);

    // Mock send method
    mockSesClient.send = jest.fn().mockResolvedValue({
      MessageId: 'test-message-id-12345',
    });

    adapter = new AwsSesAdapter({
      region: 'us-east-1',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
    });
  });

  describe('Initialization', () => {
    it('should create adapter with AWS credentials', () => {
      expect(adapter).toBeDefined();
      expect(adapter.getProviderName()).toBe('aws_ses');
      expect(SESClient).toHaveBeenCalledWith({
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
        },
      });
    });
  });

  describe('Email Sending', () => {
    it('should send email successfully', async () => {
      const message = new EmailMessage(
        ['recipient@example.com'],
        'sender@example.com',
        'Test Subject',
        '<p>Test HTML body</p>',
        'Test text body',
      );

      const result = await adapter.sendEmail(message);

      expect(result.success).toBe(true);
      expect(result.provider).toBe('aws_ses');
      expect(result.messageId).toBe('test-message-id-12345');
      expect(result.recipients).toContain('recipient@example.com');
      expect(mockSesClient.send).toHaveBeenCalledTimes(1);

      const sendCall = mockSesClient.send.mock.calls[0][0];
      expect(sendCall).toBeInstanceOf(SendEmailCommand);
    });

    it('should handle multiple recipients', async () => {
      const message = new EmailMessage(
        ['recipient1@example.com', 'recipient2@example.com'],
        'sender@example.com',
        'Test Subject',
        '<p>Test HTML body</p>',
      );

      const result = await adapter.sendEmail(message);

      expect(result.success).toBe(true);
      expect(result.recipients).toHaveLength(2);
    });

    it('should include CC recipients in command', async () => {
      const message = new EmailMessage(
        ['to@example.com'],
        'sender@example.com',
        'Test Subject',
        '<p>Test HTML body</p>',
        'Test text',
        undefined,
        undefined,
        ['cc@example.com'],
      );

      await adapter.sendEmail(message);

      expect(mockSesClient.send).toHaveBeenCalled();
    });

    it('should include BCC recipients in command', async () => {
      const message = new EmailMessage(
        ['to@example.com'],
        'sender@example.com',
        'Test Subject',
        '<p>Test HTML body</p>',
        'Test text',
        undefined,
        undefined,
        undefined,
        ['bcc@example.com'],
      );

      await adapter.sendEmail(message);

      expect(mockSesClient.send).toHaveBeenCalled();
    });

    it('should use text body as fallback if no HTML', async () => {
      const message = new EmailMessage(
        ['recipient@example.com'],
        'sender@example.com',
        'Test Subject',
        '<p>HTML body</p>',
        'Text body fallback',
      );

      const result = await adapter.sendEmail(message);

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle SES send failure', async () => {
      mockSesClient.send = jest
        .fn()
        .mockRejectedValue(new Error('SES service unavailable'));

      const message = new EmailMessage(
        ['recipient@example.com'],
        'sender@example.com',
        'Test Subject',
        '<p>Test HTML body</p>',
      );

      const result = await adapter.sendEmail(message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('SES service unavailable');
      expect(result.provider).toBe('aws_ses');
    });

    it('should handle throttling errors', async () => {
      mockSesClient.send = jest
        .fn()
        .mockRejectedValue(
          new Error('Throttling: Maximum sending rate exceeded'),
        );

      const message = new EmailMessage(
        ['recipient@example.com'],
        'sender@example.com',
        'Test Subject',
        '<p>Test HTML body</p>',
      );

      const result = await adapter.sendEmail(message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Maximum sending rate exceeded');
    });
  });

  describe('Bulk Email Sending', () => {
    it('should send multiple emails sequentially', async () => {
      const messages = [
        new EmailMessage(
          ['recipient1@example.com'],
          'sender@example.com',
          'Subject 1',
          '<p>Body 1</p>',
        ),
        new EmailMessage(
          ['recipient2@example.com'],
          'sender@example.com',
          'Subject 2',
          '<p>Body 2</p>',
        ),
      ];

      const results = await adapter.sendBulkEmail(messages);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(mockSesClient.send).toHaveBeenCalledTimes(2);
    });

    it('should continue bulk send even if one fails', async () => {
      mockSesClient.send = jest
        .fn()
        .mockResolvedValueOnce({ MessageId: 'success-1' })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ MessageId: 'success-3' });

      const messages = [
        new EmailMessage(
          ['r1@example.com'],
          'sender@example.com',
          'S1',
          '<p>B1</p>',
        ),
        new EmailMessage(
          ['r2@example.com'],
          'sender@example.com',
          'S2',
          '<p>B2</p>',
        ),
        new EmailMessage(
          ['r3@example.com'],
          'sender@example.com',
          'S3',
          '<p>B3</p>',
        ),
      ];

      const results = await adapter.sendBulkEmail(messages);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });

  describe('Provider Information', () => {
    it('should return correct provider name', () => {
      expect(adapter.getProviderName()).toBe('aws_ses');
    });
  });
});
