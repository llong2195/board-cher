import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailMessage } from '../../domain/shared/value-objects/email-message.vo';
import {
  EmailRepository,
  EmailSendResult,
} from '../../domain/shared/email.repository';
import {
  EmailProvider,
  parseEmailProvider,
} from '../../domain/shared/enums/email-provider.enum';
import { EmailProviderAdapter } from '../../infrastructure/email/adapters/email-provider.adapter';
import { AwsSesAdapter } from '../../infrastructure/email/adapters/aws-ses.adapter';
import { BrevoAdapter } from '../../infrastructure/email/adapters/brevo.adapter';
import { MailchimpAdapter } from '../../infrastructure/email/adapters/mailchimp.adapter';
import { SendGridAdapter } from '../../infrastructure/email/adapters/sendgrid.adapter';
import { ResendAdapter } from '../../infrastructure/email/adapters/resend.adapter';
import { LocalEmailAdapter } from '../../infrastructure/email/adapters/local-email.adapter';

/**
 * EmailService - Application layer service for email operations
 * Implements Factory pattern for provider selection
 * Includes retry logic and fallback to secondary provider
 */
@Injectable()
export class EmailService implements EmailRepository {
  private readonly logger = new Logger(EmailService.name);
  private readonly primaryAdapter: EmailProviderAdapter;
  private readonly secondaryAdapter?: EmailProviderAdapter;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(private readonly configService: ConfigService) {
    this.maxRetries = this.configService.get<number>('email.maxRetries', 3);
    this.retryDelayMs = this.configService.get<number>(
      'email.retryDelayMs',
      1000,
    );

    // Create primary adapter
    const primaryProvider = this.configService.get<string>(
      'email.provider',
      'local',
    );
    this.primaryAdapter = this.createAdapter(primaryProvider);

    // Create secondary adapter if configured (for fallback)
    const secondaryProvider = this.configService.get<string>(
      'email.secondaryProvider',
    );
    if (secondaryProvider) {
      this.secondaryAdapter = this.createAdapter(secondaryProvider);
      this.logger.log(
        `Fallback provider configured: ${secondaryProvider.toUpperCase()}`,
      );
    }

    this.logger.log(
      `Email service initialized with primary provider: ${primaryProvider.toUpperCase()}`,
    );
  }

  /**
   * Factory method to create email provider adapter
   */
  private createAdapter(providerName: string): EmailProviderAdapter {
    const provider = parseEmailProvider(providerName);

    switch (provider) {
      case EmailProvider.AWS_SES:
        return new AwsSesAdapter({
          region: this.configService.getOrThrow<string>('email.aws.region'),
          accessKeyId: this.configService.getOrThrow<string>(
            'email.aws.accessKeyId',
          ),
          secretAccessKey: this.configService.getOrThrow<string>(
            'email.aws.secretAccessKey',
          ),
        });

      case EmailProvider.BREVO:
        return new BrevoAdapter({
          apiKey: this.configService.getOrThrow<string>('email.brevo.apiKey'),
        });

      case EmailProvider.MAILCHIMP:
        return new MailchimpAdapter({
          apiKey: this.configService.getOrThrow<string>(
            'email.mailchimp.apiKey',
          ),
        });

      case EmailProvider.SENDGRID:
        return new SendGridAdapter({
          apiKey: this.configService.getOrThrow<string>(
            'email.sendgrid.apiKey',
          ),
        });

      case EmailProvider.RESEND:
        return new ResendAdapter({
          apiKey: this.configService.getOrThrow<string>('email.resend.apiKey'),
        });

      case EmailProvider.LOCAL:
        return new LocalEmailAdapter({
          logDirectory: this.configService.get<string>(
            'email.local.logDirectory',
            './logs/emails',
          ),
          writeToFile: this.configService.get<boolean>(
            'email.local.writeToFile',
            true,
          ),
          writeToConsole: this.configService.get<boolean>(
            'email.local.writeToConsole',
            true,
          ),
        });

      default:
        throw new Error(`Unsupported email provider: ${provider}`);
    }
  }

  /**
   * Send email with retry logic and fallback
   */
  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    // Try primary provider with retries
    const primaryResult = await this.sendWithRetry(
      message,
      this.primaryAdapter,
      this.maxRetries,
    );

    if (primaryResult.success) {
      return primaryResult;
    }

    // If primary failed and secondary is configured, try secondary provider
    if (this.secondaryAdapter) {
      this.logger.warn(
        `Primary provider failed, attempting fallback to secondary provider`,
      );

      const secondaryResult = await this.sendWithRetry(
        message,
        this.secondaryAdapter,
        this.maxRetries,
      );

      if (secondaryResult.success) {
        this.logger.log(
          `Email sent successfully via fallback provider: ${secondaryResult.messageId}`,
        );
        return secondaryResult;
      }

      // Both providers failed
      this.logger.error(
        `Both primary and secondary providers failed to send email`,
      );
      return secondaryResult;
    }

    // No secondary provider, return primary failure
    return primaryResult;
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmail(messages: EmailMessage[]): Promise<EmailSendResult[]> {
    this.logger.log(`Sending bulk email: ${messages.length} messages`);

    // Use primary adapter for bulk send
    try {
      const results = await this.primaryAdapter.sendBulkEmail(messages);
      const successCount = results.filter((r) => r.success).length;
      this.logger.log(
        `Bulk send complete: ${successCount}/${messages.length} successful`,
      );
      return results;
    } catch (error) {
      this.logger.error(
        `Bulk send failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      // Return error results for all messages
      return messages.map((message) => ({
        success: false,
        provider: this.primaryAdapter.getProviderName(),
        sentAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        recipients: message.getAllRecipients(),
        subject: message.subject,
      }));
    }
  }

  /**
   * Send email with retry logic (exponential backoff)
   */
  private async sendWithRetry(
    message: EmailMessage,
    adapter: EmailProviderAdapter,
    maxRetries: number,
  ): Promise<EmailSendResult> {
    let lastResult: EmailSendResult | null = null;
    let retryDelay = this.retryDelayMs;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await adapter.sendEmail(message);

        if (result.success) {
          if (attempt > 1) {
            this.logger.log(
              `Email sent successfully on attempt ${attempt}/${maxRetries}`,
            );
          }
          return result;
        }

        lastResult = result;

        // If this was the last attempt, don't wait
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retry (exponential backoff)
        this.logger.warn(
          `Email send failed (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay}ms...`,
        );
        await this.sleep(retryDelay);

        // Exponential backoff: double the delay for next retry
        retryDelay *= 2;
      } catch (error) {
        this.logger.error(
          `Exception during email send attempt ${attempt}/${maxRetries}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );

        lastResult = {
          success: false,
          provider: adapter.getProviderName(),
          sentAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
          recipients: message.getAllRecipients(),
          subject: message.subject,
        };

        if (attempt < maxRetries) {
          await this.sleep(retryDelay);
          retryDelay *= 2;
        }
      }
    }

    // All retries failed
    this.logger.error(
      `Failed to send email after ${maxRetries} attempts: ${lastResult?.error}`,
    );
    return (
      lastResult || {
        success: false,
        provider: adapter.getProviderName(),
        sentAt: new Date(),
        error: 'All retries failed',
        recipients: message.getAllRecipients(),
        subject: message.subject,
      }
    );
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current provider name
   */
  getProviderName(): string {
    return this.primaryAdapter.getProviderName();
  }

  /**
   * Check if secondary provider is configured
   */
  hasSecondaryProvider(): boolean {
    return !!this.secondaryAdapter;
  }

  /**
   * Get secondary provider name (if configured)
   */
  getSecondaryProviderName(): string | null {
    return this.secondaryAdapter
      ? this.secondaryAdapter.getProviderName()
      : null;
  }
}
