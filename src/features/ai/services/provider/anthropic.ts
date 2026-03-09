// Anthropic Claude LLM Provider

import axios, { AxiosInstance } from 'axios';
import { secureStorage } from '../secureStorage';
import type { Message, ChatOptions, ChatResponse, StreamingOptions, ProviderCapabilities, ModelInfo, ProviderType } from '../types';
import { BaseProvider } from './BaseProvider';

const ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
const ANTHROPIC_API_VERSION = '2023-06-01';

export class AnthropicProvider extends BaseProvider {
  readonly providerType: ProviderType = 'anthropic';
  private client: AxiosInstance;
  private model: string;

  constructor(model: string = ANTHROPIC_MODEL) {
    super();
    this.model = model;
    this.client = axios.create({
      baseURL: ANTHROPIC_BASE_URL,
      timeout: 60000, // Anthropic can be slower
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '', // Will be set per-request
        'anthropic-version': ANTHROPIC_API_VERSION,
      },
    });
  }

  async chat(messages: Message[], options: ChatOptions = {}): Promise<ChatResponse> {
    const apiKey = await secureStorage.getApiKey('anthropic');

    if (!apiKey) {
      throw new Error('Anthropic API key not found. Please configure your Anthropic API key.');
    }

    // Convert messages to Anthropic format
    // System messages need to be handled specially
    const systemMessages = messages.filter((m) => m.role === 'system');
    const conversationMessages = messages.filter((m) => m.role !== 'system');

    let systemPrompt = '';
    if (systemMessages.length > 0) {
      systemPrompt = systemMessages.map((m) => m.content).join('\n\n');
    }

    const anthropicMessages = conversationMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const requestBody: Record<string, unknown> = {
      model: options.model || this.model,
      messages: anthropicMessages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096, // Anthropic uses max_tokens differently
    };

    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }

    if (options.tools && options.tools.length > 0) {
      requestBody.tools = options.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters,
      }));
    }

    try {
      const response = await this.client.post(
        '/messages',
        requestBody,
        {
          headers: {
            'x-api-key': apiKey,
          },
        }
      );

      const data = response.data;

      if (!data.content || data.content.length === 0) {
        throw new Error('No response from Anthropic API');
      }

      // Anthropic returns content as array
      const contentBlocks = data.content;
      let content = '';
      const toolCalls: { id: string; name: string; arguments: Record<string, unknown> }[] = [];

      for (const block of contentBlocks) {
        if (block.type === 'text') {
          content += block.text;
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            name: block.name,
            arguments: block.input,
          });
        }
      }

      return {
        content,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        usage: data.usage
          ? {
              promptTokens: data.usage.input_tokens,
              completionTokens: data.usage.output_tokens,
              totalTokens: data.usage.input_tokens + data.usage.output_tokens,
            }
          : undefined,
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid Anthropic API key. Please check your API key.');
        }
        if (error.response?.status === 429) {
          throw new Error('Anthropic rate limit exceeded. Please try again later.');
        }
        if (error.response?.status === 400) {
          const errorMessage = error.response?.data?.error?.message || error.message;
          throw new Error(`Anthropic API error: ${errorMessage}`);
        }
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. Please check your network connection.');
        }
        const errorMessage = error.response?.data?.error?.message || error.message;
        throw new Error(`Anthropic API error: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * Streaming chat - Anthropic uses a different SSE format
   * Format: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}
   */
  async chatStream(messages: Message[], options: StreamingOptions): Promise<void> {
    const apiKey = await secureStorage.getApiKey('anthropic');

    if (!apiKey) {
      throw new Error('Anthropic API key not found. Please configure your Anthropic API key.');
    }

    // Convert messages to Anthropic format
    const systemMessages = messages.filter((m) => m.role === 'system');
    const conversationMessages = messages.filter((m) => m.role !== 'system');

    let systemPrompt = '';
    if (systemMessages.length > 0) {
      systemPrompt = systemMessages.map((m) => m.content).join('\n\n');
    }

    const anthropicMessages = conversationMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const requestBody: Record<string, unknown> = {
      model: options.model || this.model,
      messages: anthropicMessages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      stream: true,
    };

    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }

    if (options.tools && options.tools.length > 0) {
      requestBody.tools = options.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters,
      }));
    }

    try {
      const response = await this.client.post(
        '/messages',
        requestBody,
        {
          headers: {
            'x-api-key': apiKey,
          },
          responseType: 'stream',
        }
      );

      const stream = response.data;

      // Track tool call accumulation
      const toolCalls: Map<number, {
        id: string;
        name: string;
        arguments: string;
      }> = new Map();

      for await (const chunk of stream) {
        const lines = chunk.toString().split('\n').filter((line: string) => line.trim() !== '');

        for (const line of lines) {
          if (line.trim() === '') continue;

          try {
            const data = JSON.parse(line);
            const type = data.type;

            if (type === 'content_block_delta') {
              const delta = data.delta;
              const index = data.index;

              if (delta.type === 'text_delta') {
                // Text content
                options.onChunk?.(delta.text);
              } else if (delta.type === 'input_json_delta') {
                // Tool call arguments accumulation
                const existing = toolCalls.get(index) || { id: '', name: '', arguments: '' };
                existing.arguments += delta.partial_json;
                toolCalls.set(index, existing);
              }
            } else if (type === 'content_block_start') {
              const index = data.index;
              if (data.content_block?.type === 'tool_use') {
                toolCalls.set(index, {
                  id: data.content_block.id,
                  name: data.content_block.name,
                  arguments: '',
                });
              }
            } else if (type === 'message_delta') {
              // End of message
              if (data.delta?.stop_reason) {
                options.onComplete?.();
                return;
              }
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      options.onComplete?.();
    } catch (error: unknown) {
      if (options.onError) {
        if (axios.isAxiosError(error)) {
          const errorMessage = error.response?.data?.error?.message || error.message;
          options.onError(new Error(`Anthropic API error: ${errorMessage}`));
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
   * Validate Anthropic API key by making a minimal request
   */
  async validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await this.client.post(
        '/messages',
        {
          model: this.model,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1,
        },
        {
          headers: {
            'x-api-key': apiKey,
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

  /**
   * List available models
   * Override to provide custom model list
   */
  async listModels(): Promise<ModelInfo[]> {
    return [
      { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', contextLength: 200000, supportsVision: true, supportsFunctionCalling: true },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', contextLength: 200000, supportsVision: true, supportsFunctionCalling: true },
      { id: 'claude-3-haiku', name: 'Claude 3 Haiku', contextLength: 200000, supportsVision: true, supportsFunctionCalling: true },
    ];
  }
}

// Singleton instance
let providerInstance: AnthropicProvider | null = null;

export function getAnthropicProvider(): AnthropicProvider {
  if (!providerInstance) {
    providerInstance = new AnthropicProvider();
  }
  return providerInstance;
}
