// Retry Utility - Exponential Backoff with Jitter

export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  shouldRetry?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  shouldRetry: (error: Error) => {
    // Retry on network errors, 429 (rate limit), 5xx server errors
    const message = error.message.toLowerCase();
    const shouldRetry =
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('rate limit') ||
      message.includes('429') ||
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504');
    return shouldRetry;
  },
};

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, options: RetryOptions): number {
  const delay = Math.min(
    options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt),
    options.maxDelayMs
  );
  // Add jitter (0-25% of delay)
  const jitter = delay * Math.random() * 0.25;
  return delay + jitter;
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<RetryResult<T>> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const data = await fn();
      return {
        success: true,
        data,
        attempts: attempt + 1,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt < opts.maxRetries && opts.shouldRetry?.(lastError)) {
        opts.onRetry?.(attempt + 1, lastError);
        const delay = calculateDelay(attempt, opts);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Don't retry further
      break;
    }
  }

  return {
    success: false,
    error: lastError!,
    attempts: opts.maxRetries + 1,
  };
}

/**
 * Create a retryable version of a function
 */
export function createRetryable<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: Partial<RetryOptions> = {}
): T {
  return ((...args: Parameters<T>) => withRetry(() => fn(...args), options)) as T;
}
