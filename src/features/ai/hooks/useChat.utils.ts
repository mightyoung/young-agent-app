/**
 * useChat Hook 工具函数
 * 消息格式转换和辅助方法
 */

import type { Message } from '../services/types';
import type { ChatMessage } from './useChat.types';

// ============================================
// 消息格式转换
// ============================================

/**
 * 从 aiService Message 转换为 ChatMessage
 */
export function toChatMessage(msg: Message): ChatMessage {
  return {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createdAt: new Date(msg.timestamp),
  };
}

/**
 * 从 ChatMessage 转换回 Message (用于发送给 AI)
 */
export function toMessage(chatMsg: ChatMessage): Message {
  return {
    id: chatMsg.id,
    role: chatMsg.role,
    content: chatMsg.content,
    timestamp: chatMsg.createdAt?.getTime() || Date.now(),
  };
}

/**
 * 将 Message[] 转换为 ChatMessage[]
 */
export function toChatMessages(messages: Message[]): ChatMessage[] {
  return messages.map(toChatMessage);
}

/**
 * 将 ChatMessage[] 转换回 Message[]
 */
export function toMessages(chatMessages: ChatMessage[]): Message[] {
  return chatMessages.map(toMessage);
}

// ============================================
// 消息过滤和裁剪
// ============================================

/**
 * 过滤有效消息 (移除空内容)
 */
export function filterValidMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter(msg => msg.content && msg.content.trim().length > 0);
}

/**
 * 裁剪消息列表，保留系统消息和最近的消息
 */
export function pruneMessages(
  messages: ChatMessage[],
  maxMessages: number
): ChatMessage[] {
  if (messages.length <= maxMessages) {
    return messages;
  }

  // 保留系统消息
  const systemMessages = messages.filter(msg => msg.role === 'system');

  // 保留最近的消息
  const recentMessages = messages
    .filter(msg => msg.role !== 'system')
    .slice(-maxMessages);

  return [...systemMessages, ...recentMessages];
}

// ============================================
// 消息查找
// ============================================

/**
 * 获取最后一条助手消息
 */
export function getLastAssistantMessage(
  messages: ChatMessage[]
): ChatMessage | undefined {
  return messages
    .filter(msg => msg.role === 'assistant')
    .pop();
}

/**
 * 获取最后一条用户消息
 */
export function getLastUserMessage(
  messages: ChatMessage[]
): ChatMessage | undefined {
  return messages
    .filter(msg => msg.role === 'user')
    .pop();
}

// ============================================
// 消息验证
// ============================================

/**
 * 验证消息是否有效
 */
export function isValidMessage(msg: Partial<ChatMessage>): boolean {
  return !!(
    msg.id &&
    msg.role &&
    msg.content !== undefined
  );
}

/**
 * 检查是否可以发送消息
 */
export function canSendMessage(input: string, maxLength?: number): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (maxLength && trimmed.length > maxLength) return false;
  return true;
}
