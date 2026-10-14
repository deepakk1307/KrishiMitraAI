/**
 * Structured Logging Utility for KrishiMitra AI
 * Sanitizes API keys and sensitive tokens from log messages.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export class Logger {
  private formatMessage(level: LogLevel, message: string, meta?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const sanitized = this.sanitize(message);
    const metaStr = meta ? ` ${this.sanitize(JSON.stringify(meta))}` : '';
    return `[${level}] ${timestamp} - ${sanitized}${metaStr}`;
  }

  private sanitize(str: string): string {
    return str
      .replace(/AIzaSy[A-Za-z0-9_-]{33}/g, 'AIzaSy[REDACTED]')
      .replace(/key=[A-Za-z0-9_-]{20,}/gi, 'key=[REDACTED]')
      .replace(/Bearer\s+[A-Za-z0-9_.-]+/gi, 'Bearer [REDACTED]')
      .replace(/passwordHash['"]?\s*:\s*['"][^'"]+['"]/gi, 'passwordHash: "[REDACTED]"');
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage('DEBUG', message, meta));
    }
  }

  info(message: string, meta?: Record<string, any>): void {
    console.info(this.formatMessage('INFO', message, meta));
  }

  warn(message: string, meta?: Record<string, any>): void {
    console.warn(this.formatMessage('WARN', message, meta));
  }

  error(message: string, meta?: Record<string, any>): void {
    console.error(this.formatMessage('ERROR', message, meta));
  }
}

export const logger = new Logger();
