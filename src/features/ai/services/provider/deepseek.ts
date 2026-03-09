// DeepSeek LLM Provider

import axios, { AxiosInstance } from 'axios';
import { secureStorage } from '../secureStorage';
import type { Message, ChatOptions, ChatResponse, StreamingOptions, ProviderCapabilities, ModelInfo, ProviderType } from '../types';
import { BaseProvider } from './BaseProvider';

// DeepSeek API configuration
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

export class DeepSeekProvider extends BaseProvider {
  readonly providerType: ProviderType = 'deepseek';
  private client: AxiosInstance;
  private model: string;

  constructor(model: string = DEEPSEEK_MODEL) {
    super();
    this.model = model;
    this.client = axios.create({
      baseURL: DEEPSEEK_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async chat(messages: Message[], options: ChatOptions = {}): Promise<ChatResponse> {
    const apiKey = await secureStorage.getApiKey();

    if (!apiKey) {
      throw new Error('API key not found. Please configure your DeepSeek API key.');
    }

    // Convert messages to DeepSeek format
    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add tools if provided
    const requestBody: Record<string, unknown> = {
      model: options.model || this.model,
      messages: formattedMessages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
    };

    // Add tools if provided
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
      const response = await this.client.post(
        '/v1/chat/completions',
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      const data = response.data;

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from DeepSeek API');
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
          throw new Error('Invalid API key. Please check your DeepSeek API key.');
        }
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. Please check your network connection.');
        }
        const errorMessage = error.response?.data?.error?.message || error.message;
        throw new Error(`DeepSeek API error: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * Streaming chat - sends chunks to callbacks as they arrive
   */
  async chatStream(messages: Message[], options: StreamingOptions): Promise<void> {
    const apiKey = await secureStorage.getApiKey();

    if (!apiKey) {
      throw new Error('API key not found. Please configure your DeepSeek API key.');
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
      const response = await this.client.post(
        '/v1/chat/completions',
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          responseType: 'stream',
        }
      );

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
          options.onError(new Error(`DeepSeek API error: ${errorMessage}`));
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
   * Validate DeepSeek API key by calling /models endpoint
   */
  async validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await this.client.get('/models', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (response.status === 200) {
        return { valid: true };
      }

      return { valid: false, error: 'Invalid response status' };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return { valid: false, error: 'Invalid API key' };
        }
        if (error.response?.status === 429) {
          return { valid: false, error: 'Rate limit exceeded' };
        }
        return { valid: false, error: error.response?.data?.error?.message || error.message };
      }
      return { valid: false, error: 'Unknown error' };
    }
  }

  getDefaultModel(): string {
    return this.model;
  }

  /**
   * Get provider capabilities
   */
  getCapabilities(): ProviderCapabilities {
    return {
      supportsStreaming: true,
      supportsVision: false,
      supportsFunctionCalling: true,
      maxContextLength: 128000,
      defaultModel: this.model,
    };
  }

  /**
   * List available models
   */
  async listModels(): Promise<ModelInfo[]> {
    // Return default models
    return [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', contextLength: 128000, supportsFunctionCalling: true },
      { id: 'deepseek-coder', name: 'DeepSeek Coder', contextLength: 128000, supportsFunctionCalling: true },
    ];
  }
}

// Singleton instance
let providerInstance: DeepSeekProvider | null = null;

export function getDeepSeekProvider(): DeepSeekProvider {
  if (!providerInstance) {
    providerInstance = new DeepSeekProvider();
  }
  return providerInstance;
}
