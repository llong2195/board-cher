import mailchimp from '@mailchimp/mailchimp_transactional';
import { EmailProviderAdapter } from './email-provider.adapter';
import { EmailMessage } from '../../../domain/shared/value-objects/email-message.vo';
import { EmailSendResult } from '../../../domain/shared/email.repository';
import { EmailProvider } from '../../../domain/shared/enums/email-provider.enum';

/**
 * Mailchimp Transactional (Mandrill) Email Provider Adapter
 * Uses Mailchimp Transactional API for sending emails
 */
export class MailchimpAdapter extends EmailProviderAdapter {
  private readonly client: any;

  constructor(
    private readonly config: {
      apiKey: string;
    },
  ) {
    super(EmailProvider.MAILCHIMP);

    this.client = mailchimp(this.config.apiKey);

    this.validateConfiguration();
    this.logger.log('Mailchimp Transactional adapter initialized');
  }

  protected validateConfiguration(): void {
    if (!this.config.apiKey) {
      throw new Error('Mailchimp Transactional API key is required');
    }

    if (!this.config.apiKey.startsWith('md-')) {
      this.logger.warn(
        'Mailchimp Transactional API key does not match expected format (should start with md-)',
      );
    }
  }

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    this.logSendAttempt(message);

    try {
      // Convert EmailMessage to Mandrill format
      const mandrillMessage: any = {
        from_email: this.extractEmail(message.from),
        from_name: this.extractName(message.from),
        subject: message.subject,
        html: message.htmlBody,
        text: message.getTextBody(),
        to: this.parseRecipients(message.to, 'to'),
        headers: message.replyTo ? { 'Reply-To': message.replyTo } : undefined,
      };

      // Add CC recipients
      if (message.cc) {
        const ccRecipients = this.parseRecipients(message.cc, 'cc');
        mandrillMessage.to.push(...ccRecipients);
      }

      // Add BCC recipients
      if (message.bcc) {
        const bccRecipients = this.parseRecipients(message.bcc, 'bcc');
        mandrillMessage.to.push(...bccRecipients);
      }

      // Add attachments
      if (message.attachments && message.attachments.length > 0) {
        mandrillMessage.attachments = message.attachments.map((att) => ({
          type: att.contentType || 'application/octet-stream',
          name: att.filename,
          content: Buffer.isBuffer(att.content)
            ? att.content.toString('base64')
            : att.content,
        }));
      }

      const response = await this.client.messages.send({
        message: mandrillMessage,
      });

      // Mandrill returns array of results, one per recipient
      if (!response || response.length === 0) {
        throw new Error('Mailchimp Transactional did not return any results');
      }

      // Check if any sends were rejected
      const rejected = response.filter(
        (r: any) => r.status === 'rejected' || r.status === 'invalid',
      );

      if (rejected.length > 0) {
        const rejectReasons = rejected
          .map((r: any) => `${r.email}: ${r.reject_reason}`)
          .join(', ');
        throw new Error(`Some recipients were rejected: ${rejectReasons}`);
      }

      // Use first result's ID as the message ID
      const messageId = response[0]._id || response[0].email;

      this.logSendSuccess(messageId, message.getAllRecipients());
      return this.createSuccessResult(message, messageId);
    } catch (error) {
      this.logSendFailure(error, message.getAllRecipients());
      return this.createErrorResult(message, error);
    }
  }

  /**
   * Parse recipients to Mandrill format
   */
  private parseRecipients(
    recipients: string | string[],
    type: 'to' | 'cc' | 'bcc',
  ): Array<{ email: string; name?: string; type: string }> {
    const emails = Array.isArray(recipients) ? recipients : [recipients];
    return emails.map((email) => ({
      email: this.extractEmail(email),
      name: this.extractName(email),
      type,
    }));
  }

  /**
   * Extract email address from string (handles "Name <email>" format)
   */
  private extractEmail(emailString: string): string {
    const matches = emailString.match(/<([^>]+)>/);
    return matches ? matches[1].trim() : emailString.trim();
  }

  /**
   * Extract name from email string (handles "Name <email>" format)
   */
  private extractName(emailString: string): string | undefined {
    const matches = emailString.match(/^(.+)\s*<[^>]+>$/);
    return matches ? matches[1].trim() : undefined;
  }
}
