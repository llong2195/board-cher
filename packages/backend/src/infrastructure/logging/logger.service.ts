import { Injectable, Logger, LogLevel, Scope } from '@nestjs/common';

/**
 * Logger service with contextual logging
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends Logger {
  constructor() {
    super();
    const logLevel = process.env.LOG_LEVEL || 'log,error,warn,debug,verbose';
    this.localInstanceRef?.setLogLevels?.(logLevel.split(',') as LogLevel[]);
  }

  /**
   *
   * @param context
   */
  setContext(context: string) {
    this.context = context;
  }

  /**
   *
  log(message: string, context?: string) {
    const logContext = context || this.context || 'Application';
    super.log(message, logContext);
  }

  error(message: string, trace?: string, context?: string) {
    const logContext = context || this.context || 'Application';
    super.error(message, trace, logContext);

    if (trace) {
      super.error(`Stack trace: ${trace}`, logContext);
    }
  }

  warn(message: string, context?: string) {
    const logContext = context || this.context || 'Application';
    super.warn(message, logContext);
  }

  debug(message: string, context?: string) {
    const logContext = context || this.context || 'Application';
    super.debug(message, logContext);
  }

  verbose(message: string, context?: string) {
    const logContext = context || this.context || 'Application';
    super.verbose(message, logContext);
  }
  */
}
