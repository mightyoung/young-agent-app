/**
 * AI 模块 Hooks 导出
 */

export * from './useAIQueries';

// useChat hook - named export (recommended)
export { useChat } from './useChat';
export type {
  ChatMessage,
  ChatStatus,
  UseChatOptions,
  UseChatReturn,
} from './useChat.types';

// useProviderValidator - default export (backward compatible)
export { useProviderValidator, default } from './useProviderValidator';
