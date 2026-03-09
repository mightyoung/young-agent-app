// AI Service - Unified State Management with Zustand
// Merges aiStore + aiFacade into a single entry point
// Supports streaming, thinking mode, typewriter effect

import { create } from 'zustand';
import { mmkvStorage } from '../../../core/storage/mmkv';
import type {
  Message,
  Tool,
  QuickAction,
  ProviderType,
  ProviderCapabilities,
  ModelInfo,
  ToolCall,
  ToolResult,
  ErrorType,
  FailedMessage,
} from './types';
import { providerFactory, usageTrackingService } from './provider';
import { streamingService } from './streaming';
import { toolRegistry } from './tools';
import { ragService } from './rag';
import {
  intentRecognitionService,
  recognizeIntent,
  getRecommendedTools,
  type IntentResult,
} from './intentRecognition';
import {
  analyzeHazards,
  analyzeHazard,
  type HazardAnalysisResult,
} from './hazardAnalysis';
import type { UsageSummary } from './provider/usageTracking';

const AI_STORAGE_KEY = 'ai_chat_history';

// ============================================================================
// Types
// ============================================================================

export interface AIServiceState {
  // State - Message related
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  errorType: ErrorType | null;
  currentProvider: ProviderType;

  // Failed messages (for retry)
  failedMessages: FailedMessage[];

  // Intent recognition
  currentIntent: IntentResult | null;
  currentAnalysis: HazardAnalysisResult | null;

  // Streaming related state (R1.1)
  isStreaming: boolean;
  thinkingContent: string;
  displayContent: string;
  streamingProgress: number;
  currentMessageId: string | null;
}

export interface AIServiceActions {
  // Message actions
  sendMessage: (content: string, tools?: Tool[]) => Promise<void>;
  executeQuickAction: (action: QuickAction) => Promise<void>;
  clearHistory: () => void;
  loadHistory: () => void;
  setError: (error: string | null, errorType?: ErrorType | null) => void;
  handleToolCalls: (toolCalls: ToolCall[], messages: Message[]) => Promise<void>;

  // Retry actions
  retryMessage: (failedMessageId: string) => Promise<void>;
  clearFailedMessage: (failedMessageId: string) => void;

  // Provider actions
  switchProvider: (provider: ProviderType) => Promise<void>;

  // Streaming actions
  stopStreaming: () => void;

  // Intent recognition
  recognizeUserIntent: (query: string) => IntentResult;

  // Hazard analysis
  analyzeHazardData: (hazardId?: string) => Promise<HazardAnalysisResult | null>;
  clearAnalysis: () => void;

  // Query methods (non-mutating)
  getStatus: () => Promise<{
    isReady: boolean;
    currentProvider: ProviderType;
    capabilities: ProviderCapabilities | null;
  }>;
  getModels: () => Promise<ModelInfo[]>;
  getAvailableProviders: () => { type: ProviderType; name: string; supportsStreaming: boolean; supportsVision: boolean }[];
  validateApiKey: (type: ProviderType, apiKey: string) => Promise<{ valid: boolean; error?: string }>;
  searchKnowledge: (query: string) => Promise<{ content: string; sources: { id: string; title: string }[] }>;
  getUsageSummary: (hours?: number) => UsageSummary;
  getTodayUsage: () => UsageSummary;
}

export type AIService = AIServiceState & AIServiceActions;

// ============================================================================
// Quick Action Handlers
// ============================================================================

const quickActionHandlers: Record<string, () => Promise<string>> = {
  queryDevice: async () => {
    const provider = providerFactory.getCurrentProvider();
    const response = await provider.chat(
      [
        { id: '1', role: 'system', content: '你是一个设备查询助手。', timestamp: Date.now() },
        { id: '2', role: 'user', content: '列出所有设备及其状态', timestamp: Date.now() },
      ],
      { temperature: 0.3 }
    );
    return response.content;
  },
  weeklyTask: async () => {
    const provider = providerFactory.getCurrentProvider();
    const response = await provider.chat(
      [
        { id: '1', role: 'system', content: '你是一个任务查询助手。', timestamp: Date.now() },
        { id: '2', role: 'user', content: '列出本周的任务安排', timestamp: Date.now() },
      ],
      { temperature: 0.3 }
    );
    return response.content;
  },
  knowledgeBase: async () => {
    const provider = providerFactory.getCurrentProvider();
    const response = await provider.chat(
      [
        { id: '1', role: 'system', content: '你是一个知识库查询助手。', timestamp: Date.now() },
        { id: '2', role: 'user', content: '搜索知识库中的内容', timestamp: Date.now() },
      ],
      { temperature: 0.3 }
    );
    return response.content;
  },
  hazardStats: async () => {
    const provider = providerFactory.getCurrentProvider();
    const response = await provider.chat(
      [
        { id: '1', role: 'system', content: '你是一个隐患统计助手。', timestamp: Date.now() },
        { id: '2', role: 'user', content: '统计当前的隐患情况', timestamp: Date.now() },
      ],
      { temperature: 0.3 }
    );
    return response.content;
  },
};

// ============================================================================
// AIService Implementation
// ============================================================================

export const useAIService = create<AIService>((set, get) => ({
  // ---------------------------------------------------------------------------
  // Initial State
  // ---------------------------------------------------------------------------
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: '您好！我是Young-agentAI助手，有什么可以帮您的？',
      timestamp: Date.now(),
    },
  ],
  isLoading: false,
  error: null,
  errorType: null,
  currentProvider: providerFactory.getCurrentProviderType(),
  failedMessages: [],
  currentIntent: null,
  currentAnalysis: null,
  isStreaming: false,
  thinkingContent: '',
  displayContent: '',
  streamingProgress: 0,
  currentMessageId: null,

  // ---------------------------------------------------------------------------
  // Message Actions
  // ---------------------------------------------------------------------------

  sendMessage: async (content: string, tools?: Tool[]) => {
    const messageId = `assistant-${Date.now()}`;

    // Intent recognition
    const intent = recognizeIntent(content);
    set({ currentIntent: intent });

    // Select tools based on intent
    const recommendedToolNames = getRecommendedTools(intent.intent);
    let selectedTools = tools;
    if (recommendedToolNames.length > 0 && tools) {
      selectedTools = tools.filter((t) => recommendedToolNames.includes(t.name));
    }

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    // Initialize streaming state
    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      isStreaming: true,
      error: null,
      thinkingContent: '',
      displayContent: '',
      streamingProgress: 0,
      currentMessageId: messageId,
    }));

    try {
      const allMessages = get().messages;

      // Add assistant message placeholder
      const assistantMessage: Message = {
        id: messageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      set((state) => ({
        messages: [...state.messages, assistantMessage],
      }));

      const startTime = Date.now();

      // Use streaming service
      await streamingService.startStreaming(
        allMessages,
        {
          temperature: 0.7,
          maxTokens: 2000,
          tools: selectedTools,
        },
        {
          onChunk: (chunk: string, isThinking: boolean) => {
            if (isThinking) {
              set((state) => ({
                thinkingContent: state.thinkingContent + chunk,
              }));
            } else {
              set((state) => ({
                displayContent: state.displayContent + chunk,
              }));
            }
          },
          onThinkingComplete: () => {
            set({ streamingProgress: 80 });
          },
          onComplete: async (fullContent: string) => {
            const state = get();

            // Record usage
            const latency = Date.now() - startTime;
            usageTrackingService.recordUsage(
              providerFactory.getCurrentProviderType(),
              providerFactory.getCurrentProvider().getDefaultModel(),
              Math.floor(fullContent.length / 4),
              Math.floor(fullContent.length / 4),
              latency
            );

            // Update final message content
            set((state) => ({
              messages: state.messages.map((msg) =>
                msg.id === messageId ? { ...msg, content: fullContent } : msg
              ),
              isLoading: false,
              isStreaming: false,
              streamingProgress: 100,
            }));

            // Handle tool calls
            const lastMessage = state.messages.find((m) => m.id === messageId);
            if (lastMessage?.toolCalls && lastMessage.toolCalls.length > 0) {
              await get().handleToolCalls(lastMessage.toolCalls, allMessages);
            }

            // Save to storage
            get().loadHistory();
          },
          onError: (error: Error) => {
            const errorMessage = error.message;
            let errorType: ErrorType = 'UNKNOWN';

            if (errorMessage === 'API_KEY_EXPIRED' || errorMessage.includes('401')) {
              errorType = 'API_KEY_EXPIRED';
            } else if (errorMessage === 'NETWORK_ERROR') {
              errorType = 'NETWORK_ERROR';
            } else if (errorMessage === 'RATE_LIMIT') {
              errorType = 'RATE_LIMIT';
            }

            const failedMessage: FailedMessage = {
              id: `failed-${Date.now()}`,
              content,
              timestamp: Date.now(),
              errorType,
              errorMessage,
            };

            set((state) => ({
              error: errorMessage,
              errorType,
              isLoading: false,
              isStreaming: false,
              failedMessages: [...state.failedMessages, failedMessage],
            }));
          },
          onProgress: (progress: number) => {
            set({ streamingProgress: progress });
          },
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({
        isLoading: false,
        isStreaming: false,
        error: errorMessage,
      });
    }
  },

  // Handle tool calls from LLM
  handleToolCalls: async (toolCalls: ToolCall[], messages: Message[]) => {
    const toolResults: ToolResult[] = [];

    for (const toolCall of toolCalls) {
      try {
        const tool = toolRegistry.getTool(toolCall.name);
        if (tool) {
          const result = await tool.execute(toolCall.arguments);
          toolResults.push({
            toolCallId: toolCall.id,
            name: toolCall.name,
            result,
          });
        } else {
          toolResults.push({
            toolCallId: toolCall.id,
            name: toolCall.name,
            result: `工具 ${toolCall.name} 不存在`,
            isError: true,
          });
        }
      } catch (error) {
        toolResults.push({
          toolCallId: toolCall.id,
          name: toolCall.name,
          result: error instanceof Error ? error.message : '工具执行失败',
          isError: true,
        });
      }
    }

    const state = get();
    const currentMessageId = state.currentMessageId;
    if (currentMessageId) {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === currentMessageId ? { ...msg, toolResults } : msg
        ),
      }));
    }
  },

  executeQuickAction: async (action: QuickAction) => {
    const handler = quickActionHandlers[action.action];
    if (!handler) {
      set({ error: `Unknown action: ${action.action}` });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await handler();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }));

      get().loadHistory();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({
        isLoading: false,
        error: errorMessage,
      });
    }
  },

  clearHistory: () => {
    mmkvStorage.delete(AI_STORAGE_KEY);
    set({
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: '您好！我是Young-agentAI助手，有什么可以帮您的？',
          timestamp: Date.now(),
        },
      ],
      isStreaming: false,
      thinkingContent: '',
      displayContent: '',
      streamingProgress: 0,
      currentMessageId: null,
    });
  },

  loadHistory: () => {
    try {
      const stored = mmkvStorage.getString(AI_STORAGE_KEY);
      if (stored) {
        const messages = JSON.parse(stored) as Message[];
        if (messages.length > 0) {
          set({ messages });
        }
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  },

  setError: (error: string | null, errorType: ErrorType | null = null) => {
    set({ error, errorType });
  },

  // ---------------------------------------------------------------------------
  // Retry Actions
  // ---------------------------------------------------------------------------

  retryMessage: async (failedMessageId: string) => {
    const state = get();
    const failedMessage = state.failedMessages.find((m) => m.id === failedMessageId);

    if (!failedMessage) {
      set({ error: '消息不存在或已被删除' });
      return;
    }

    set((state) => ({
      failedMessages: state.failedMessages.filter((m) => m.id !== failedMessageId),
      error: null,
      errorType: null,
    }));

    const tools = toolRegistry.getToolsForLLM() as unknown as Tool[];
    await get().sendMessage(failedMessage.content, tools);
  },

  clearFailedMessage: (failedMessageId: string) => {
    set((state) => ({
      failedMessages: state.failedMessages.filter((m) => m.id !== failedMessageId),
    }));
  },

  // ---------------------------------------------------------------------------
  // Provider Actions
  // ---------------------------------------------------------------------------

  switchProvider: async (provider: ProviderType) => {
    try {
      await providerFactory.switchProvider(provider);
      set({ currentProvider: provider });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch provider';
      set({ error: errorMessage });
    }
  },

  // ---------------------------------------------------------------------------
  // Streaming Actions
  // ---------------------------------------------------------------------------

  stopStreaming: () => {
    streamingService.stop();
    set({
      isStreaming: false,
      isLoading: false,
    });
  },

  // ---------------------------------------------------------------------------
  // Intent Recognition
  // ---------------------------------------------------------------------------

  recognizeUserIntent: (query: string) => {
    const intent = recognizeIntent(query);
    set({ currentIntent: intent });
    return intent;
  },

  // ---------------------------------------------------------------------------
  // Hazard Analysis
  // ---------------------------------------------------------------------------

  analyzeHazardData: async (hazardId?: string) => {
    set({ isLoading: true, error: null });
    try {
      let result: HazardAnalysisResult | null;
      if (hazardId) {
        result = await analyzeHazard(hazardId);
      } else {
        result = await analyzeHazards();
      }
      set({ currentAnalysis: result, isLoading: false });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '分析失败';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  clearAnalysis: () => {
    set({ currentAnalysis: null });
  },

  // ---------------------------------------------------------------------------
  // Query Methods (Non-mutating)
  // ---------------------------------------------------------------------------

  getStatus: async () => {
    const provider = providerFactory.getCurrentProvider();
    const providerType = providerFactory.getCurrentProviderType();
    const capabilities = provider.getCapabilities?.() || null;
    const isReady = true; // Simplified - could check initialization status

    return {
      isReady,
      currentProvider: providerType,
      capabilities,
    };
  },

  getModels: async () => {
    const provider = providerFactory.getCurrentProvider();
    if (provider.listModels) {
      return provider.listModels();
    }
    return [];
  },

  getAvailableProviders: () => {
    return providerFactory.getAvailableProviders();
  },

  validateApiKey: async (type: ProviderType, apiKey: string) => {
    return providerFactory.validateApiKey(type, apiKey);
  },

  searchKnowledge: async (query: string) => {
    const result = await ragService.retrieve(query);
    return {
      content: result.content,
      sources: result.sources.map((s) => ({
        id: s.documentId,
        title: s.title,
      })),
    };
  },

  getUsageSummary: (hours: number = 24) => {
    return usageTrackingService.getSummary(hours);
  },

  getTodayUsage: () => {
    return usageTrackingService.getTodaySummary();
  },
}));

// ============================================================================
// Persistence Helper
// ============================================================================

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export function saveMessagesToStorage(messages: Message[]) {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    mmkvStorage.setString(AI_STORAGE_KEY, JSON.stringify(messages));
  }, 1000);
}

// Export singleton for non-React usage
export const aiService = {
  getState: () => useAIService.getState(),
  subscribe: (listener: (state: AIService) => void) => useAIService.subscribe(listener),
  // Actions
  sendMessage: (...args: Parameters<AIServiceActions['sendMessage']>) =>
    useAIService.getState().sendMessage(...args),
  stopStreaming: () => useAIService.getState().stopStreaming(),
  loadHistory: () => useAIService.getState().loadHistory(),
  clearHistory: () => useAIService.getState().clearHistory(),
};

export default useAIService;
