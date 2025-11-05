import sgMail from '@sendgrid/mail';
import { EmailProviderAdapter } from './email-provider.adapter';
import { EmailMessage } from '../../../domain/shared/value-objects/email-message.vo';
import { EmailSendResult } from '../../../domain/shared/email.repository';
import { EmailProvider } from '../../../domain/shared/enums/email-provider.enum';

/**
 * SendGrid Email Provider Adapter
 * Uses SendGrid SDK for sending transactional emails
 */
export class SendGridAdapter extends EmailProviderAdapter {
  constructor(
    private readonly config: {
      apiKey: string;
    },
  ) {
    super(EmailProvider.SENDGRID);

    sgMail.setApiKey(this.config.apiKey);

    this.validateConfiguration();
    this.logger.log('SendGrid adapter initialized');
  }

  protected validateConfiguration(): void {
    if (!this.config.apiKey) {
      throw new Error('SendGrid API key is required');
    }

    if (!this.config.apiKey.startsWith('SG.')) {
      this.logger.warn(
        'SendGrid API key does not match expected format (should start with SG.)',
      );
    }
  }

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    this.logSendAttempt(message);

    try {
      // Convert EmailMessage to SendGrid format
      const msg: any = {
        from: this.parseEmailAddress(message.from),
        subject: message.subject,
        html: message.htmlBody,
        text: message.getTextBody(),
      };

      // Handle 'to' recipients
      if (Array.isArray(message.to)) {
        msg.to = message.to.map((email) => this.parseEmailAddress(email));
      } else {
        msg.to = this.parseEmailAddress(message.to);
      }

      // Handle 'cc' recipients
      if (message.cc) {
        msg.cc = Array.isArray(message.cc)
          ? message.cc.map((email) => this.parseEmailAddress(email))
          : this.parseEmailAddress(message.cc);
      }

      // Handle 'bcc' recipients
      if (message.bcc) {
        msg.bcc = Array.isArray(message.bcc)
          ? message.bcc.map((email) => this.parseEmailAddress(email))
          : this.parseEmailAddress(message.bcc);
      }

      // Handle reply-to
      if (message.replyTo) {
        msg.replyTo = this.parseEmailAddress(message.replyTo);
      }

      // Handle attachments
      if (message.attachments && message.attachments.length > 0) {
        msg.attachments = message.attachments.map((att) => ({
          filename: att.filename,
          content: Buffer.isBuffer(att.content)
            ? att.content.toString('base64')
            : att.content,
          type: att.contentType || 'application/octet-stream',
          disposition: att.cid ? 'inline' : 'attachment',
          contentId: att.cid,
        }));
      }

      const response = await sgMail.send(msg);

      // SendGrid returns array of responses, one per request
      if (!response || response.length === 0) {
        throw new Error('SendGrid did not return any response');
      }

      // Extract message ID from headers
      const messageId =
        response[0].headers['x-message-id'] ||
        `sendgrid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      this.logSendSuccess(messageId, message.getAllRecipients());
      return this.createSuccessResult(message, messageId);
    } catch (error) {
      this.logSendFailure(error, message.getAllRecipients());
      return this.createErrorResult(message, error);
    }
  }

  /**
   * Parse email address to SendGrid format
   * Supports both "email@example.com" and "Name <email@example.com>" formats
   */
  private parseEmailAddress(
    email: string,
  ): string | { email: string; name: string } {
    // Format: "Name <email@example.com>"
    const matches = email.match(/^(.+)\s*<([^>]+)>$/);
    if (matches) {
      return {
        name: matches[1].trim(),
        email: matches[2].trim(),
      };
    }

    // Simple format: just email
    return email.trim();
  }

  /**
   * Send bulk emails using SendGrid's multiple recipients feature
   * More efficient than sending individually
   */
  async sendBulkEmail(messages: EmailMessage[]): Promise<EmailSendResult[]> {
    this.logger.log(`Sending ${messages.length} emails in bulk via SendGrid`);

    // SendGrid allows sending to multiple recipients in a single API call
    // For true bulk operations, consider using SendGrid's batch API
    const results: EmailSendResult[] = [];

    // Convert to SendGrid bulk format
    const sgMessages = messages.map((message) => {
      const msg: any = {
        from: this.parseEmailAddress(message.from),
        subject: message.subject,
        html: message.htmlBody,
        text: message.getTextBody(),
      };

      if (Array.isArray(message.to)) {
        msg.to = message.to.map((email) => this.parseEmailAddress(email));
      } else {
        msg.to = this.parseEmailAddress(message.to);
      }

      if (message.cc) {
        msg.cc = Array.isArray(message.cc)
          ? message.cc.map((email) => this.parseEmailAddress(email))
          : this.parseEmailAddress(message.cc);
      }

      if (message.bcc) {
        msg.bcc = Array.isArray(message.bcc)
          ? message.bcc.map((email) => this.parseEmailAddress(email))
          : this.parseEmailAddress(message.bcc);
      }

      return msg;
    });

    try {
      const response = await sgMail.send(sgMessages);

      // Create results for each message
      messages.forEach((message, index) => {
        const messageId =
          response[index]?.headers?.['x-message-id'] ||
          `sendgrid-bulk-${Date.now()}-${index}`;

        results.push(this.createSuccessResult(message, messageId));
      });

      this.logger.log(`Bulk send complete: ${messages.length} emails sent`);
    } catch (error) {
      this.logger.error(`Bulk send failed: ${error.message}`);

      // Create error results for all messages
      messages.forEach((message) => {
        results.push(this.createErrorResult(message, error));
      });
    }

    return results;
  }
}
