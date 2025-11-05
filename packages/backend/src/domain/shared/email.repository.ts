import { EmailMessage } from './value-objects/email-message.vo';

/**
 * EmailRepository Interface
 * Defines contract for email sending operations
 * Implementation follows Repository pattern for domain layer
 */
export interface EmailRepository {
  /**
   * Send a single email message
   * @param message The email message to send
   * @returns Promise that resolves when email is sent
   * @throws Error if email sending fails
   */
  sendEmail(message: EmailMessage): Promise<EmailSendResult>;

  /**
   * Send bulk emails to multiple recipients
   * More efficient than calling sendEmail multiple times
   * @param messages Array of email messages to send
   * @returns Promise that resolves with results for each message
   */
  sendBulkEmail(messages: EmailMessage[]): Promise<EmailSendResult[]>;
}

/**
 * Result of email sending operation
 */
export interface EmailSendResult {
  /**
   * Whether the email was sent successfully
   */
  success: boolean;

  /**
   * Message ID from the email provider (for tracking)
   */
  messageId?: string;

  /**
   * Email provider that handled the send
   */
  provider: string;

  /**
   * Timestamp when email was sent
   */
  sentAt: Date;

  /**
   * Error message if sending failed
   */
  error?: string;

  /**
   * Recipient email addresses
   */
  recipients: string[];

  /**
   * Subject of the email
   */
  subject: string;
}

/**
 * Email sending statistics
 */
export interface EmailStats {
  /**
   * Total emails sent
   */
  totalSent: number;

  /**
   * Total emails failed
   */
  totalFailed: number;

  /**
   * Success rate (0-1)
   */
  successRate: number;

  /**
   * Average sending time in milliseconds
   */
  averageSendTime: number;

  /**
   * Provider used
   */
  provider: string;
}
