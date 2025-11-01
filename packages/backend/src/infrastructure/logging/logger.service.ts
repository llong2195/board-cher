import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

/**
 * Logger service with contextual logging
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private context?: string;

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: string) {
    const logContext = context || this.context || 'Application';
    console.log(
      `[${new Date().toISOString()}] [LOG] [${logContext}] ${message}`,
    );
  }

  error(message: string, trace?: string, context?: string) {
    const logContext = context || this.context || 'Application';
    console.error(
      `[${new Date().toISOString()}] [ERROR] [${logContext}] ${message}`,
    );
    if (trace) {
      console.error(`Stack trace: ${trace}`);
    }
  }

  warn(message: string, context?: string) {
    const logContext = context || this.context || 'Application';
    console.warn(
      `[${new Date().toISOString()}] [WARN] [${logContext}] ${message}`,
    );
  }

  debug(message: string, context?: string) {
    const logContext = context || this.context || 'Application';
    console.debug(
      `[${new Date().toISOString()}] [DEBUG] [${logContext}] ${message}`,
    );
  }

  verbose(message: string, context?: string) {
    const logContext = context || this.context || 'Application';
    console.log(
      `[${new Date().toISOString()}] [VERBOSE] [${logContext}] ${message}`,
    );
  }
}
