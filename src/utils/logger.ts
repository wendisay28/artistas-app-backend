import { createWriteStream } from 'fs';
import { join } from 'path';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  context?: string;
}

class Logger {
  private logStream: ReturnType<typeof createWriteStream> | null = null;
  private minLevel: LogLevel;
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor() {
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

    // En producción, crear archivo de logs
    if (process.env.NODE_ENV === 'production') {
      try {
        const logPath = join(process.cwd(), 'logs', 'app.log');
        this.logStream = createWriteStream(logPath, { flags: 'a' });
      } catch (error) {
        console.error('Failed to create log stream:', error);
      }
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.minLevel];
  }

  private formatMessage(entry: LogEntry): string {
    const { timestamp, level, message, data, context } = entry;
    const contextStr = context ? `[${context}]` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `${timestamp} [${level.toUpperCase()}]${contextStr} ${message}${dataStr}`;
  }

  private log(level: LogLevel, message: string, data?: any, context?: string) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context,
    };

    const formatted = this.formatMessage(entry);

    // Console output con colores
    const colors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';
    console.log(`${colors[level]}${formatted}${reset}`);

    // Escribir a archivo en producción
    if (this.logStream) {
      this.logStream.write(formatted + '\n');
    }
  }

  debug(message: string, data?: any, context?: string) {
    this.log('debug', message, data, context);
  }

  info(message: string, data?: any, context?: string) {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: any, context?: string) {
    this.log('warn', message, data, context);
  }

  error(message: string, error?: Error | any, context?: string) {
    const errorData = error instanceof Error
      ? {
          errorMessage: error.message,
          stack: error.stack,
          name: error.name,
        }
      : error;

    this.log('error', message, errorData, context);
  }

  // Helpers para logging HTTP
  http(method: string, url: string, status: number, duration?: number) {
    const durationStr = duration ? ` - ${duration}ms` : '';
    this.info(`${method} ${url} ${status}${durationStr}`, undefined, 'HTTP');
  }

  // Helper para logging de base de datos
  db(query: string, duration?: number) {
    const durationStr = duration ? ` (${duration}ms)` : '';
    this.debug(`Query: ${query}${durationStr}`, undefined, 'DB');
  }

  // Cerrar el stream al finalizar
  close() {
    if (this.logStream) {
      this.logStream.end();
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Cerrar el logger al salir
process.on('beforeExit', () => {
  logger.close();
});
