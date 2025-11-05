import { EmailMessage } from '../../../domain/shared/value-objects/email-message.vo';
import {
  EmailRepository,
  EmailSendResult,
} from '../../../domain/shared/email.repository';
import { EmailProvider } from '../../../domain/shared/enums/email-provider.enum';
import { Logger } from '@nestjs/common';

/**
 * Abstract base class for email provider adapters
 * Implements Strategy pattern for different email providers
 */
export abstract class EmailProviderAdapter implements EmailRepository {
  protected readonly logger: Logger;
  protected readonly providerName: EmailProvider;

  constructor(providerName: EmailProvider) {
    this.providerName = providerName;
    this.logger = new Logger(`${providerName.toUpperCase()}Adapter`);
  }

  /**
   * Send a single email - must be implemented by concrete adapters
   */
  abstract sendEmail(message: EmailMessage): Promise<EmailSendResult>;

  /**
   * Send bulk emails - default implementation sends one by one
   * Override in concrete adapter if provider has optimized bulk send API
   */
  async sendBulkEmail(messages: EmailMessage[]): Promise<EmailSendResult[]> {
    this.logger.log(`Sending ${messages.length} emails in bulk`);

    const results: EmailSendResult[] = [];

    for (const message of messages) {
      try {
        const result = await this.sendEmail(message);
        results.push(result);
      } catch (error) {
        // Continue sending remaining emails even if one fails
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        results.push({
          success: false,
          provider: this.providerName,
          sentAt: new Date(),
          error: errorMessage,
          recipients: message.getAllRecipients(),
          subject: message.subject,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    this.logger.log(
      `Bulk send complete: ${successCount}/${messages.length} successful`,
    );

    return results;
  }

  /**
   * Validate provider configuration - can be overridden by concrete adapters
   */
  protected validateConfiguration(): void {
    // Default implementation - no validation
    // Override in concrete adapters to check API keys, etc.
  }

  /**
   * Create standardized error result
   */
  protected createErrorResult(
    message: EmailMessage,
    error: unknown,
  ): EmailSendResult {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      provider: this.providerName,
      sentAt: new Date(),
      error: errorMessage,
      recipients: message.getAllRecipients(),
      subject: message.subject,
    };
  }

  /**
   * Create standardized success result
   */
  protected createSuccessResult(
    message: EmailMessage,
    messageId: string,
  ): EmailSendResult {
    return {
      success: true,
      messageId,
      provider: this.providerName,
      sentAt: new Date(),
      recipients: message.getAllRecipients(),
      subject: message.subject,
    };
  }

  /**
   * Log email send attempt
   */
  protected logSendAttempt(message: EmailMessage): void {
    const recipients = message.getAllRecipients();
    this.logger.debug(
      `Attempting to send email to ${recipients.length} recipient(s): ${message.subject}`,
    );
  }

  /**
   * Log successful send
   */
  protected logSendSuccess(messageId: string, recipients: string[]): void {
    this.logger.log(
      `Email sent successfully (ID: ${messageId}) to ${recipients.length} recipient(s)`,
    );
  }

  /**
   * Log failed send
   */
  protected logSendFailure(error: unknown, recipients: string[]): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.logger.error(
      `Failed to send email to ${recipients.length} recipient(s): ${errorMessage}`,
    );
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return this.providerName;
  }
}
