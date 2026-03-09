// Logger Interceptor - Request/Response Logging Middleware

import type { ChatRequest, RequestInterceptor } from './chain';
import type { ChatResponse } from '../types';
import { AIError, ErrorCode } from '../errors/AIError';

/**
 * Logger interceptor configuration
 */
export interface LoggerOptions {
  /**
   * Enable request logging
   */
  logRequests?: boolean;

  /**
   * Enable response logging
   */
  logResponses?: boolean;

  /**
   * Enable error logging
   */
  logErrors?: boolean;

  /**
   * Custom log function
   */
  logger?: (message: string, data?: Record<string, unknown>) => void;

  /**
   * Include message content in logs (careful with sensitive data)
   */
  includeContent?: boolean;
}

/**
 * Default logger using console
 */
function defaultLogger(message: string, data?: Record<string, unknown>): void {
  if (data) {
    console.log(`[AI Logger] ${message}`, data);
  } else {
    console.log(`[AI Logger] ${message}`);
  }
}

/**
 * Logger interceptor for AI requests
 * Logs all requests, responses, and errors
 *
 * @example
 * ```typescript
 * const logger = new LoggerInterceptor({
 *   logRequests: true,
 *   logResponses: true,
 *   logErrors: true,
 * });
 *
 * middlewareChain.add(logger);
 * ```
 */
export class LoggerInterceptor implements RequestInterceptor {
  private options: LoggerOptions;
  private log: (message: string, data?: Record<string, unknown>) => void;

  constructor(options: LoggerOptions = {}) {
    this.options = {
      logRequests: options.logRequests ?? true,
      logResponses: options.logResponses ?? true,
      logErrors: options.logErrors ?? true,
      includeContent: options.includeContent ?? false,
      logger: options.logger ?? defaultLogger,
    };
    this.log = this.options.logger!;
  }

  /**
   * Log incoming request
   */
  onRequest(request: ChatRequest): ChatRequest {
    if (!this.options.logRequests) {
      return request;
    }

    const logData: Record<string, unknown> = {
      messageCount: request.messages.length,
      model: request.options?.model || 'default',
      temperature: request.options?.temperature,
      maxTokens: request.options?.maxTokens,
      hasTools: !!(request.options?.tools && request.options.tools.length > 0),
    };

    // Optionally include message content preview
    if (this.options.includeContent) {
      logData.messages = request.messages.map((m) => ({
        role: m.role,
        content: m.content.substring(0, 100),
      }));
    }

    this.log('Request started', logData);
    return request;
  }

  /**
   * Log response
   */
  onResponse(response: ChatResponse): ChatResponse {
    if (!this.options.logResponses) {
      return response;
    }

    const logData: Record<string, unknown> = {
      contentLength: response.content.length,
      hasToolCalls: !!(response.toolCalls && response.toolCalls.length > 0),
    };

    if (response.usage) {
      logData.usage = {
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
      };
    }

    this.log('Response received', logData);
    return response;
  }

  /**
   * Log error
   */
  onError(error: AIError): AIError {
    if (!this.options.logErrors) {
      return error;
    }

    const logData: Record<string, unknown> = {
      code: error.code,
      message: error.message,
      provider: error.provider,
      statusCode: error.statusCode,
      retryable: error.retryable,
      retryCount: error.retryCount,
    };

    // Add extra context based on error type
    switch (error.code) {
      case ErrorCode.API_KEY_MISSING:
      case ErrorCode.API_KEY_INVALID:
        logData.action = 'Check API key configuration';
        break;
      case ErrorCode.RATE_LIMIT:
        logData.action = 'Wait before retrying';
        break;
      case ErrorCode.NETWORK_ERROR:
      case ErrorCode.TIMEOUT:
        logData.action = 'Check network connection';
        break;
      case ErrorCode.PROVIDER_ERROR:
        logData.action = 'Provider may be experiencing issues';
        break;
    }

    this.log('Error occurred', logData);
    return error;
  }
}

/**
 * Create a logger with custom options
 */
export function createLogger(options?: LoggerOptions): LoggerInterceptor {
  return new LoggerInterceptor(options);
}

export default LoggerInterceptor;
