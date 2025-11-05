import { LocalEmailAdapter } from '../../../../../src/infrastructure/email/adapters/local-email.adapter';
import { EmailMessage } from '../../../../../src/domain/shared/value-objects/email-message.vo';

// Mock fs/promises API
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    unlink: jest.fn(),
  },
  existsSync: jest.fn(),
}));

import { promises as fs, existsSync } from 'fs';

describe('LocalEmailAdapter', () => {
  let adapter: LocalEmailAdapter;
  const mockLogDirectory = './test-logs/emails';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fs.existsSync to return true (directory exists)
    (existsSync as jest.Mock).mockReturnValue(true);

    // Mock promises API
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.readdir as jest.Mock).mockResolvedValue([]);
    (fs.stat as jest.Mock).mockResolvedValue({
      mtime: new Date('2024-01-01'),
    });
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);

    adapter = new LocalEmailAdapter({
      logDirectory: mockLogDirectory,
      writeToFile: false,
      writeToConsole: true,
    });
  });

  describe('Initialization', () => {
    it('should create adapter with default config', () => {
      const defaultAdapter = new LocalEmailAdapter({
        logDirectory: './logs/emails',
        writeToFile: true,
        writeToConsole: true,
      });

      expect(defaultAdapter).toBeDefined();
      expect(defaultAdapter.getProviderName()).toBe('local');
    });

    it('should create log directory if it does not exist', async () => {
      (existsSync as jest.Mock).mockReturnValue(false);

      const fileAdapter = new LocalEmailAdapter({
        logDirectory: mockLogDirectory,
        writeToFile: true,
        writeToConsole: false,
      });

      const message = new EmailMessage(
        ['recipient@example.com'],
        'sender@example.com',
        'Test Subject',
        '<p>Test HTML body</p>',
      );

      await fileAdapter.sendEmail(message);

      expect(fs.mkdir).toHaveBeenCalledWith(mockLogDirectory, {
        recursive: true,
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
      expect(result.provider).toBe('local');
      expect(result.messageId).toMatch(/^local-/);
      expect(result.sentAt).toBeInstanceOf(Date);
      expect(result.recipients).toContain('recipient@example.com');
      expect(result.subject).toBe('Test Subject');
    });

    it('should handle multiple recipients', async () => {
      const message = new EmailMessage(
        ['user1@example.com', 'user2@example.com', 'user3@example.com'],
        'sender@example.com',
        'Test Subject',
        '<p>Test HTML body</p>',
      );

      const result = await adapter.sendEmail(message);

      expect(result.success).toBe(true);
      expect(result.recipients).toHaveLength(3);
      expect(result.recipients).toContain('user1@example.com');
      expect(result.recipients).toContain('user2@example.com');
      expect(result.recipients).toContain('user3@example.com');
    });

    it('should write email to file when writeToFile is enabled', async () => {
      const fileAdapter = new LocalEmailAdapter({
        logDirectory: mockLogDirectory,
        writeToFile: true,
        writeToConsole: false,
      });

      const message = new EmailMessage(
        ['recipient@example.com'],
        'sender@example.com',
        'Test Subject',
        '<p>Test HTML body</p>',
      );

      await fileAdapter.sendEmail(message);

      expect(fs.writeFile).toHaveBeenCalled();
      const writeCall = (fs.writeFile as jest.Mock).mock.calls[0];
      expect(writeCall[0]).toContain('.json');
      expect(typeof writeCall[1]).toBe('string');
    });

    it('should not write to file when writeToFile is disabled', async () => {
      const message = new EmailMessage(
        ['recipient@example.com'],
        'sender@example.com',
        'Test Subject',
        '<p>Test HTML body</p>',
      );

      await adapter.sendEmail(message);

      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should include all email fields', async () => {
      const message = new EmailMessage(
        ['recipient@example.com'],
        'sender@example.com',
        'Subject Line',
        '<h1>HTML Content</h1>',
        'Text Content',
        undefined, // attachments
        'reply-to@example.com', // replyTo
        ['cc@example.com'],
        ['bcc@example.com'],
      );

      const result = await adapter.sendEmail(message);

      expect(result.success).toBe(true);
      expect(result.recipients).toHaveLength(3); // to + cc + bcc
    });
  });

  describe('Bulk Email Sending', () => {
    it('should send multiple emails', async () => {
      const messages = [
        new EmailMessage(
          ['user1@example.com'],
          'sender@example.com',
          'Subject 1',
          '<p>Body 1</p>',
        ),
        new EmailMessage(
          ['user2@example.com'],
          'sender@example.com',
          'Subject 2',
          '<p>Body 2</p>',
        ),
      ];

      const results = await adapter.sendBulkEmail(messages);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[0].recipients).toContain('user1@example.com');
      expect(results[1].recipients).toContain('user2@example.com');
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', async () => {
      (fs.writeFile as jest.Mock).mockRejectedValueOnce(
        new Error('File system error'),
      );

      const fileAdapter = new LocalEmailAdapter({
        logDirectory: mockLogDirectory,
        writeToFile: true,
        writeToConsole: true,
      });

      const message = new EmailMessage(
        ['recipient@example.com'],
        'sender@example.com',
        'Test Subject',
        '<p>Test HTML body</p>',
      );

      const result = await fileAdapter.sendEmail(message);

      // Should still succeed even if file write fails
      expect(result.success).toBe(true);
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('Provider Information', () => {
    it('should return correct provider name', () => {
      expect(adapter.getProviderName()).toBe('local');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup old log files', async () => {
      (fs.readdir as jest.Mock).mockResolvedValue([
        'email-2024-01-01-abc.json',
        'email-2024-01-15-def.json',
      ]);

      const now = new Date();
      const nineDaysAgo = new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000);
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      (fs.stat as jest.Mock).mockResolvedValueOnce({
        mtime: nineDaysAgo, // 9 days old - should be deleted
      });
      (fs.stat as jest.Mock).mockResolvedValueOnce({
        mtime: fiveDaysAgo, // 5 days old - should be kept
      });

      const fileAdapter = new LocalEmailAdapter({
        logDirectory: mockLogDirectory,
        writeToFile: true,
        writeToConsole: false,
      });

      await fileAdapter.cleanupOldLogs(7); // Keep 7 days

      expect(fs.unlink).toHaveBeenCalledTimes(1);
    });
  });
});
