/**
 * useChat Hook 类型定义
 * 参考 Vercel AI SDK (@ai-sdk/react) 设计模式
 */

import type { Message, ToolCall } from '../services/types';

// ============================================
// 状态类型
// ============================================

/** Chat 状态 - 参考 Vercel AI SDK */
export type ChatStatus = 'submitted' | 'streaming' | 'ready' | 'error';

// ============================================
// 消息类型
// ============================================

/** 简化的聊天消息格式 */
export interface ChatMessage {
  /** 唯一标识 */
  id: string;
  /** 角色: user/assistant/system/tool */
  role: 'user' | 'assistant' | 'system' | 'tool';
  /** 消息内容 */
  content: string;
  /** 工具调用名称 (仅 tool role) */
  name?: string;
  /** 工具调用 ID (仅 tool role) */
  toolCallId?: string;
  /** 创建时间 */
  createdAt?: Date;
  /** 思考内容 (仅 assistant) */
  thinking?: string;
}

// ============================================
// 选项类型
// ============================================

/** useChat Hook 参数选项 */
export interface UseChatOptions {
  /** 初始消息 */
  initialMessages?: ChatMessage[];

  /** AI 完成回调 */
  onFinish?: (message: ChatMessage, messages: ChatMessage[]) => void;

  /** 错误回调 */
  onError?: (error: Error) => void;

  /** 状态变化回调 */
  onStatusChange?: (status: ChatStatus) => void;

  /** 工具调用回调 */
  onToolCall?: (toolCall: ToolCall) => void | Promise<void>;

  /** 最大输入长度 */
  maxInputLength?: number;

  /** 最大消息数量 (用于裁剪) */
  maxMessages?: number;
}

// ============================================
// 返回类型
// ============================================

/** useChat Hook 返回值 */
export interface UseChatReturn {
  /** 消息列表 */
  messages: ChatMessage[];

  /** 输入框内容 */
  input: string;

  /** 当前状态 */
  status: ChatStatus;

  /** 错误信息 */
  error: Error | null;

  /** 流式内容 (当前正在生成的内容) */
  streamingContent: string;

  /** 思考内容 */
  thinkingContent: string;

  // ===== 方法 =====

  /** 追加消息 (用户或助手) */
  append: (message: ChatMessage) => Promise<void>;

  /** 设置输入内容 */
  setInput: (input: string) => void;

  /** 发送消息 (简化版) */
  sendMessage: (content: string) => Promise<void>;

  /** 停止流式响应 */
  stop: () => void;

  /** 直接设置消息列表 */
  setMessages: (messages: ChatMessage[]) => void;

  /** 重新生成最后响应 */
  reload: () => Promise<void>;

  /** 清除所有消息 */
  clear: () => void;

  /** 重新加载历史消息 */
  reloadHistory: () => void;
}

// ============================================
// 工具类型
// ============================================

/** 消息 ID 生成器 */
export type IdGenerator = () => string;

/** 默认 ID 生成器 */
export const generateId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};
