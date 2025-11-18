import { post } from '../gestures/gestureBus';

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  timestampIso: string;
  tag: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

const MAX_BUFFER_SIZE = 1000;
const buffer: LogEntry[] = [];

function push(entry: LogEntry): void {
  buffer.push(entry);
  if (buffer.length > MAX_BUFFER_SIZE) {
    buffer.shift();
  }
}

function makeEntry(
  level: LogLevel,
  tag: string,
  message: string,
  data?: unknown,
): LogEntry {
  return {
    timestampIso: new Date().toISOString(),
    tag,
    level,
    message,
    data,
  };
}

export function hashForTelemetry(input: string, salt = 'hh_voice'): string {
  const text = `${salt}:${input.trim().toLowerCase()}`;
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return `h${Math.abs(hash)}`;
}

export const logger = {
  mp: {
    info(message: string, data?: unknown): void {
      logger.info('mp', message, data);
    },
    warn(message: string, data?: unknown): void {
      logger.warn('mp', message, data);
    },
    error(message: string, data?: unknown): void {
      logger.error('mp', message, data);
    },
  },
  info(tag: string, message: string, data?: unknown): void {
    const entry = makeEntry('info', tag, message, data);
    push(entry);
    post({
      intent: 'log',
      level: 'info',
      tag,
      message,
      data,
    });
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info(`[${entry.tag}] ${entry.message}`, entry.data ?? '');
    }
  },
  warn(tag: string, message: string, data?: unknown): void {
    const entry = makeEntry('warn', tag, message, data);
    push(entry);
    post({
      intent: 'log',
      level: 'warn',
      tag,
      message,
      data,
    });
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[${entry.tag}] ${entry.message}`, entry.data ?? '');
    }
  },
  error(tag: string, message: string, data?: unknown): void {
    const entry = makeEntry('error', tag, message, data);
    push(entry);
    post({
      intent: 'log',
      level: 'error',
      tag,
      message,
      data,
    });
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error(`[${entry.tag}] ${entry.message}`, entry.data ?? '');
    }
  },
  getBuffer(): LogEntry[] {
    return [...buffer];
  },
  clear(): void {
    buffer.length = 0;
  },
  download(filename = 'hellohands_logs.jsonl'): void {
    if (typeof window === 'undefined') return;
    const lines = buffer.map((entry) => JSON.stringify(entry)).join('\n');
    const blob = new Blob([lines], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  },
};

export default logger;
