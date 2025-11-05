import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { EmailProviderAdapter } from './email-provider.adapter';
import { EmailMessage } from '../../../domain/shared/value-objects/email-message.vo';
import { EmailSendResult } from '../../../domain/shared/email.repository';
import { EmailProvider } from '../../../domain/shared/enums/email-provider.enum';

/**
 * AWS SES Email Provider Adapter
 * Uses AWS SDK v3 for sending emails via Amazon Simple Email Service
 */
export class AwsSesAdapter extends EmailProviderAdapter {
  private readonly sesClient: SESClient;

  constructor(
    private readonly config: {
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
    },
  ) {
    super(EmailProvider.AWS_SES);

    this.sesClient = new SESClient({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });

    this.validateConfiguration();
    this.logger.log(
      `AWS SES adapter initialized for region: ${this.config.region}`,
    );
  }

  protected validateConfiguration(): void {
    if (!this.config.region) {
      throw new Error('AWS SES region is required');
    }

    if (!this.config.accessKeyId) {
      throw new Error('AWS SES access key ID is required');
    }

    if (!this.config.secretAccessKey) {
      throw new Error('AWS SES secret access key is required');
    }
  }

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    this.logSendAttempt(message);

    try {
      // Convert EmailMessage to SES format
      const destination: any = {};

      // Handle 'to' addresses
      if (Array.isArray(message.to)) {
        destination.ToAddresses = message.to;
      } else {
        destination.ToAddresses = [message.to];
      }

      // Handle 'cc' addresses
      if (message.cc) {
        destination.CcAddresses = Array.isArray(message.cc)
          ? message.cc
          : [message.cc];
      }

      // Handle 'bcc' addresses
      if (message.bcc) {
        destination.BccAddresses = Array.isArray(message.bcc)
          ? message.bcc
          : [message.bcc];
      }

      const command = new SendEmailCommand({
        Source: message.from,
        Destination: destination,
        Message: {
          Subject: {
            Data: message.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: message.htmlBody,
              Charset: 'UTF-8',
            },
            Text: {
              Data: message.getTextBody(),
              Charset: 'UTF-8',
            },
          },
        },
        ReplyToAddresses: message.replyTo ? [message.replyTo] : undefined,
        // Note: AWS SES attachments require SendRawEmail with MIME
        // For production, consider using SendRawEmailCommand with nodemailer
      });

      const response = await this.sesClient.send(command);

      if (!response.MessageId) {
        throw new Error('AWS SES did not return a message ID');
      }

      this.logSendSuccess(response.MessageId, message.getAllRecipients());
      return this.createSuccessResult(message, response.MessageId);
    } catch (error) {
      this.logSendFailure(error, message.getAllRecipients());
      return this.createErrorResult(message, error);
    }
  }

  /**
   * Close the SES client connection
   */
  async close(): Promise<void> {
    this.sesClient.destroy();
    this.logger.log('AWS SES adapter closed');
  }
}
