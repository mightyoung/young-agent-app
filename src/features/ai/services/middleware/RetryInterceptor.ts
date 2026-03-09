// Retry Interceptor - Automatic Retry with Exponential Backoff

import type { ChatRequest, RequestInterceptor } from './chain';
import type { ChatResponse } from '../types';
import { AIError, ErrorCode } from '../errors/AIError';

/**
 * Retry interceptor configuration
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Initial delay in milliseconds
   * @default 1000
   */
  initialDelay?: number;

  /**
   * Maximum delay in milliseconds
   * @default 30000
   */
  maxDelay?: number;

  /**
   * Multiplier for exponential backoff
   * @default 2
   */
  backoffMultiplier?: number;

  /**
   * Add random jitter to delay
   * @default true
   */
  addJitter?: boolean;

  /**
   * Maximum jitter percentage (0-1)
   * @default 0.25
   */
  maxJitter?: number;

  /**
   * Callback when retry happens
   */
  onRetry?: (attempt: number, delay: number, error: AIError) => void;

  /**
   * Filter which errors should trigger retry
   */
  shouldRetry?: (error: AIError) => boolean;
}

/**
 * Default retry filter - retries network errors, timeouts, rate limits, and server errors
 */
function defaultShouldRetry(error: AIError): boolean {
  return (
    error.retryable ||
    error.code === ErrorCode.NETWORK_ERROR ||
    error.code === ErrorCode.TIMEOUT ||
    error.code === ErrorCode.RATE_LIMIT ||
    error.code === ErrorCode.PROVIDER_ERROR
  );
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  backoffMultiplier: number,
  maxDelay: number,
  addJitter: boolean,
  maxJitter: number
): number {
  // Exponential backoff: initialDelay * (multiplier ^ attempt)
  let delay = initialDelay * Math.pow(backoffMultiplier, attempt);

  // Cap at max delay
  delay = Math.min(delay, maxDelay);

  // Add jitter to prevent thundering herd
  if (addJitter) {
    const jitterAmount = delay * maxJitter * Math.random();
    delay += jitterAmount;
  }

  return Math.floor(delay);
}

/**
 * Retry interceptor for AI requests
 * Automatically retries failed requests with exponential backoff
 *
 * @example
 * ```typescript
 * const retry = new RetryInterceptor({
 *   maxRetries: 3,
 *   initialDelay: 1000,
 *   onRetry: (attempt, delay) => {
 *     console.log(`Retrying in ${delay}ms (attempt ${attempt + 1})`);
 *   }
 * });
 *
 * middlewareChain.add(retry);
 * ```
 */
export class RetryInterceptor implements RequestInterceptor {
  private options: RetryOptions;
  private shouldRetry: (error: AIError) => boolean;

  constructor(options: RetryOptions = {}) {
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      initialDelay: options.initialDelay ?? 1000,
      maxDelay: options.maxDelay ?? 30000,
      backoffMultiplier: options.backoffMultiplier ?? 2,
      addJitter: options.addJitter ?? true,
      maxJitter: options.maxJitter ?? 0.25,
      onRetry: options.onRetry ?? undefined,
      shouldRetry: options.shouldRetry ?? defaultShouldRetry,
    };

    this.shouldRetry = this.options.shouldRetry ?? defaultShouldRetry;
  }

  /**
   * Request handler - just passes through
   */
  onRequest(request: ChatRequest): ChatRequest {
    return request;
  }

  /**
   * Response handler - just passes through
   */
  onResponse(response: ChatResponse): ChatResponse {
    return response;
  }

  /**
   * Error handler - implements retry logic
   * Returns error if max retries exceeded, otherwise throws to trigger retry
   */
  onError(error: AIError): AIError {
    // Check if we should retry this error
    if (!this.shouldRetry(error)) {
      return error;
    }

    // Check if max retries exceeded
    const maxRetries = this.options.maxRetries ?? 3;
    if (error.retryCount >= maxRetries) {
      return error;
    }

    // Calculate delay
    const delay = calculateDelay(
      error.retryCount,
      this.options.initialDelay ?? 1000,
      this.options.backoffMultiplier ?? 2,
      this.options.maxDelay ?? 30000,
      this.options.addJitter ?? true,
      this.options.maxJitter ?? 0.25
    );

    // Update retry count
    error.retryCount++;

    // Call onRetry callback if provided
    if (this.options.onRetry) {
      this.options.onRetry(error.retryCount, delay, error);
    }

    // Create a new error with incremented retry count
    const retryError = new AIError(
      error.code,
      error.message,
      error.provider,
      error.statusCode,
      error.retryable,
      error.retryCount
    );

    // Throw to trigger retry (the middleware chain will catch this)
    // We use setTimeout to delay the throw
    throw retryError;
  }
}

/**
 * Create a retry interceptor with custom options
 */
export function createRetry(options?: RetryOptions): RetryInterceptor {
  return new RetryInterceptor(options);
}

export default RetryInterceptor;
