// MiniMax LLM Provider

import axios, { AxiosInstance } from 'axios';
import { secureStorage } from '../secureStorage';
import type { Message, ChatOptions, ChatResponse, StreamingOptions, ProviderCapabilities, ModelInfo, ProviderType } from '../types';
import { BaseProvider } from './BaseProvider';

const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL || 'https://api.minimax.chat/v1';
const MINIMAX_MODEL = process.env.MINIMAX_MODEL || 'abab6.5s-chat';

export class MiniMaxProvider extends BaseProvider {
  readonly providerType: ProviderType = 'minimax';
  private client: AxiosInstance;
  private model: string;

  constructor(model: string = MINIMAX_MODEL) {
    super();
    this.model = model;
    this.model = model;
    this.client = axios.create({
      baseURL: MINIMAX_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async chat(messages: Message[], options: ChatOptions = {}): Promise<ChatResponse> {
    const apiKey = await secureStorage.getApiKey('minimax');

    if (!apiKey) {
      throw new Error('MiniMax API key not found. Please configure your MiniMax API key.');
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
        '/text/chatcompletion_v2',
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      const data = response.data;

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from MiniMax API');
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
          throw new Error('Invalid MiniMax API key. Please check your API key.');
        }
        if (error.response?.status === 429) {
          throw new Error('MiniMax rate limit exceeded. Please try again later.');
        }
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. Please check your network connection.');
        }
        const errorMessage = error.response?.data?.base_resp?.status_msg || error.message;
        throw new Error(`MiniMax API error: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * Streaming chat - MiniMax uses OpenAI-compatible format
   */
  async chatStream(messages: Message[], options: StreamingOptions): Promise<void> {
    const apiKey = await secureStorage.getApiKey('minimax');

    if (!apiKey) {
      throw new Error('MiniMax API key not found. Please configure your MiniMax API key.');
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
        '/text/chatcompletion_v2',
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
          const errorMessage = error.response?.data?.base_resp?.status_msg || error.message;
          options.onError(new Error(`MiniMax API error: ${errorMessage}`));
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
   * Validate MiniMax API key by making a minimal request
   */
  async validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await this.client.post(
        '/text/chatcompletion_v2',
        {
          model: this.model,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

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
        return { valid: false, error: error.response?.data?.base_resp?.status_msg || error.message };
      }
      return { valid: false, error: 'Unknown error' };
    }
  }

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
    return [
      { id: 'abab6.5s-chat', name: 'ABAB 6.5S', contextLength: 128000, supportsFunctionCalling: true },
      { id: 'abab5.5-chat', name: 'ABAB 5.5', contextLength: 128000, supportsFunctionCalling: true },
    ];
  }
}

// Singleton instance
let providerInstance: MiniMaxProvider | null = null;

export function getMiniMaxProvider(): MiniMaxProvider {
  if (!providerInstance) {
    providerInstance = new MiniMaxProvider();
  }
  return providerInstance;
}
