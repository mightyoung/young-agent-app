// Middleware Chain - Request/Response Interceptor System

import type { Message, ChatOptions, ChatResponse } from '../types';
import { AIError, ErrorCode } from '../errors/AIError';

/**
 * Chat request structure
 */
export interface ChatRequest {
  messages: Message[];
  options: ChatOptions;
}

/**
 * Request interceptor interface
 * Implement this to add custom middleware logic
 *
 * @example
 * ```typescript
 * class LoggingInterceptor implements RequestInterceptor {
 *   onRequest(request) {
 *     console.log('Request:', request.messages.length);
 *     return request;
 *   }
 * }
 * ```
 */
export interface RequestInterceptor {
  /**
   * Called before request is sent
   */
  onRequest?(request: ChatRequest): ChatRequest | Promise<ChatRequest>;

  /**
   * Called after response is received
   */
  onResponse?(response: ChatResponse): ChatResponse | Promise<ChatResponse>;

  /**
   * Called when error occurs
   */
  onError?(error: AIError): AIError | Promise<AIError>;
}

/**
 * Middleware chain for processing requests/responses
 * Allows adding interceptors for logging, retry, metrics, etc.
 */
class MiddlewareChain {
  private interceptors: RequestInterceptor[] = [];

  /**
   * Add an interceptor to the chain
   */
  add(interceptor: RequestInterceptor): void {
    this.interceptors.push(interceptor);
  }

  /**
   * Remove an interceptor from the chain
   */
  remove(interceptor: RequestInterceptor): void {
    const index = this.interceptors.indexOf(interceptor);
    if (index > -1) {
      this.interceptors.splice(index, 1);
    }
  }

  /**
   * Clear all interceptors
   */
  clear(): void {
    this.interceptors = [];
  }

  /**
   * Get all interceptors
   */
  getInterceptors(): RequestInterceptor[] {
    return [...this.interceptors];
  }

  /**
   * Execute the chain with a provider
   * Processes request through all interceptors, calls provider, then processes response
   */
  async execute(
    provider: {
      chat: (messages: Message[], options?: ChatOptions) => Promise<ChatResponse>;
    },
    request: ChatRequest
  ): Promise<ChatResponse> {
    let req = request;

    // Phase 1: Process request through all interceptors
    for (const interceptor of this.interceptors) {
      if (interceptor.onRequest) {
        req = await interceptor.onRequest(req);
      }
    }

    // Phase 2: Call the provider
    let response: ChatResponse;
    try {
      response = await provider.chat(req.messages, req.options);
    } catch (error) {
      // Phase 3: Process error through interceptors
      let aiError = AIError.fromError(error);

      for (const interceptor of this.interceptors) {
        if (interceptor.onError) {
          aiError = await interceptor.onError(aiError);
        }
      }

      throw aiError;
    }

    // Phase 4: Process response through interceptors
    for (const interceptor of this.interceptors) {
      if (interceptor.onResponse) {
        response = await interceptor.onResponse(response);
      }
    }

    return response;
  }

  /**
   * Execute with streaming (for streaming responses)
   * Note: Streaming doesn't go through full middleware chain
   * but does call onRequest and can handle errors
   */
  async executeStreaming(
    provider: {
      chatStream: (messages: Message[], options: ChatOptions & {
        onChunk?: (content: string) => void;
        onComplete?: (content: string) => void;
        onError?: (error: Error) => void;
      }) => Promise<void>;
    },
    request: ChatRequest,
    callbacks: {
      onChunk?: (content: string) => void;
      onComplete?: (content: string) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<void> {
    let req = request;

    // Process request through interceptors
    for (const interceptor of this.interceptors) {
      if (interceptor.onRequest) {
        req = await interceptor.onRequest(req);
      }
    }

    // Wrap callbacks to handle errors through middleware
    const wrappedCallbacks = {
      onChunk: callbacks.onChunk,
      onComplete: callbacks.onComplete,
      onError: (error: Error) => {
        let aiError = AIError.fromError(error);

        for (const interceptor of this.interceptors) {
          if (interceptor.onError) {
            const result = interceptor.onError(aiError);
            if (result instanceof Promise) {
              result.then((resolved) => { aiError = resolved; });
            } else {
              aiError = result;
            }
          }
        }

        if (callbacks.onError) {
          callbacks.onError(aiError);
        }
      },
    };

    try {
      await provider.chatStream(req.messages, {
        ...req.options,
        ...wrappedCallbacks,
      });
    } catch (error) {
      let aiError = AIError.fromError(error);

      for (const interceptor of this.interceptors) {
        if (interceptor.onError) {
          aiError = await interceptor.onError(aiError);
        }
      }

      if (callbacks.onError) {
        callbacks.onError(aiError);
      }
    }
  }
}

// Singleton instance
export const middlewareChain = new MiddlewareChain();

export default MiddlewareChain;
