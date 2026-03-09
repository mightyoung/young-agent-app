/**
 * Message Conversion Utilities - 消息格式转换
 * 对齐 Vercel AI SDK 的 convertToModelMessages 功能
 *
 * 支持在不同消息格式之间转换：
 * - ChatMessage (useChat hook 格式)
 * - Message (service 内部格式)
 * - Provider-specific 格式 (OpenAI, Anthropic, DeepSeek 等)
 */

import type { Message, ToolCall, ToolResult, ProviderType } from './types';
import type { ChatMessage } from '../hooks/useChat.types';

// ============================================
// 类型定义
// ============================================

/**
 * 消息转换选项
 */
export interface ConvertOptions {
  /** 目标 Provider 类型 */
  provider?: ProviderType;
  /** 是否包含思考内容 */
  includeThinking?: boolean;
  /** 是否包含工具调用 */
  includeTools?: boolean;
}

/**
 * 统一消息格式 (内部使用)
 */
export interface UIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  thinking?: string;
  createdAt?: number;
}

// ============================================
// 转换函数
// ============================================

/**
 * 将 ChatMessage 转换为 Service Message
 *
 * @param messages - ChatMessage 数组
 * @returns Message 数组
 */
export function chatMessageToService(messages: ChatMessage[]): Message[] {
  return messages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.createdAt?.getTime() ?? Date.now(),
    toolCalls: undefined,
    toolResults: msg.role === 'tool' ? [{
      toolCallId: msg.toolCallId ?? msg.id,
      name: msg.name ?? 'unknown',
      result: msg.content,
    }] : undefined,
  }));
}

/**
 * 将 Service Message 转换为 ChatMessage
 *
 * @param messages - Message 数组
 * @returns ChatMessage 数组
 */
export function serviceToChatMessage(messages: Message[]): ChatMessage[] {
  return messages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createdAt: new Date(msg.timestamp),
    toolCallId: msg.toolResults?.[0]?.toolCallId,
    name: msg.toolResults?.[0]?.name,
  }));
}

/**
 * 转换为 OpenAI 格式
 * OpenAI 格式: { role: string, content: string | array, name?: string, tool_call_id?: string }
 *
 * @param messages - 内部消息数组
 * @param options - 转换选项
 * @returns OpenAI 格式消息
 */
export function toOpenAIMessages(
  messages: UIMessage[],
  options: ConvertOptions = {}
): Array<{
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{ type: string; text?: string; image_url?: string }>;
  name?: string;
  tool_call_id?: string;
}> {
  const { includeThinking = false } = options;

  return messages
    .filter((msg) => msg.role !== 'tool' || msg.toolResults)
    .map((msg) => {
      // 处理工具结果
      if (msg.role === 'tool' && msg.toolResults) {
        return {
          role: 'user' as const,
          content: msg.toolResults
            .map((r) => `${r.name}: ${r.result}`)
            .join('\n'),
          tool_call_id: msg.toolCallId,
        };
      }

      // 处理普通消息
      let content = msg.content;

      // 如果包含思考内容
      if (includeThinking && msg.thinking && msg.role === 'assistant') {
        content = `思考过程:\n${msg.thinking}\n\n回答:\n${content}`;
      }

      return {
        role: msg.role === 'system' ? 'user' : msg.role,
        content,
        name: msg.name,
      };
    });
}

/**
 * 转换为 Anthropic 格式
 * Anthropic 格式: { role: 'user' | 'assistant', content: string | array }
 *
 * @param messages - 内部消息数组
 * @param options - 转换选项
 * @returns Anthropic 格式消息
 */
export function toAnthropicMessages(
  messages: UIMessage[],
  options: ConvertOptions = {}
): Array<{
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; text: string }>;
}> {
  const { includeThinking = false } = options;

  // Anthropic 不支持 system 角色，需要转换为 user 消息
  const converted: Array<{ role: 'user' | 'assistant'; content: string | Array<{ type: string; text: string }> }> = [];

  for (const msg of messages) {
    if (msg.role === 'tool' && msg.toolResults) {
      // 工具结果需要插入到用户消息后面
      converted.push({
        role: 'user',
        content: msg.toolResults.map((r) => r.result).join('\n'),
      });
      continue;
    }

    if (msg.role === 'system') {
      // 将 system 转换为 user 消息
      converted.push({
        role: 'user',
        content: msg.content,
      });
      continue;
    }

    let content = msg.content;
    if (includeThinking && msg.thinking && msg.role === 'assistant') {
      content = `${msg.thinking}\n\n${content}`;
    }

    converted.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content,
    });
  }

  return converted;
}

/**
 * 转换为 DeepSeek 格式
 * DeepSeek 兼容 OpenAI 格式
 *
 * @param messages - 内部消息数组
 * @param options - 转换选项
 * @returns DeepSeek 格式消息
 */
export function toDeepSeekMessages(
  messages: UIMessage[],
  options: ConvertOptions = {}
): ReturnType<typeof toOpenAIMessages> {
  // DeepSeek 完全兼容 OpenAI 格式
  return toOpenAIMessages(messages, options);
}

/**
 * 转换为通用 Provider 格式
 *
 * @param messages - 内部消息数组
 * @param provider - Provider 类型
 * @param options - 转换选项
 * @returns Provider 特定格式消息
 */
export function convertToProviderFormat(
  messages: UIMessage[],
  provider: ProviderType,
  options: ConvertOptions = {}
): unknown {
  switch (provider) {
    case 'openai':
      return toOpenAIMessages(messages, options);
    case 'anthropic':
      return toAnthropicMessages(messages, options);
    case 'deepseek':
      return toDeepSeekMessages(messages, options);
    case 'minimax':
    case 'kimi':
    case 'doubao':
    case 'glm':
    case 'custom':
      // 这些 Provider 兼容 OpenAI 格式
      return toOpenAIMessages(messages, options);
    default:
      return toOpenAIMessages(messages, options);
  }
}

/**
 * 统一的转换入口 (对齐 Vercel AI SDK)
 *
 * @param messages - ChatMessage 数组
 * @param options - 转换选项
 * @returns 转换后的消息数组
 */
export function convertToModelMessages(
  messages: ChatMessage[],
  options: ConvertOptions = {}
): unknown {
  // 转换为内部格式
  const uiMessages: UIMessage[] = messages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    name: msg.name,
    toolCallId: msg.toolCallId,
    thinking: msg.thinking,
    createdAt: msg.createdAt?.getTime(),
  }));

  // 根据 Provider 转换
  return convertToProviderFormat(uiMessages, options.provider ?? 'openai', options);
}

// ============================================
// 工具函数
// ============================================

/**
 * 压缩消息历史 (用于减少上下文长度)
 *
 * @param messages - 消息数组
 * @param maxMessages - 最大消息数
 * @returns 压缩后的消息
 */
export function compressMessages(
  messages: ChatMessage[],
  maxMessages: number = 20
): ChatMessage[] {
  if (messages.length <= maxMessages) {
    return messages;
  }

  // 保留 system 消息和最近的消息
  const systemMessages = messages.filter((m) => m.role === 'system');
  const recentMessages = messages
    .filter((m) => m.role !== 'system')
    .slice(-maxMessages);

  return [...systemMessages, ...recentMessages];
}

/**
 * 估算消息的 token 数量 (粗略估算)
 *
 * @param content - 消息内容
 * @returns 估算的 token 数量
 */
export function estimateTokens(content: string): number {
  // 简单估算: 平均 1 token = 4 字符
  return Math.ceil(content.length / 4);
}

/**
 * 根据 maxTokens 裁剪消息
 *
 * @param messages - 消息数组
 * @param maxTokens - 最大 token 数
 * @returns 裁剪后的消息
 */
export function pruneMessagesByTokens(
  messages: ChatMessage[],
  maxTokens: number = 4000
): ChatMessage[] {
  let totalTokens = 0;
  const result: ChatMessage[] = [];

  // 从后向前遍历，保留最新的消息
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const tokens = estimateTokens(msg.content);

    if (totalTokens + tokens > maxTokens) {
      break;
    }

    result.unshift(msg);
    totalTokens += tokens;
  }

  return result;
}

// ============================================
// 导出
// ============================================

export default {
  chatMessageToService,
  serviceToChatMessage,
  toOpenAIMessages,
  toAnthropicMessages,
  toDeepSeekMessages,
  convertToProviderFormat,
  convertToModelMessages,
  compressMessages,
  estimateTokens,
  pruneMessagesByTokens,
};
