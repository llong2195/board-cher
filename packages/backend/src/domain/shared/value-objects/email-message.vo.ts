/**
 * EmailMessage Value Object
 * Represents an email message with all necessary content for sending
 */
export class EmailMessage {
  constructor(
    public readonly to: string | string[],
    public readonly from: string,
    public readonly subject: string,
    public readonly htmlBody: string,
    public readonly textBody?: string,
    public readonly attachments?: EmailAttachment[],
    public readonly replyTo?: string,
    public readonly cc?: string | string[],
    public readonly bcc?: string | string[],
  ) {
    this.validate();
  }

  private validate(): void {
    // Validate 'to' addresses
    const toAddresses = Array.isArray(this.to) ? this.to : [this.to];
    if (toAddresses.length === 0) {
      throw new Error('At least one recipient email address is required');
    }
    toAddresses.forEach((email) => this.validateEmail(email, 'to'));

    // Validate 'from' address
    this.validateEmail(this.from, 'from');

    // Validate subject
    if (!this.subject || this.subject.trim().length === 0) {
      throw new Error('Email subject is required');
    }

    if (this.subject.length > 998) {
      throw new Error(
        'Email subject must be less than 998 characters (RFC 2822)',
      );
    }

    // Validate body
    if (!this.htmlBody || this.htmlBody.trim().length === 0) {
      throw new Error('Email HTML body is required');
    }

    // Validate optional fields
    if (this.replyTo) {
      this.validateEmail(this.replyTo, 'replyTo');
    }

    if (this.cc) {
      const ccAddresses = Array.isArray(this.cc) ? this.cc : [this.cc];
      ccAddresses.forEach((email) => this.validateEmail(email, 'cc'));
    }

    if (this.bcc) {
      const bccAddresses = Array.isArray(this.bcc) ? this.bcc : [this.bcc];
      bccAddresses.forEach((email) => this.validateEmail(email, 'bcc'));
    }

    // Validate attachments
    if (this.attachments) {
      this.attachments.forEach((attachment, index) => {
        if (!attachment.filename || attachment.filename.trim().length === 0) {
          throw new Error(`Attachment ${index} must have a filename`);
        }
        if (!attachment.content) {
          throw new Error(`Attachment ${index} must have content`);
        }
      });
    }
  }

  private validateEmail(email: string, fieldName: string): void {
    if (!email || email.trim().length === 0) {
      throw new Error(`${fieldName} email address is required`);
    }

    // RFC 5322 compliant email validation regex (simplified)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email address in ${fieldName}: ${email}`);
    }

    // Additional length validation
    if (email.length > 254) {
      throw new Error(
        `Email address in ${fieldName} is too long (max 254 characters)`,
      );
    }
  }

  /**
   * Get all recipient addresses (to + cc + bcc)
   */
  getAllRecipients(): string[] {
    const recipients: string[] = [];

    // Add 'to' addresses
    const toAddresses = Array.isArray(this.to) ? this.to : [this.to];
    recipients.push(...toAddresses);

    // Add 'cc' addresses
    if (this.cc) {
      const ccAddresses = Array.isArray(this.cc) ? this.cc : [this.cc];
      recipients.push(...ccAddresses);
    }

    // Add 'bcc' addresses
    if (this.bcc) {
      const bccAddresses = Array.isArray(this.bcc) ? this.bcc : [this.bcc];
      recipients.push(...bccAddresses);
    }

    return recipients;
  }

  /**
   * Get total recipient count
   */
  getRecipientCount(): number {
    return this.getAllRecipients().length;
  }

  /**
   * Get plain text body (use provided or strip HTML)
   */
  getTextBody(): string {
    if (this.textBody) {
      return this.textBody;
    }

    // Simple HTML stripping for fallback
    return this.htmlBody
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

/**
 * Email Attachment interface
 */
export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  encoding?: 'base64' | 'binary' | 'utf8';
  cid?: string; // Content-ID for inline images
}
