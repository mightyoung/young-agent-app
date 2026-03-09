// Conversation Context Service - 对话上下文服务
// 管理多轮对话的上下文、状态跟踪

import { mmkvStorage } from '../../../core/storage/mmkv';

const CONVERSATION_CONTEXT_KEY = 'conversation_context';
const CONVERSATION_HISTORY_KEY = 'conversation_history';
const MAX_HISTORY_LENGTH = 50; // 最多保留50条对话

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  intent?: string;
  toolsUsed?: string[];
}

export interface ConversationContext {
  id: string;
  messages: ConversationMessage[];
  lastIntent?: string;
  lastTopic?: string;
  entities: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

/**
 * 对话上下文服务
 */
class ConversationContextService {
  private currentContext: ConversationContext | null = null;

  constructor() {
    this.loadContext();
  }

  /**
   * 加载上下文
   */
  private loadContext(): void {
    try {
      const contextJson = mmkvStorage.getString(CONVERSATION_CONTEXT_KEY);
      if (contextJson) {
        this.currentContext = JSON.parse(contextJson);
      }
    } catch (error) {
      console.error('[Conversation] Failed to load context:', error);
    }

    // 如果没有现有上下文，创建新的
    if (!this.currentContext) {
      this.createNewContext();
    }
  }

  /**
   * 保存上下文
   */
  private saveContext(): void {
    try {
      if (this.currentContext) {
        mmkvStorage.setString(
          CONVERSATION_CONTEXT_KEY,
          JSON.stringify(this.currentContext)
        );
      }
    } catch (error) {
      console.error('[Conversation] Failed to save context:', error);
    }
  }

  /**
   * 创建新上下文
   */
  createNewContext(): void {
    this.currentContext = {
      id: `conv_${Date.now()}`,
      messages: [],
      entities: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.saveContext();
  }

  /**
   * 获取当前上下文
   */
  getContext(): ConversationContext | null {
    return this.currentContext;
  }

  /**
   * 添加用户消息
   */
  addUserMessage(content: string, intent?: string): void {
    if (!this.currentContext) {
      this.createNewContext();
    }

    const message: ConversationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content,
      timestamp: Date.now(),
      intent,
    };

    this.currentContext!.messages.push(message);
    if (intent) {
      this.currentContext!.lastIntent = intent;
    }

    this.trimHistory();
    this.currentContext!.updatedAt = Date.now();
    this.saveContext();
  }

  /**
   * 添加助手消息
   */
  addAssistantMessage(content: string, toolsUsed?: string[]): void {
    if (!this.currentContext) {
      this.createNewContext();
    }

    const message: ConversationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      content,
      timestamp: Date.now(),
      toolsUsed,
    };

    this.currentContext!.messages.push(message);
    this.trimHistory();
    this.currentContext!.updatedAt = Date.now();
    this.saveContext();
  }

  /**
   * 设置实体
   */
  setEntity(key: string, value: string): void {
    if (this.currentContext) {
      this.currentContext.entities[key] = value;
      this.currentContext.updatedAt = Date.now();
      this.saveContext();
    }
  }

  /**
   * 获取实体
   */
  getEntity(key: string): string | undefined {
    return this.currentContext?.entities[key];
  }

  /**
   * 获取所有实体
   */
  getAllEntities(): Record<string, string> {
    return this.currentContext?.entities || {};
  }

  /**
   * 设置主题
   */
  setTopic(topic: string): void {
    if (this.currentContext) {
      this.currentContext.lastTopic = topic;
      this.currentContext.updatedAt = Date.now();
      this.saveContext();
    }
  }

  /**
   * 获取最后意图
   */
  getLastIntent(): string | undefined {
    return this.currentContext?.lastIntent;
  }

  /**
   * 获取最后主题
   */
  getLastTopic(): string | undefined {
    return this.currentContext?.lastTopic;
  }

  /**
   * 获取历史消息
   */
  getHistory(count?: number): ConversationMessage[] {
    if (!this.currentContext) return [];

    const messages = this.currentContext.messages;
    if (count) {
      return messages.slice(-count);
    }
    return messages;
  }

  /**
   * 获取最近 N 条消息作为上下文
   */
  getRecentMessages(count: number = 10): ConversationMessage[] {
    return this.getHistory(count);
  }

  /**
   * 清理历史
   */
  clearHistory(): void {
    if (this.currentContext) {
      this.currentContext.messages = [];
      this.currentContext.entities = {};
      this.currentContext.lastIntent = undefined;
      this.currentContext.lastTopic = undefined;
      this.currentContext.updatedAt = Date.now();
      this.saveContext();
    }
  }

  /**
   * 结束当前对话，开始新对话
   */
  endConversation(): void {
    this.saveConversationToHistory();
    this.createNewContext();
  }

  /**
   * 保存对话到历史记录
   */
  private saveConversationToHistory(): void {
    if (!this.currentContext || this.currentContext.messages.length === 0) {
      return;
    }

    try {
      const historyJson = mmkvStorage.getString(CONVERSATION_HISTORY_KEY);
      const history: ConversationContext[] = historyJson ? JSON.parse(historyJson) : [];

      history.push({ ...this.currentContext });

      // 只保留最近的历史
      while (history.length > MAX_HISTORY_LENGTH) {
        history.shift();
      }

      mmkvStorage.setString(CONVERSATION_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('[Conversation] Failed to save history:', error);
    }
  }

  /**
   * 获取历史对话列表
   */
  getConversationHistory(): ConversationContext[] {
    try {
      const historyJson = mmkvStorage.getString(CONVERSATION_HISTORY_KEY);
      return historyJson ? JSON.parse(historyJson) : [];
    } catch {
      return [];
    }
  }

  /**
   * 修剪历史记录
   */
  private trimHistory(): void {
    if (!this.currentContext) return;

    const messages = this.currentContext.messages;
    if (messages.length > MAX_HISTORY_LENGTH) {
      this.currentContext.messages = messages.slice(-MAX_HISTORY_LENGTH);
    }
  }

  /**
   * 检查是否是新对话
   */
  isNewConversation(): boolean {
    return !this.currentContext || this.currentContext.messages.length === 0;
  }

  /**
   * 获取对话时长（毫秒）
   */
  getConversationDuration(): number {
    if (!this.currentContext || this.currentContext.messages.length === 0) {
      return 0;
    }
    const firstMessage = this.currentContext.messages[0];
    return Date.now() - firstMessage.timestamp;
  }
}

// Singleton
export const conversationContextService = new ConversationContextService();

// 便捷函数
export const conversationService = {
  /**
   * 添加对话
   */
  addMessage: (
    role: 'user' | 'assistant',
    content: string,
    options?: { intent?: string; toolsUsed?: string[] }
  ) => {
    if (role === 'user') {
      conversationContextService.addUserMessage(content, options?.intent);
    } else {
      conversationContextService.addAssistantMessage(content, options?.toolsUsed);
    }
  },

  /**
   * 获取对话上下文
   */
  getContext: () => conversationContextService.getContext(),

  /**
   * 获取最近消息
   */
  getRecentMessages: (count?: number) =>
    conversationContextService.getRecentMessages(count),

  /**
   * 清除对话
   */
  clear: () => conversationContextService.clearHistory(),

  /**
   * 开始新对话
   */
  newConversation: () => conversationContextService.createNewContext(),

  /**
   * 获取历史记录
   */
  getHistory: () => conversationContextService.getConversationHistory(),
};

export default conversationService;
