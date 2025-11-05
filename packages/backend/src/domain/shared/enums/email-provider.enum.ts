/**
 * EmailProvider Enum
 * Supported email service providers
 */
export enum EmailProvider {
  /**
   * Amazon Simple Email Service
   * Cost: $0.10 per 1,000 emails
   * Best for: Production use at scale
   */
  AWS_SES = 'aws_ses',

  /**
   * Brevo (formerly Sendinblue)
   * Cost: Free tier 300 emails/day, $25/month for 20k emails
   * Best for: Development, staging, or small-scale production
   */
  BREVO = 'brevo',

  /**
   * Mailchimp Transactional (Mandrill)
   * Cost: $35/month for 50k emails
   * Best for: Marketing-focused email campaigns
   */
  MAILCHIMP = 'mailchimp',

  /**
   * SendGrid
   * Cost: $19.95/month for 50k emails
   * Best for: General transactional emails
   */
  SENDGRID = 'sendgrid',

  /**
   * Resend
   * Cost: $20/month for 50k emails
   * Best for: Developer-friendly API
   */
  RESEND = 'resend',

  /**
   * Local/Mock provider
   * Logs emails to console/file instead of sending
   * Best for: Development and testing
   */
  LOCAL = 'local',
}

/**
 * Get human-readable name for email provider
 */
export function getEmailProviderName(provider: EmailProvider): string {
  const names: Record<EmailProvider, string> = {
    [EmailProvider.AWS_SES]: 'Amazon SES',
    [EmailProvider.BREVO]: 'Brevo (Sendinblue)',
    [EmailProvider.MAILCHIMP]: 'Mailchimp Transactional',
    [EmailProvider.SENDGRID]: 'SendGrid',
    [EmailProvider.RESEND]: 'Resend',
    [EmailProvider.LOCAL]: 'Local (Development)',
  };
  return names[provider];
}

/**
 * Validate if provider string is valid EmailProvider
 */
export function isValidEmailProvider(
  provider: string,
): provider is EmailProvider {
  return Object.values(EmailProvider).includes(provider as EmailProvider);
}

/**
 * Parse string to EmailProvider with validation
 */
export function parseEmailProvider(provider: string): EmailProvider {
  const normalized = provider.toLowerCase().trim();

  if (!isValidEmailProvider(normalized)) {
    throw new Error(
      `Invalid email provider: ${provider}. Valid options are: ${Object.values(EmailProvider).join(', ')}`,
    );
  }

  return normalized as EmailProvider;
}
