/**
 * useChat Hook - 简化版 AI 聊天 Hook
 * 参考 Vercel AI SDK (@ai-sdk/react) 设计模式
 *
 * 提供简化的 API 用于 AI 聊天功能，复用现有 aiService
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { aiService } from '../services/aiService';
import type { UseChatOptions, UseChatReturn, ChatMessage, ChatStatus } from './useChat.types';
import { generateId } from './useChat.types';
import {
  pruneMessages,
  getLastAssistantMessage,
} from './useChat.utils';

// 默认配置
const DEFAULT_MAX_MESSAGES = 50;
const DEFAULT_MAX_INPUT_LENGTH = 4000;

/**
 * useChat Hook
 *
 * @example
 * const { messages, input, setInput, sendMessage, status } = useChat();
 *
 * @example
 * const { messages, status, reload, stop } = useChat({
 *   initialMessages: [{ id: '1', role: 'system', content: '你是一个助手' }],
 *   onFinish: (message) => console.log('完成:', message.content),
 *   maxMessages: 50,
 * });
 */
export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const {
    initialMessages = [],
    onFinish,
    onError,
    onStatusChange,
    maxInputLength = DEFAULT_MAX_INPUT_LENGTH,
    maxMessages = DEFAULT_MAX_MESSAGES,
  } = options;

  // ===== 状态 =====
  const [messages, setMessagesState] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<ChatStatus>('ready');
  const [error, setError] = useState<Error | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [thinkingContent, setThinkingContent] = useState('');

  // 引用，用于在回调中访问最新状态
  const messagesRef = useRef<ChatMessage[]>(initialMessages);
  const statusRef = useRef<ChatStatus>('ready');

  // 同步状态到 ref
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // 状态变化回调
  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  // ===== 内部方法 =====

  /**
   * 更新消息列表 (带裁剪)
   */
  const updateMessages = useCallback(
    (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      setMessagesState((prev) => {
        const updated = updater(prev);
        const pruned = pruneMessages(updated, maxMessages);
        return pruned;
      });
    },
    [maxMessages]
  );

  /**
   * 添加助手消息到列表
   */
  const addAssistantMessage = useCallback((content: string, thinking?: string) => {
    const newMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content,
      thinking,
      createdAt: new Date(),
    };
    updateMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, [updateMessages]);

  /**
   * 设置错误状态
   */
  const handleError = useCallback(
    (err: Error) => {
      setError(err);
      setStatus('error');
      onError?.(err);
    },
    [onError]
  );

  // ===== 公共方法 =====

  /**
   * 发送消息
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // 创建用户消息
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        createdAt: new Date(),
      };

      // 添加用户消息
      updateMessages((prev) => [...prev, userMessage]);
      setInput('');
      setStatus('submitted');
      setError(null);
      setStreamingContent('');
      setThinkingContent('');

      // 创建助手消息占位
      const assistantMessageId = generateId();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        createdAt: new Date(),
      };
      updateMessages((prev) => [...prev, assistantMessage]);

      setStatus('streaming');

      try {
        // 调用 aiService
        await aiService.sendMessage(content);
      } catch (err) {
        handleError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [updateMessages, handleError]
  );

  /**
   * 追加消息 (更灵活)
   */
  const append = useCallback(
    async (message: ChatMessage) => {
      if (message.role === 'user') {
        await sendMessage(message.content);
      } else if (message.role === 'assistant') {
        updateMessages((prev) => [...prev, message]);
      }
    },
    [sendMessage, updateMessages]
  );

  /**
   * 停止流式响应
   */
  const stop = useCallback(() => {
    aiService.stopStreaming();
    setStatus('ready');
    setStreamingContent('');
    setThinkingContent('');
  }, []);

  /**
   * 重新生成最后响应
   */
  const reload = useCallback(async () => {
    const lastAssistant = getLastAssistantMessage(messagesRef.current);
    if (!lastAssistant) return;

    // 移除最后一条助手消息
    setMessagesState((prev) => {
      const filtered = prev.filter((msg) => msg.id !== lastAssistant.id);
      return filtered;
    });

    // 重新发送
    const lastUserMsg = [...messagesRef.current]
      .reverse()
      .find((msg) => msg.role === 'user');

    if (lastUserMsg) {
      await sendMessage(lastUserMsg.content);
    }
  }, [sendMessage]);

  /**
   * 直接设置消息列表
   */
  const setMessages = useCallback((newMessages: ChatMessage[]) => {
    setMessagesState(newMessages);
  }, []);

  /**
   * 清除所有消息
   */
  const clear = useCallback(() => {
    setMessagesState([]);
    setInput('');
    setStatus('ready');
    setError(null);
    setStreamingContent('');
    setThinkingContent('');
  }, []);

  /**
   * 重新加载历史消息
   */
  const reloadHistory = useCallback(() => {
    // 从 aiService 加载历史
    aiService.loadHistory();
    // 注意：这里需要同步状态，可能需要调整
  }, []);

  // ===== 订阅 aiService 状态变化 =====
  // 使用 useEffect 订阅 aiService 的状态变化
  useEffect(() => {
    // 这是一个简化的实现
    // 实际项目中可以使用订阅模式或直接在 sendMessage 中处理
    const checkStatus = setInterval(() => {
      const aiServiceAny = aiService as any;

      if (aiServiceAny.isStreaming && statusRef.current !== 'streaming') {
        setStatus('streaming');
        setStreamingContent(aiServiceAny.displayContent || '');
        setThinkingContent(aiServiceAny.thinkingContent || '');
      } else if (!aiServiceAny.isStreaming && !aiServiceAny.isLoading && statusRef.current === 'streaming') {
        setStatus('ready');

        // 完成回调
        const lastMsg = getLastAssistantMessage(messagesRef.current);
        if (lastMsg && onFinish) {
          onFinish(lastMsg, messagesRef.current);
        }
      } else if (aiServiceAny.error && statusRef.current !== 'error') {
        handleError(new Error(aiServiceAny.error));
      }
    }, 100);

    return () => clearInterval(checkStatus);
  }, [handleError, onFinish]);

  return {
    // 状态
    messages,
    input,
    status,
    error,
    streamingContent,
    thinkingContent,

    // 方法
    append,
    setInput,
    sendMessage,
    stop,
    setMessages,
    reload,
    clear,
    reloadHistory,
  };
}

// 默认导出
export default useChat;
