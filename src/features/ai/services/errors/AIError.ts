// AI Error - Unified Error Type for AI Services

import type { ProviderType } from '../types';

/**
 * Error codes for AI services
 */
export enum ErrorCode {
  API_KEY_MISSING = 'API_KEY_MISSING',
  API_KEY_INVALID = 'API_KEY_INVALID',
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Unified error class for AI services
 * Provides consistent error handling across all providers
 *
 * @example
 * ```typescript
 * throw new AIError(
 *   ErrorCode.API_KEY_INVALID,
 *   'API key is invalid',
 *   'openai',
 *   401
 * );
 * ```
 */
export class AIError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public provider?: ProviderType | string,
    public statusCode?: number,
    public retryable: boolean = false,
    public retryCount: number = 0
  ) {
    super(message);
    this.name = 'AIError';
    Error.captureStackTrace?.(this, AIError);
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      provider: this.provider,
      statusCode: this.statusCode,
      retryable: this.retryable,
      retryCount: this.retryCount,
      stack: this.stack,
    };
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return this.retryable && this.retryCount < 3;
  }

  /**
   * Create AIError from axios error
   */
  static fromAxios(error: unknown, provider?: ProviderType): AIError {
    const axiosError = error as { response?: { status?: number }; code?: string; message?: string };

    const status = axiosError.response?.status;

    if (status === 401) {
      return new AIError(
        ErrorCode.API_KEY_INVALID,
        'API key is invalid',
        provider,
        401,
        false
      );
    }

    if (status === 403) {
      return new AIError(
        ErrorCode.API_KEY_INVALID,
        'API key is forbidden',
        provider,
        403,
        false
      );
    }

    if (status === 429) {
      return new AIError(
        ErrorCode.RATE_LIMIT,
        'Rate limit exceeded',
        provider,
        429,
        true
      );
    }

    if (status && status >= 500) {
      return new AIError(
        ErrorCode.PROVIDER_ERROR,
        'Provider server error',
        provider,
        status,
        true
      );
    }

    if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
      return new AIError(
        ErrorCode.TIMEOUT,
        'Request timeout',
        provider,
        undefined,
        true
      );
    }

    if (axiosError.code === 'ERR_NETWORK' || axiosError.code === 'ENOTFOUND') {
      return new AIError(
        ErrorCode.NETWORK_ERROR,
        'Network error',
        provider,
        undefined,
        true
      );
    }

    return new AIError(
      ErrorCode.UNKNOWN,
      axiosError.message || 'Unknown error',
      provider,
      status,
      false
    );
  }

  /**
   * Create AIError from generic error
   */
  static fromError(error: unknown, provider?: ProviderType): AIError {
    if (error instanceof AIError) {
      return error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';

    // Check for common error patterns
    if (message.includes('API key') || message.includes('api key')) {
      if (message.includes('not found') || message.includes('missing')) {
        return new AIError(ErrorCode.API_KEY_MISSING, message, provider, undefined, false);
      }
      return new AIError(ErrorCode.API_KEY_INVALID, message, provider, undefined, false);
    }

    if (message.includes('rate limit') || message.includes('Rate limit')) {
      return new AIError(ErrorCode.RATE_LIMIT, message, provider, 429, true);
    }

    if (message.includes('timeout') || message.includes('Timeout')) {
      return new AIError(ErrorCode.TIMEOUT, message, provider, undefined, true);
    }

    if (message.includes('network') || message.includes('Network')) {
      return new AIError(ErrorCode.NETWORK_ERROR, message, provider, undefined, true);
    }

    return new AIError(ErrorCode.UNKNOWN, message, provider, undefined, false);
  }
}

export default AIError;
