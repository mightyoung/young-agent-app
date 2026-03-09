// Zhipu GLM LLM Provider

import axios, { AxiosInstance } from 'axios';
import { secureStorage } from '../secureStorage';
import type { Message, ChatOptions, ChatResponse, StreamingOptions, ProviderCapabilities, ModelInfo, ProviderType } from '../types';
import { BaseProvider } from './BaseProvider';

const GLM_BASE_URL = process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';
const GLM_MODEL = process.env.GLM_MODEL || 'glm-4';

export class GLMProvider extends BaseProvider {
  readonly providerType: ProviderType = 'glm';
  private client: AxiosInstance;
  private model: string;

  constructor(model: string = GLM_MODEL) {
    super();
    this.model = model;
    this.client = axios.create({
      baseURL: GLM_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async chat(messages: Message[], options: ChatOptions = {}): Promise<ChatResponse> {
    const apiKey = await secureStorage.getApiKey('glm');

    if (!apiKey) {
      throw new Error('GLM API key not found. Please configure your GLM API key.');
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
        throw new Error('No response from GLM API');
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
          throw new Error('Invalid GLM API key. Please check your API key.');
        }
        if (error.response?.status === 429) {
          throw new Error('GLM rate limit exceeded. Please try again later.');
        }
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. Please check your network connection.');
        }
        const errorMessage = error.response?.data?.error?.message || error.message;
        throw new Error(`GLM API error: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * Streaming chat - GLM uses OpenAI-compatible format
   */
  async chatStream(messages: Message[], options: StreamingOptions): Promise<void> {
    const apiKey = await secureStorage.getApiKey('glm');

    if (!apiKey) {
      throw new Error('GLM API key not found. Please configure your GLM API key.');
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
          options.onError(new Error(`GLM API error: ${errorMessage}`));
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
   * Validate GLM API key by making a minimal request
   */
  async validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await this.client.post(
        '/chat/completions',
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
        return { valid: false, error: error.response?.data?.error?.message || error.message };
      }
      return { valid: false, error: 'Unknown error' };
    }
  }

  getCapabilities(): ProviderCapabilities {
    return {
      supportsStreaming: true,
      supportsVision: true,
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
      { id: 'glm-4', name: 'GLM-4', contextLength: 128000, supportsVision: true, supportsFunctionCalling: true },
      { id: 'glm-4-flash', name: 'GLM-4 Flash', contextLength: 128000, supportsVision: true, supportsFunctionCalling: true },
      { id: 'glm-3-turbo', name: 'GLM-3 Turbo', contextLength: 128000, supportsVision: false, supportsFunctionCalling: true },
    ];
  }
}

// Singleton instance
let providerInstance: GLMProvider | null = null;

export function getGLMProvider(): GLMProvider {
  if (!providerInstance) {
    providerInstance = new GLMProvider();
  }
  return providerInstance;
}
