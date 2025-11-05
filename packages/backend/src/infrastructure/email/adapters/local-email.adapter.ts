import { promises as fs } from 'fs';
import * as path from 'path';
import { EmailProviderAdapter } from './email-provider.adapter';
import { EmailMessage } from '../../../domain/shared/value-objects/email-message.vo';
import { EmailSendResult } from '../../../domain/shared/email.repository';
import { EmailProvider } from '../../../domain/shared/enums/email-provider.enum';

/**
 * Local Email Provider Adapter
 * For development and testing - logs emails instead of sending
 * Can write to console, file, or both
 */
export class LocalEmailAdapter extends EmailProviderAdapter {
  private readonly logDirectory: string;
  private readonly writeToFile: boolean;
  private readonly writeToConsole: boolean;

  constructor(
    private readonly config: {
      logDirectory?: string;
      writeToFile?: boolean;
      writeToConsole?: boolean;
    } = {},
  ) {
    super(EmailProvider.LOCAL);

    this.logDirectory = this.config.logDirectory || './logs/emails';
    this.writeToFile = this.config.writeToFile !== false; // Default true
    this.writeToConsole = this.config.writeToConsole !== false; // Default true

    this.validateConfiguration();
    this.logger.log(
      `Local email adapter initialized (file: ${this.writeToFile}, console: ${this.writeToConsole})`,
    );
  }

  protected validateConfiguration(): void {
    if (!this.writeToFile && !this.writeToConsole) {
      throw new Error(
        'Local email adapter must write to file, console, or both',
      );
    }
  }

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    this.logSendAttempt(message);

    try {
      const messageId = this.generateMessageId();
      const timestamp = new Date().toISOString();
      const recipients = message.getAllRecipients();

      // Create email log entry
      const logEntry = {
        messageId,
        timestamp,
        provider: this.providerName,
        from: message.from,
        to: Array.isArray(message.to) ? message.to : [message.to],
        cc: message.cc
          ? Array.isArray(message.cc)
            ? message.cc
            : [message.cc]
          : undefined,
        bcc: message.bcc
          ? Array.isArray(message.bcc)
            ? message.bcc
            : [message.bcc]
          : undefined,
        replyTo: message.replyTo,
        subject: message.subject,
        htmlBody: message.htmlBody,
        textBody: message.getTextBody(),
        attachments: message.attachments?.map((att) => ({
          filename: att.filename,
          contentType: att.contentType,
          size: Buffer.isBuffer(att.content)
            ? att.content.length
            : att.content.length,
        })),
        recipientCount: recipients.length,
      };

      // Write to console
      if (this.writeToConsole) {
        this.logToConsole(logEntry);
      }

      // Write to file
      if (this.writeToFile) {
        await this.logToFile(logEntry, messageId);
      }

      this.logSendSuccess(messageId, recipients);
      return this.createSuccessResult(message, messageId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error : new Error(String(error));
      this.logSendFailure(errorMessage, message.getAllRecipients());
      return this.createErrorResult(message, errorMessage);
    }
  }

  /**
   * Log email to console with formatting
   */
  private logToConsole(logEntry: any): void {
    console.log('\n' + '='.repeat(80));
    console.log('📧 LOCAL EMAIL (Development Mode)');
    console.log('='.repeat(80));
    console.log(`Message ID: ${logEntry.messageId}`);
    console.log(`Timestamp: ${logEntry.timestamp}`);
    console.log(`From: ${logEntry.from}`);
    console.log(`To: ${logEntry.to.join(', ')}`);

    if (logEntry.cc) {
      console.log(`CC: ${logEntry.cc.join(', ')}`);
    }

    if (logEntry.bcc) {
      console.log(`BCC: ${logEntry.bcc.join(', ')}`);
    }

    if (logEntry.replyTo) {
      console.log(`Reply-To: ${logEntry.replyTo}`);
    }

    console.log(`Subject: ${logEntry.subject}`);
    console.log('-'.repeat(80));
    console.log('HTML Body:');
    console.log(
      logEntry.htmlBody.substring(0, 500) +
        (logEntry.htmlBody.length > 500 ? '...' : ''),
    );
    console.log('-'.repeat(80));
    console.log('Text Body:');
    console.log(
      logEntry.textBody.substring(0, 300) +
        (logEntry.textBody.length > 300 ? '...' : ''),
    );

    if (logEntry.attachments && logEntry.attachments.length > 0) {
      console.log('-'.repeat(80));
      console.log('Attachments:');
      logEntry.attachments.forEach((att: any, index: number) => {
        console.log(
          `  ${index + 1}. ${att.filename} (${att.contentType}, ${att.size} bytes)`,
        );
      });
    }

    console.log('='.repeat(80) + '\n');
  }

  /**
   * Log email to file
   */
  private async logToFile(logEntry: any, messageId: string): Promise<void> {
    try {
      // Ensure log directory exists
      await fs.mkdir(this.logDirectory, { recursive: true });

      // Create filename with timestamp
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = date
        .toISOString()
        .split('T')[1]
        .replace(/:/g, '-')
        .split('.')[0]; // HH-MM-SS
      const filename = `${dateStr}_${timeStr}_${messageId}.json`;
      const filepath = path.join(this.logDirectory, filename);

      // Write email to file as JSON
      await fs.writeFile(filepath, JSON.stringify(logEntry, null, 2), 'utf-8');

      this.logger.debug(`Email logged to file: ${filepath}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to write email to file: ${errorMessage}`);
      // Don't throw - we don't want to fail email sending if file writing fails
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `local-${timestamp}-${random}`;
  }

  /**
   * Clean up old log files (optional maintenance method)
   */
  async cleanupOldLogs(daysToKeep: number = 7): Promise<number> {
    if (!this.writeToFile) {
      return 0;
    }

    try {
      const files = await fs.readdir(this.logDirectory);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      let deletedCount = 0;

      for (const file of files) {
        if (!file.endsWith('.json')) {
          continue;
        }

        const filepath = path.join(this.logDirectory, file);
        const stats = await fs.stat(filepath);

        if (stats.mtime < cutoffDate) {
          await fs.unlink(filepath);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        this.logger.log(`Cleaned up ${deletedCount} old email log files`);
      }

      return deletedCount;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to cleanup old logs: ${errorMessage}`);
      return 0;
    }
  }
}
