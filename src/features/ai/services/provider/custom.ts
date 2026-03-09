// Custom LLM Provider - For user-defined API endpoints

import axios, { AxiosInstance } from 'axios';
import { secureStorage } from '../secureStorage';
import type { Message, ChatOptions, ChatResponse, StreamingOptions, ProviderCapabilities, ModelInfo, ProviderType } from '../types';
import { BaseProvider } from './BaseProvider';

// Custom provider configuration stored in secure storage
const CUSTOM_CONFIG_KEY = 'ai_custom_provider_config';

export interface CustomProviderConfig {
  baseURL: string;
  model: string;
  apiKey: string;
  headers?: Record<string, string>;
}

class CustomProviderConfigStorage {
  async getConfig(): Promise<CustomProviderConfig | null> {
    try {
      const configStr = await secureStorage.getString(CUSTOM_CONFIG_KEY);
      if (configStr) {
        return JSON.parse(configStr);
      }
      return null;
    } catch {
      return null;
    }
  }

  async setConfig(config: CustomProviderConfig): Promise<void> {
    await secureStorage.setString(CUSTOM_CONFIG_KEY, JSON.stringify(config));
  }

  async clearConfig(): Promise<void> {
    await secureStorage.delete(CUSTOM_CONFIG_KEY);
  }
}

export const customProviderConfig = new CustomProviderConfigStorage();

export class CustomProvider extends BaseProvider {
  readonly providerType: ProviderType = 'custom';
  private client: AxiosInstance | null = null;
  private model: string = '';
  private configured: boolean = false;

  constructor() {
    super();
    this.initializeFromConfig();
  }

  getDefaultModel(): string {
    return this.model || 'custom-model';
  }

  private async initializeFromConfig(): Promise<void> {
    const config = await customProviderConfig.getConfig();
    if (config) {
      this.model = config.model;
      this.client = axios.create({
        baseURL: config.baseURL,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
          Authorization: `Bearer ${config.apiKey}`,
        },
      });
      this.configured = true;
    }
  }

  async chat(messages: Message[], options: ChatOptions = {}): Promise<ChatResponse> {
    if (!this.client || !this.configured) {
      throw new Error('Custom provider not configured. Please set up your API endpoint in settings.');
    }

    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const requestBody: Record<string, unknown> = {
      model: options.model || this.model,
      messages: formattedMessages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
    };

    if (options.tools && options.tools.length > 0) {
      requestBody.tools = options.tools.map((tool) => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));
    }

    try {
      const response = await this.client.post('/chat/completions', requestBody);

      const data = response.data;

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from custom API');
      }

      const choice = data.choices[0];
      const toolCalls = choice.message.tool_calls?.map((tc: Record<string, unknown>) => ({
        id: tc.id as string,
        name: (tc.function as Record<string, string>).name,
        arguments: JSON.parse((tc.function as Record<string, string>).arguments),
      }));

      return {
        content: choice.message.content || '',
        toolCalls,
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            }
          : undefined,
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid custom API key. Please check your configuration.');
        }
        if (error.response?.status === 404) {
          throw new Error('Custom API endpoint not found. Please check your base URL.');
        }
        if (error.response?.status === 429) {
          throw new Error('Custom API rate limit exceeded. Please try again later.');
        }
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. Please check your network connection.');
        }
        const errorMessage = error.response?.data?.error?.message || error.message;
        throw new Error(`Custom API error: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * Streaming chat - Custom provider uses OpenAI-compatible format
   */
  async chatStream(messages: Message[], options: StreamingOptions): Promise<void> {
    if (!this.client || !this.configured) {
      throw new Error('Custom provider not configured. Please set up your API endpoint in settings.');
    }

    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const requestBody: Record<string, unknown> = {
      model: options.model || this.model,
      messages: formattedMessages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
      stream: true,
    };

    if (options.tools && options.tools.length > 0) {
      requestBody.tools = options.tools.map((tool) => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));
    }

    try {
      const response = await this.client.post('/chat/completions', requestBody, {
        responseType: 'stream',
      });

      const stream = response.data;

      for await (const chunk of stream) {
        const lines = chunk.toString().split('\n').filter((line: string) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              options.onComplete?.();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                options.onChunk?.(content);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      options.onComplete?.();
    } catch (error: unknown) {
      if (options.onError) {
        if (axios.isAxiosError(error)) {
          const errorMessage = error.response?.data?.error?.message || error.message;
          options.onError(new Error(`Custom API error: ${errorMessage}`));
        } else if (error instanceof Error) {
          options.onError(error);
        } else {
          options.onError(new Error('Unknown error'));
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Validate Custom API key by making a minimal request
   */
  async validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    // Custom provider validation requires the config to be set
    const config = await customProviderConfig.getConfig();
    if (!config) {
      return { valid: false, error: 'Custom provider not configured' };
    }

    try {
      const response = await this.client?.post(
        '/chat/completions',
        {
          model: this.model,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1,
        }
      );

      if (response?.status === 200) {
        return { valid: true };
      }

      return { valid: false, error: 'Invalid response status' };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return { valid: false, error: 'Invalid API key' };
        }
        if (error.response?.status === 404) {
          return { valid: false, error: 'API endpoint not found' };
        }
        if (error.response?.status === 429) {
          return { valid: false, error: 'Rate limit exceeded' };
        }
        return { valid: false, error: error.response?.data?.error?.message || error.message };
      }
      return { valid: false, error: 'Unknown error' };
    }
  }

  /**
   * Get provider capabilities (based on config)
   */
  getCapabilities(): ProviderCapabilities {
    return {
      supportsStreaming: this.configured,
      supportsVision: false,
      supportsFunctionCalling: true,
      maxContextLength: 128000,
      defaultModel: this.model,
    };
  }

  /**
   * List available models (custom - based on config)
   */
  async listModels(): Promise<ModelInfo[]> {
    if (!this.configured) {
      return [];
    }
    return [
      { id: this.model, name: this.model, contextLength: 128000, supportsFunctionCalling: true },
    ];
  }

  isConfigured(): boolean {
    return this.configured;
  }
}

// Singleton instance
let providerInstance: CustomProvider | null = null;

export function getCustomProvider(): CustomProvider {
  if (!providerInstance) {
    providerInstance = new CustomProvider();
  }
  return providerInstance;
}
