// Streaming Service - 流式响应处理服务
// 处理Provider的流式响应，管理思考内容和进度

import type { ProviderType, Message, ChatOptions } from './types';
import { providerFactory } from './provider/factory';

export interface StreamingCallbacks {
  onChunk: (content: string, isThinking: boolean) => void;
  onThinkingComplete: () => void;
  onComplete: (fullContent: string) => void;
  onError: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

interface StreamingState {
  isActive: boolean;
  content: string;
  thinking: string;
  isThinking: boolean;
}

class StreamingService {
  private currentState: StreamingState = {
    isActive: false,
    content: '',
    thinking: '',
    isThinking: true,
  };

  /**
   * 启动流式响应
   */
  async startStreaming(
    messages: Message[],
    options: ChatOptions,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    const provider = providerFactory.getCurrentProvider();
    const providerType = providerFactory.getCurrentProviderType();

    // 检查是否支持流式
    const providerConfig = providerFactory.getProviderConfig(providerType);
    if (!providerConfig.supportsStreaming) {
      // 不支持流式，降级为普通调用
      try {
        const response = await provider.chat(messages, options);
        callbacks.onChunk(response.content, false);
        callbacks.onComplete(response.content);
      } catch (error) {
        callbacks.onError(error instanceof Error ? error : new Error('Unknown error'));
      }
      return;
    }

    this.currentState = {
      isActive: true,
      content: '',
      thinking: '',
      isThinking: true,
    };

    try {
      // 使用Provider的流式方法（如果有）
      if ('chatStream' in provider && typeof provider.chatStream === 'function') {
        await (provider as any).chatStream(messages, {
          ...options,
          onChunk: (chunk: string) => {
            this.processChunk(chunk, callbacks);
          },
          onComplete: () => {
            this.currentState.isThinking = false;
            callbacks.onThinkingComplete();
            callbacks.onComplete(this.currentState.content);
          },
          onError: (error: Error) => {
            callbacks.onError(error);
          },
        });
      } else {
        // 模拟流式效果（降级方案）
        await this.simulateStreaming(messages, options, callbacks);
      }
    } catch (error) {
      // R3: 使用错误分类器处理不同类型错误
      const errorType = this.classifyError(error);

      if (errorType === 'API_KEY_EXPIRED') {
        callbacks.onError(new Error('API_KEY_EXPIRED'));
      } else if (errorType === 'NETWORK_ERROR') {
        callbacks.onError(new Error('NETWORK_ERROR'));
      } else if (errorType === 'RATE_LIMIT') {
        callbacks.onError(new Error('RATE_LIMIT'));
      } else {
        callbacks.onError(error instanceof Error ? error : new Error('Unknown error'));
      }
    }
  }

  /**
   * 处理接收到的chunk
   */
  private processChunk(chunk: string, callbacks: StreamingCallbacks): void {
    // 尝试解析思考内容
    // 不同Provider格式不同，这里做通用处理
    const parsed = this.parseChunk(chunk);

    if (parsed.thinking && this.currentState.isThinking) {
      this.currentState.thinking += parsed.thinking;
      callbacks.onChunk(parsed.thinking, true);

      // 更新进度
      if (callbacks.onProgress) {
        const progress = Math.min(80, 40 + this.currentState.thinking.length / 10);
        callbacks.onProgress(progress);
      }
    }

    if (parsed.content) {
      if (this.currentState.isThinking) {
        // 思考完成，开始回复
        this.currentState.isThinking = false;
        callbacks.onThinkingComplete();
      }

      this.currentState.content += parsed.content;
      callbacks.onChunk(parsed.content, false);

      // 更新进度
      if (callbacks.onProgress) {
        const progress = Math.min(100, 80 + this.currentState.content.length / 20);
        callbacks.onProgress(progress);
      }
    }
  }

  /**
   * 解析chunk，提取思考内容和回复内容
   * 这里需要根据不同Provider做适配
   */
  private parseChunk(chunk: string): { thinking?: string; content?: string } {
    // 简化实现：直接返回chunk作为内容
    // 实际需要根据Provider类型解析不同的响应格式

    // 尝试解析JSON（某些Provider返回JSON格式）
    try {
      const data = JSON.parse(chunk);
      if (data.choices?.[0]?.delta) {
        const delta = data.choices[0].delta;
        return {
          thinking: delta.reasoning_content || delta.thinking,
          content: delta.content,
        };
      }
    } catch {
      // 不是JSON，直接作为内容返回
    }

    return { content: chunk };
  }

  /**
   * 模拟流式效果（不支持流式时的降级方案）
   */
  private async simulateStreaming(
    messages: Message[],
    options: ChatOptions,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    const provider = providerFactory.getCurrentProvider();

    try {
      const response = await provider.chat(messages, options);
      const content = response.content;

      // 模拟思考过程
      const thinkingPhrases = [
        '正在分析您的问题...',
        '正在构建回答框架...',
        '正在整理相关信息...',
      ];

      for (const phrase of thinkingPhrases) {
        await this.delay(300);
        if (!this.currentState.isActive) break;

        this.currentState.thinking += phrase;
        callbacks.onChunk(phrase, true);

        if (callbacks.onProgress) {
          callbacks.onProgress(30 + thinkingPhrases.indexOf(phrase) * 15);
        }
      }

      if (!this.currentState.isActive) return;

      this.currentState.isThinking = false;
      callbacks.onThinkingComplete();

      // 模拟打字机效果
      const words = content.split(/(\s+|[，。！？、；：""''（）])/);
      for (const word of words) {
        await this.delay(50);
        if (!this.currentState.isActive) break;

        this.currentState.content += word;
        callbacks.onChunk(word, false);

        if (callbacks.onProgress) {
          callbacks.onProgress(80 + (words.indexOf(word) / words.length) * 20);
        }
      }

      if (this.currentState.isActive) {
        callbacks.onComplete(this.currentState.content);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * 检查是否是认证错误
   */
  private isAuthError(error: unknown): boolean {
    if (error && typeof error === 'object' && 'status' in error) {
      return (error as any).status === 401;
    }
    if (error instanceof Error) {
      return error.message.includes('401') || error.message.includes('API key');
    }
    return false;
  }

  /**
   * R3.1.2: 检查是否是网络错误
   */
  private isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      return (
        msg.includes('network') ||
        msg.includes('fetch') ||
        msg.includes('timeout') ||
        msg.includes('econnrefused') ||
        msg.includes('enotfound') ||
        msg.includes('internet')
      );
    }
    return false;
  }

  /**
   * R3.1.3: 检查是否是速率限制错误
   */
  private isRateLimitError(error: unknown): boolean {
    if (error && typeof error === 'object' && 'status' in error) {
      return (error as any).status === 429;
    }
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      return (
        msg.includes('429') ||
        msg.includes('rate limit') ||
        msg.includes('too many requests') ||
        msg.includes('quota')
      );
    }
    return false;
  }

  /**
   * R3: 错误类型分类
   */
  classifyError(error: unknown): 'API_KEY_EXPIRED' | 'NETWORK_ERROR' | 'RATE_LIMIT' | 'UNKNOWN' {
    if (this.isAuthError(error)) return 'API_KEY_EXPIRED';
    if (this.isNetworkError(error)) return 'NETWORK_ERROR';
    if (this.isRateLimitError(error)) return 'RATE_LIMIT';
    return 'UNKNOWN';
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 停止流式响应
   */
  stop(): void {
    this.currentState.isActive = false;
  }

  /**
   * 获取当前状态
   */
  getState(): StreamingState {
    return { ...this.currentState };
  }
}

// Singleton
export const streamingService = new StreamingService();
export default streamingService;
