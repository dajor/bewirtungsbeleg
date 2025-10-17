# Console Logs

This directory contains browser console logs forwarded from the development environment.

## How it works

In **development mode only**, all browser console output (`console.log`, `console.info`, `console.warn`, `console.error`, `console.debug`) is automatically forwarded to the server and saved to log files in this directory.

### Features

- ✅ All console methods are intercepted (log, info, warn, error, debug)
- ✅ Logs are batched and sent to server every 1 second
- ✅ Each log entry includes:
  - Timestamp
  - Log level
  - Message
  - URL/pathname where the log originated
  - User agent (browser info)
  - Full arguments (objects are serialized as JSON)

### Log File Format

Logs are saved to daily files: `console-YYYY-MM-DD.log`

Example log entry:
```
[2025-10-16T17:30:01.234Z] [INFO ] [/bewirtungsbeleg] 📝 Console logger initialized - logs will be saved to logs/ directory
[2025-10-16T17:30:05.678Z] [ERROR] [/bewirtungsbeleg] PDF conversion error: Object.defineProperty called on non-object
```

### Implementation

The console logging system consists of three parts:

1. **`src/lib/console-logger.ts`** - Client-side console interceptor
2. **`src/app/api/log-console/route.ts`** - Server-side API endpoint that writes logs to files
3. **`src/app/components/ConsoleLoggerInit.tsx`** - Component that initializes the logger

The logger is automatically initialized in `src/app/layout.tsx` when running in development mode.

### Disabling

Console logging is **automatically disabled** in production mode. To disable it in development, simply remove or comment out the `<ConsoleLoggerInit />` component from `src/app/layout.tsx`.

## Notes

- This directory is ignored by git (see `.gitignore`)
- Logs are stored as plain text files for easy viewing and searching
- The logger does not affect console output in the browser DevTools - all logs still appear normally
- Failed log requests to the server are silently ignored to avoid polluting the console
