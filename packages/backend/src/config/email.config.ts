import { registerAs } from '@nestjs/config';

/**
 * Email Configuration
 * Supports multiple email providers with fallback
 */
export default registerAs('email', () => ({
  // Primary email provider
  provider: process.env.EMAIL_PROVIDER || 'local',

  // Secondary provider for fallback (optional)
  secondaryProvider: process.env.EMAIL_SECONDARY_PROVIDER || undefined,

  // Default 'from' address
  from: process.env.EMAIL_FROM || 'noreply@example.com',

  // Retry settings
  maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '3', 10),
  retryDelayMs: parseInt(process.env.EMAIL_RETRY_DELAY_MS || '1000', 10),

  // Rate limiting (emails per hour per user)
  rateLimit: parseInt(process.env.EMAIL_RATE_LIMIT || '100', 10),

  // AWS SES Configuration
  aws: {
    region: process.env.AWS_SES_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_SES_ACCESS_KEY || '',
    secretAccessKey: process.env.AWS_SES_SECRET_KEY || '',
  },

  // Brevo (Sendinblue) Configuration
  brevo: {
    apiKey: process.env.BREVO_API_KEY || '',
  },

  // Mailchimp Transactional (Mandrill) Configuration
  mailchimp: {
    apiKey: process.env.MAILCHIMP_API_KEY || '',
  },

  // SendGrid Configuration
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
  },

  // Resend Configuration
  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
  },

  // Local (Development) Configuration
  local: {
    logDirectory: process.env.LOCAL_EMAIL_LOG_DIR || './logs/emails',
    writeToFile: process.env.LOCAL_EMAIL_WRITE_TO_FILE !== 'false', // Default true
    writeToConsole: process.env.LOCAL_EMAIL_WRITE_TO_CONSOLE !== 'false', // Default true
  },

  // Template settings
  templates: {
    directory:
      process.env.EMAIL_TEMPLATES_DIR || 'src/infrastructure/email/templates',
    cacheTemplates:
      process.env.NODE_ENV === 'production' ||
      process.env.EMAIL_CACHE_TEMPLATES === 'true',
  },
}));
