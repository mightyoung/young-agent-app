// OpenAI LLM Provider

import axios, { AxiosInstance } from 'axios';
import { secureStorage } from '../secureStorage';
import type { Message, ChatOptions, ChatResponse, StreamingOptions, ProviderCapabilities, ModelInfo, ProviderType } from '../types';
import { BaseProvider } from './BaseProvider';

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export class OpenAIProvider extends BaseProvider {
  readonly providerType: ProviderType = 'openai';
  private client: AxiosInstance;
  private model: string;

  constructor(model: string = OPENAI_MODEL) {
    super();
    this.model = model;
    this.client = axios.create({
      baseURL: OPENAI_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async chat(messages: Message[], options: ChatOptions = {}): Promise<ChatResponse> {
    const apiKey = await secureStorage.getApiKey('openai');

    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please configure your OpenAI API key.');
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
      const response = await this.client.post(
        '/chat/completions',
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      const data = response.data;

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenAI API');
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
          throw new Error('Invalid OpenAI API key. Please check your API key.');
        }
        if (error.response?.status === 429) {
          throw new Error('OpenAI rate limit exceeded. Please try again later.');
        }
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. Please check your network connection.');
        }
        const errorMessage = error.response?.data?.error?.message || error.message;
        throw new Error(`OpenAI API error: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * Streaming chat - sends chunks to callbacks as they arrive
   * OpenAI SSE format: data: {"choices":[{"delta":{"content":"..."}}]}
   */
  async chatStream(messages: Message[], options: StreamingOptions): Promise<void> {
    const apiKey = await secureStorage.getApiKey('openai');

    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please configure your OpenAI API key.');
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
        '/chat/completions',
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          responseType: 'stream',
        }
      );

      const stream = response.data;

      // Track tool call accumulation
      let currentToolCall: {
        id: string;
        name: string;
        arguments: string;
        index: number;
      } | null = null;

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
              const delta = parsed.choices?.[0]?.delta;

              if (!delta) continue;

              // Handle content delta
              if (delta.content) {
                options.onChunk?.(delta.content);
              }

              // Handle tool call deltas
              if (delta.tool_calls && delta.tool_calls.length > 0) {
                for (const tc of delta.tool_calls) {
                  if (!currentToolCall || currentToolCall.index !== tc.index) {
                    // Start new tool call
                    currentToolCall = {
                      id: tc.id || '',
                      name: tc.function?.name || '',
                      arguments: tc.function?.arguments || '',
                      index: tc.index || 0,
                    };
                  } else {
                    // Accumulate arguments
                    currentToolCall.arguments += tc.function?.arguments || '';
                  }
                }
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
          options.onError(new Error(`OpenAI API error: ${errorMessage}`));
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
   * Validate OpenAI API key by calling /models endpoint
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

  /**
   * List available models from OpenAI API
   * Override to provide dynamic model listing
   */
  async listModels(): Promise<ModelInfo[]> {
    const apiKey = await secureStorage.getApiKey('openai');
    if (!apiKey) {
      throw new Error('OpenAI API key not found');
    }

    try {
      const response = await this.client.get('/models', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      const models = response.data.data || [];
      return models.map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
        contextLength: m.context_window || 128000,
        supportsVision: m.id.includes('vision') || m.id.includes('gpt-4o'),
        supportsFunctionCalling: true,
      }));
    } catch (error) {
      // Return default models on error
      return [
        { id: 'gpt-4o', name: 'GPT-4o', contextLength: 128000, supportsVision: true, supportsFunctionCalling: true },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextLength: 128000, supportsVision: true, supportsFunctionCalling: true },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', contextLength: 128000, supportsVision: true, supportsFunctionCalling: true },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextLength: 16385, supportsVision: false, supportsFunctionCalling: true },
      ];
    }
  }
}

// Singleton instance
let providerInstance: OpenAIProvider | null = null;

export function getOpenAIProvider(): OpenAIProvider {
  if (!providerInstance) {
    providerInstance = new OpenAIProvider();
  }
  return providerInstance;
}
