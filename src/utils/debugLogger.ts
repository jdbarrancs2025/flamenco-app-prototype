// Debug logger utility for iOS audio debugging
// Shows logs on-screen for mobile testing

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: number;
  level: LogLevel;
  tag: string;
  message: string;
  data?: unknown;
}

class DebugLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private listeners: Set<(logs: LogEntry[]) => void> = new Set();
  private enabled = true;

  constructor() {
    // Check URL param to enable/disable
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      // Enable by default, disable with ?debug=false
      this.enabled = params.get('debug') !== 'false';
    }
  }

  private addLog(level: LogLevel, tag: string, message: string, data?: unknown) {
    if (!this.enabled) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      tag,
      message,
      data,
    };

    this.logs.push(entry);

    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console for Safari dev tools
    const timeStr = new Date(entry.timestamp).toISOString().substr(11, 12);
    const prefix = `[${timeStr}][${tag}]`;

    switch (level) {
      case 'error':
        console.error(prefix, message, data ?? '');
        break;
      case 'warn':
        console.warn(prefix, message, data ?? '');
        break;
      case 'debug':
        console.debug(prefix, message, data ?? '');
        break;
      default:
        console.log(prefix, message, data ?? '');
    }

    // Notify listeners
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  info(tag: string, message: string, data?: unknown) {
    this.addLog('info', tag, message, data);
  }

  warn(tag: string, message: string, data?: unknown) {
    this.addLog('warn', tag, message, data);
  }

  error(tag: string, message: string, data?: unknown) {
    this.addLog('error', tag, message, data);
  }

  debug(tag: string, message: string, data?: unknown) {
    this.addLog('debug', tag, message, data);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.add(listener);
    // Send current logs immediately
    listener([...this.logs]);
    return () => this.listeners.delete(listener);
  }

  clear() {
    this.logs = [];
    this.listeners.forEach(listener => listener([]));
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

// Singleton instance
export const debugLog = new DebugLogger();

// Export types
export type { LogEntry, LogLevel };
