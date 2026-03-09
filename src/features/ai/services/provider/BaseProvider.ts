// Base Provider - Abstract base class for all LLM Providers
// Provides common functionality and default implementations

import type {
  Message,
  ChatOptions,
  ChatResponse,
  StreamingOptions,
  ProviderCapabilities,
  ModelInfo,
  LLMProvider,
  ProviderType,
} from '../types';

/**
 * Abstract base class for LLM Providers
 * All providers should extend this class to get common functionality
 * and ensure interface compliance.
 *
 * @example
 * ```typescript
 * export class OpenAIProvider extends BaseProvider {
 *   // Implement abstract methods
 * }
 * ```
 */
export abstract class BaseProvider implements LLMProvider {
  /**
   * Provider type identifier
   */
  abstract readonly providerType: ProviderType;

  /**
   * Default model for this provider
   * Can be overridden by subclasses
   */
  getDefaultModel(): string {
    return 'default-model';
  }

  /**
   * Send a chat request and get a complete response
   */
  abstract chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;

  /**
   * Send a chat request and stream the response
   */
  abstract chatStream(messages: Message[], options: StreamingOptions): Promise<void>;

  /**
   * Validate an API key
   */
  async validateApiKey(_apiKey: string): Promise<{ valid: boolean; error?: string }> {
    // Default implementation - try a minimal chat request
    try {
      await this.chat(
        [{ id: '1', role: 'user', content: 'Hi', timestamp: Date.now() }],
        { maxTokens: 1 }
      );
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  /**
   * Get provider capabilities
   * Override this to provide provider-specific capabilities
   */
  getCapabilities(): ProviderCapabilities {
    return {
      supportsStreaming: true,
      supportsVision: false,
      supportsFunctionCalling: true,
      maxContextLength: 128000,
      defaultModel: this.getDefaultModel(),
    };
  }

  /**
   * List available models
   * Default implementation returns only the default model
   * Override to provide dynamic model listing
   */
  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        id: this.getDefaultModel(),
        name: this.getDefaultModel(),
        contextLength: this.getCapabilities().maxContextLength,
      },
    ];
  }

  /**
   * Get provider name for logging/display
   */
  getProviderName(): string {
    return this.providerType;
  }

  /**
   * Check if this provider supports a specific feature
   */
  supportsFeature(feature: keyof ProviderCapabilities): boolean {
    const caps = this.getCapabilities();
    return caps[feature] as boolean;
  }
}

/**
 * Type guard to check if an object is a BaseProvider
 */
export function isBaseProvider(provider: unknown): provider is BaseProvider {
  return (
    provider !== null &&
    typeof provider === 'object' &&
    'chat' in provider &&
    'chatStream' in provider &&
    'getDefaultModel' in provider
  );
}

export default BaseProvider;
