import * as brevo from '@getbrevo/brevo';
import { EmailProviderAdapter } from './email-provider.adapter';
import { EmailMessage } from '../../../domain/shared/value-objects/email-message.vo';
import { EmailSendResult } from '../../../domain/shared/email.repository';
import { EmailProvider } from '../../../domain/shared/enums/email-provider.enum';

/**
 * Brevo (Sendinblue) Email Provider Adapter
 * Uses Brevo SDK for sending transactional emails
 */
export class BrevoAdapter extends EmailProviderAdapter {
  private readonly apiInstance: brevo.TransactionalEmailsApi;

  constructor(
    private readonly config: {
      apiKey: string;
    },
  ) {
    super(EmailProvider.BREVO);

    // Configure Brevo API
    const apiKey = brevo.TransactionalEmailsApiApiKeys.apiKey;
    apiKey.apiKey = this.config.apiKey;

    this.apiInstance = new brevo.TransactionalEmailsApi();

    this.validateConfiguration();
    this.logger.log('Brevo adapter initialized');
  }

  protected validateConfiguration(): void {
    if (!this.config.apiKey) {
      throw new Error('Brevo API key is required');
    }

    if (!this.config.apiKey.startsWith('xkeysib-')) {
      this.logger.warn(
        'Brevo API key does not match expected format (should start with xkeysib-)',
      );
    }
  }

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    this.logSendAttempt(message);

    try {
      // Convert EmailMessage to Brevo format
      const sendSmtpEmail = new brevo.SendSmtpEmail();

      // Parse sender
      sendSmtpEmail.sender = this.parseEmailAddress(message.from);

      // Parse recipients
      sendSmtpEmail.to = this.parseRecipients(message.to);

      if (message.cc) {
        sendSmtpEmail.cc = this.parseRecipients(message.cc);
      }

      if (message.bcc) {
        sendSmtpEmail.bcc = this.parseRecipients(message.bcc);
      }

      if (message.replyTo) {
        sendSmtpEmail.replyTo = this.parseEmailAddress(message.replyTo);
      }

      sendSmtpEmail.subject = message.subject;
      sendSmtpEmail.htmlContent = message.htmlBody;
      sendSmtpEmail.textContent = message.getTextBody();

      // Handle attachments if present
      if (message.attachments && message.attachments.length > 0) {
        sendSmtpEmail.attachment = message.attachments.map((att) => ({
          name: att.filename,
          content: Buffer.isBuffer(att.content)
            ? att.content.toString('base64')
            : att.content,
        }));
      }

      const response = await this.apiInstance.sendTransacEmail(sendSmtpEmail);

      if (!response.messageId) {
        throw new Error('Brevo did not return a message ID');
      }

      this.logSendSuccess(response.messageId, message.getAllRecipients());
      return this.createSuccessResult(message, response.messageId);
    } catch (error) {
      this.logSendFailure(error, message.getAllRecipients());
      return this.createErrorResult(message, error);
    }
  }

  /**
   * Parse email address to Brevo format
   */
  private parseEmailAddress(email: string): { email: string; name?: string } {
    // Simple format: just email
    if (!email.includes('<')) {
      return { email: email.trim() };
    }

    // Format: "Name <email@example.com>"
    const matches = email.match(/^(.+)\s*<([^>]+)>$/);
    if (matches) {
      return {
        name: matches[1].trim(),
        email: matches[2].trim(),
      };
    }

    return { email: email.trim() };
  }

  /**
   * Parse recipients to Brevo format
   */
  private parseRecipients(
    recipients: string | string[],
  ): Array<{ email: string; name?: string }> {
    const emails = Array.isArray(recipients) ? recipients : [recipients];
    return emails.map((email) => this.parseEmailAddress(email));
  }
}
