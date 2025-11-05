import { CreateBatchOptions, CreateEmailOptions, Resend } from 'resend';
import { EmailProviderAdapter } from './email-provider.adapter';
import { EmailMessage } from '../../../domain/shared/value-objects/email-message.vo';
import { EmailSendResult } from '../../../domain/shared/email.repository';
import { EmailProvider } from '../../../domain/shared/enums/email-provider.enum';

/**
 * Resend Email Provider Adapter
 * Uses Resend SDK for sending transactional emails
 * Developer-friendly API with modern SDK
 */
export class ResendAdapter extends EmailProviderAdapter {
  private readonly resend: Resend;

  constructor(
    private readonly config: {
      apiKey: string;
    },
  ) {
    super(EmailProvider.RESEND);

    this.resend = new Resend(this.config.apiKey);

    this.validateConfiguration();
    this.logger.log('Resend adapter initialized');
  }

  protected validateConfiguration(): void {
    if (!this.config.apiKey) {
      throw new Error('Resend API key is required');
    }

    if (!this.config.apiKey.startsWith('re_')) {
      this.logger.warn(
        'Resend API key does not match expected format (should start with re_)',
      );
    }
  }

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    this.logSendAttempt(message);

    try {
      // Convert EmailMessage to Resend format
      const emailData: any = {
        from: message.from,
        subject: message.subject,
        html: message.htmlBody,
        text: message.getTextBody(),
      };

      // Handle 'to' recipients
      if (Array.isArray(message.to)) {
        emailData.to = message.to;
      } else {
        emailData.to = [message.to];
      }

      // Handle 'cc' recipients
      if (message.cc) {
        emailData.cc = Array.isArray(message.cc) ? message.cc : [message.cc];
      }

      // Handle 'bcc' recipients
      if (message.bcc) {
        emailData.bcc = Array.isArray(message.bcc)
          ? message.bcc
          : [message.bcc];
      }

      // Handle reply-to
      if (message.replyTo) {
        emailData.reply_to = message.replyTo;
      }

      // Handle attachments
      if (message.attachments && message.attachments.length > 0) {
        emailData.attachments = message.attachments.map((att) => ({
          filename: att.filename,
          content: Buffer.isBuffer(att.content)
            ? att.content
            : Buffer.from(att.content),
        }));
      }

      const response = await this.resend.emails.send(emailData);

      // Resend returns { id: string } on success
      if (!response || !response.data?.id) {
        throw new Error('Resend did not return a message ID');
      }

      const messageId = response.data.id;

      this.logSendSuccess(messageId, message.getAllRecipients());
      return this.createSuccessResult(message, messageId);
    } catch (error) {
      this.logSendFailure(error, message.getAllRecipients());
      return this.createErrorResult(message, error);
    }
  }

  /**
   * Send bulk emails using Resend's batch API
   * More efficient than sending individually
   */
  async sendBulkEmail(messages: EmailMessage[]): Promise<EmailSendResult[]> {
    this.logger.log(`Sending ${messages.length} emails in bulk via Resend`);

    const results: EmailSendResult[] = [];

    // Resend supports batch sending with emails.sendBatch
    const batchData: CreateBatchOptions = messages.map((message) => {
      const emailData: CreateEmailOptions = {
        from: message.from,
        subject: message.subject,
        html: message.htmlBody,
        text: message.getTextBody(),
        to: [],
      };

      if (Array.isArray(message.to)) {
        emailData.to = message.to;
      } else {
        emailData.to = [message.to];
      }

      if (message.cc) {
        emailData.cc = Array.isArray(message.cc) ? message.cc : [message.cc];
      }

      if (message.bcc) {
        emailData.bcc = Array.isArray(message.bcc)
          ? message.bcc
          : [message.bcc];
      }

      if (message.replyTo) {
        emailData.replyTo = message.replyTo;
      }

      if (message.attachments && message.attachments.length > 0) {
        emailData.attachments = message.attachments.map((att) => ({
          filename: att.filename,
          content: Buffer.isBuffer(att.content)
            ? att.content
            : Buffer.from(att.content),
        }));
      }

      return emailData;
    });

    try {
      const response = await this.resend.batch.send(batchData);

      // Resend returns { data: [{ id: string }, ...] } on success
      if (!response || !response.data) {
        throw new Error('Resend did not return batch results');
      }

      // Create results for each message
      messages.forEach((message, index) => {
        const messageId =
          response.data.data[index]?.id || `resend-bulk-${Date.now()}-${index}`;
        results.push(this.createSuccessResult(message, messageId));
      });

      this.logger.log(`Bulk send complete: ${messages.length} emails sent`);
    } catch (error) {
      this.logger.error(`Bulk send failed: `, error);

      // Create error results for all messages
      messages.forEach((message) => {
        results.push(this.createErrorResult(message, error));
      });
    }

    return results;
  }
}
