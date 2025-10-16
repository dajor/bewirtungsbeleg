'use client';

import { useEffect } from 'react';

/**
 * Initialize console logger on client side
 * This forwards browser console logs to the server for file logging
 */
export function ConsoleLoggerInit() {
  useEffect(() => {
    // Only in development
    if (process.env.NODE_ENV === 'development') {
      import('@/lib/console-logger').then((module) => {
        module.default.init();
      });
    }
  }, []);

  return null; // This component doesn't render anything
}
