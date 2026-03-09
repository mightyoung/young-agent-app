// Provider Factory - Dynamic Provider Management

import { secureStorage } from '../secureStorage';
import { mmkvStorage } from '../../../../core/storage/mmkv';
import type { LLMProvider, ProviderType, ProviderConfig, StreamingOptions, Message, ChatOptions, ChatResponse } from '../types';
import { DeepSeekProvider } from './deepseek';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { MiniMaxProvider } from './minimax';
import { KimiProvider } from './kimi';
import { DoubaoProvider } from './doubao';
import { GLMProvider } from './glm';
import { CustomProvider } from './custom';

// Default provider configurations
export const DEFAULT_PROVIDERS: Record<ProviderType, Omit<ProviderConfig, 'apiKey'>> = {
  deepseek: {
    type: 'deepseek',
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    supportsStreaming: true,
    supportsVision: false,
    maxContextLength: 128000,
  },
  openai: {
    type: 'openai',
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    supportsStreaming: true,
    supportsVision: true,
    maxContextLength: 128000,
  },
  anthropic: {
    type: 'anthropic',
    name: 'Anthropic Claude',
    baseURL: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-sonnet-20241022',
    supportsStreaming: true,
    supportsVision: true,
    maxContextLength: 200000,
  },
  minimax: {
    type: 'minimax',
    name: 'MiniMax',
    baseURL: 'https://api.minimax.chat/v1',
    model: 'abab6.5s-chat',
    supportsStreaming: true,
    supportsVision: false,
    maxContextLength: 128000,
  },
  kimi: {
    type: 'kimi',
    name: 'Kimi (月之暗面)',
    baseURL: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k',
    supportsStreaming: true,
    supportsVision: true,
    maxContextLength: 128000,
  },
  doubao: {
    type: 'doubao',
    name: '豆包 (字节)',
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    model: 'doubao-pro-32k',
    supportsStreaming: true,
    supportsVision: false,
    maxContextLength: 32000,
  },
  glm: {
    type: 'glm',
    name: '智谱GLM',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4',
    supportsStreaming: true,
    supportsVision: true,
    maxContextLength: 128000,
  },
  custom: {
    type: 'custom',
    name: '自定义',
    baseURL: '',
    model: '',
    supportsStreaming: false,
    supportsVision: false,
    maxContextLength: 128000,
  },
};

// Provider storage keys
const PROVIDER_CONFIG_KEY = 'ai_provider_config';
const CURRENT_PROVIDER_KEY = 'ai_current_provider';

/**
 * Provider Factory - Creates and manages LLM providers
 */
class ProviderFactory {
  private providers: Map<ProviderType, LLMProvider> = new Map();
  private currentProviderType: ProviderType = 'deepseek';

  constructor() {
    this.loadConfig();
  }

  /**
   * Load provider configuration from storage
   */
  private loadConfig(): void {
    try {
      const currentProvider = mmkvStorage.getString(CURRENT_PROVIDER_KEY);
      if (currentProvider && DEFAULT_PROVIDERS[currentProvider as ProviderType]) {
        this.currentProviderType = currentProvider as ProviderType;
      }
    } catch (error) {
      console.error('Failed to load provider config:', error);
    }
  }

  /**
   * Save provider configuration to storage
   */
  private saveConfig(): void {
    try {
      mmkvStorage.setString(CURRENT_PROVIDER_KEY, this.currentProviderType);
    } catch (error) {
      console.error('Failed to save provider config:', error);
    }
  }

  /**
   * Get provider by type (creates if not exists)
   */
  getProvider(type?: ProviderType): LLMProvider {
    const providerType = type || this.currentProviderType;

    if (!this.providers.has(providerType)) {
      this.providers.set(providerType, this.createProvider(providerType));
    }

    return this.providers.get(providerType)!;
  }

  /**
   * Create a new provider instance
   */
  private createProvider(type: ProviderType): LLMProvider {
    const config = DEFAULT_PROVIDERS[type];

    switch (type) {
      case 'deepseek':
        return new DeepSeekProvider(config.model);
      case 'openai':
        return new OpenAIProvider(config.model);
      case 'anthropic':
        return new AnthropicProvider(config.model);
      case 'minimax':
        return new MiniMaxProvider(config.model);
      case 'kimi':
        return new KimiProvider(config.model);
      case 'doubao':
        return new DoubaoProvider(config.model);
      case 'glm':
        return new GLMProvider(config.model);
      case 'custom':
        return new CustomProvider();
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }

  /**
   * Get current provider
   */
  getCurrentProvider(): LLMProvider {
    return this.getProvider(this.currentProviderType);
  }

  /**
   * Get current provider type
   */
  getCurrentProviderType(): ProviderType {
    return this.currentProviderType;
  }

  /**
   * Switch provider
   */
  async switchProvider(type: ProviderType): Promise<void> {
    if (!DEFAULT_PROVIDERS[type]) {
      throw new Error(`Unknown provider type: ${type}`);
    }

    // Validate API key exists for the new provider
    const provider = this.getProvider(type);
    if (!provider) {
      throw new Error(`Failed to create provider: ${type}`);
    }

    this.currentProviderType = type;
    this.saveConfig();
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(type?: ProviderType): Omit<ProviderConfig, 'apiKey'> {
    return DEFAULT_PROVIDERS[type || this.currentProviderType];
  }

  /**
   * Get all available providers
   */
  getAvailableProviders(): { type: ProviderType; name: string; supportsStreaming: boolean; supportsVision: boolean }[] {
    return Object.values(DEFAULT_PROVIDERS).map((config) => ({
      type: config.type,
      name: config.name,
      supportsStreaming: config.supportsStreaming || false,
      supportsVision: config.supportsVision || false,
    }));
  }

  /**
   * Validate API key for a provider
   * Makes a minimal API call to verify the key is valid
   */
  async validateApiKey(type: ProviderType, apiKey: string): Promise<{ valid: boolean; error?: string }> {
    const provider = this.createProvider(type);

    // Use provider's validateApiKey method if available
    if ('validateApiKey' in provider && typeof provider.validateApiKey === 'function') {
      return provider.validateApiKey(apiKey);
    }

    // Fallback: try a minimal chat request
    try {
      await provider.chat(
        [{ id: '1', role: 'user', content: 'Hi', timestamp: Date.now() }],
        { maxTokens: 1 }
      );
      return { valid: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { valid: false, error: errorMessage };
    }
  }
}

// Singleton instance
export const providerFactory = new ProviderFactory();
export default providerFactory;
