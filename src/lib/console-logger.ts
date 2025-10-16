/**
 * Console Logger - Forwards browser console logs to server for file logging
 * This is a Next.js equivalent of vite-console-forward-plugin
 */

const LOG_ENDPOINT = '/api/log-console';

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  args: any[];
  userAgent: string;
  url: string;
}

class ConsoleLogger {
  private originalConsole: {
    log: typeof console.log;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
    debug: typeof console.debug;
  };

  private queue: LogEntry[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;
  private isEnabled: boolean = false;

  constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };
  }

  /**
   * Initialize console logging (only in development)
   */
  init() {
    // Only enable in development mode
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // Check if already initialized
    if (this.isEnabled) {
      return;
    }

    this.isEnabled = true;

    // Intercept console methods
    const levels: LogLevel[] = ['log', 'info', 'warn', 'error', 'debug'];

    levels.forEach((level) => {
      const originalMethod = this.originalConsole[level];

      (console as any)[level] = (...args: any[]) => {
        // Call original console method
        originalMethod.apply(console, args);

        // Log to server
        this.logToServer(level, args);
      };
    });

    console.info('📝 Console logger initialized - logs will be saved to logs/ directory');
  }

  /**
   * Log message to server
   */
  private logToServer(level: LogLevel, args: any[]) {
    const entry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      message: this.formatMessage(args),
      args: this.serializeArgs(args),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.queue.push(entry);

    // Debounce flush to avoid too many requests
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }

    this.flushTimeout = setTimeout(() => {
      this.flush();
    }, 1000); // Flush every 1 second
  }

  /**
   * Format message from arguments
   */
  private formatMessage(args: any[]): string {
    return args
      .map((arg) => {
        if (typeof arg === 'string') {
          return arg;
        }
        try {
          return JSON.stringify(arg);
        } catch (e) {
          return String(arg);
        }
      })
      .join(' ');
  }

  /**
   * Serialize arguments for JSON transport
   */
  private serializeArgs(args: any[]): any[] {
    return args.map((arg) => {
      if (arg instanceof Error) {
        return {
          name: arg.name,
          message: arg.message,
          stack: arg.stack,
        };
      }

      if (typeof arg === 'object' && arg !== null) {
        try {
          // Try to serialize, but catch circular references
          return JSON.parse(JSON.stringify(arg));
        } catch (e) {
          return String(arg);
        }
      }

      return arg;
    });
  }

  /**
   * Flush queued logs to server
   */
  private async flush() {
    if (this.queue.length === 0) {
      return;
    }

    const logs = [...this.queue];
    this.queue = [];

    try {
      await fetch(LOG_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs }),
      });
    } catch (error) {
      // Don't pollute console if logging fails
      this.originalConsole.error('Failed to send logs to server:', error);
    }
  }

  /**
   * Restore original console methods
   */
  restore() {
    if (!this.isEnabled) {
      return;
    }

    console.log = this.originalConsole.log;
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.debug = this.originalConsole.debug;

    this.isEnabled = false;
    this.originalConsole.info('📝 Console logger disabled');
  }
}

// Create singleton instance
const consoleLogger = new ConsoleLogger();

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  consoleLogger.init();
}

export default consoleLogger;
