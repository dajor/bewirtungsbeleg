import { NextResponse } from 'next/server';
import { writeFile, appendFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, `console-${new Date().toISOString().split('T')[0]}.log`);

interface LogEntry {
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  timestamp: string;
  message: string;
  args: any[];
  userAgent: string;
  url: string;
}

interface LogRequest {
  logs: LogEntry[];
}

export async function POST(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const body = await request.json() as LogRequest;
    const { logs } = body;

    if (!logs || !Array.isArray(logs)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Ensure log directory exists
    if (!existsSync(LOG_DIR)) {
      await mkdir(LOG_DIR, { recursive: true });
    }

    // Format log entries
    const logLines = logs.map((entry) => {
      const level = entry.level.toUpperCase().padEnd(5);
      const timestamp = entry.timestamp;
      const url = new URL(entry.url).pathname;

      // Format message
      let message = entry.message;

      // If args contain objects, format them nicely
      if (entry.args.length > 0) {
        const formattedArgs = entry.args
          .map((arg) => {
            if (typeof arg === 'object' && arg !== null) {
              return JSON.stringify(arg, null, 2);
            }
            return String(arg);
          })
          .join(' ');

        if (formattedArgs !== message) {
          message = `${message}\n${formattedArgs}`;
        }
      }

      return `[${timestamp}] [${level}] [${url}] ${message}`;
    }).join('\n');

    // Append to log file
    await appendFile(LOG_FILE, logLines + '\n');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing logs:', error);
    return NextResponse.json(
      { error: 'Failed to write logs' },
      { status: 500 }
    );
  }
}
