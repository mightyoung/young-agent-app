// AI Service Facade - Unified Interface for AI Operations
// Provides a simple, unified API for all AI services

import { providerFactory, usageTrackingService } from './provider';
import type { UsageSummary } from './provider';
import { ragService } from './rag';
import { toolRegistry } from './tools';
import { streamingService } from './streaming';
import { initializeAIService, isAIServiceReady } from './init';
import type { Message, ChatOptions, ProviderType, ProviderCapabilities, ModelInfo } from './types';

export interface SendMessageOptions {
  message: string;
  context?: {
    provider?: ProviderType;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
  onChunk?: (content: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

export interface AIStatus {
  isReady: boolean;
  currentProvider: ProviderType;
  capabilities: ProviderCapabilities | null;
}

/**
 * AI Facade - Main entry point for AI operations
 * Provides a simplified interface combining all AI services
 */
class AIFacade {
  private initialized = false;

  /**
   * Initialize the AI service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await initializeAIService();
      await ragService.initialize();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      throw error;
    }
  }

  /**
   * Get current AI status
   */
  async getStatus(): Promise<AIStatus> {
    const provider = providerFactory.getCurrentProvider();
    const providerType = providerFactory.getCurrentProviderType();
    const capabilities = provider.getCapabilities?.() || null;
    const isReady = await isAIServiceReady();

    return {
      isReady,
      currentProvider: providerType,
      capabilities,
    };
  }

  /**
   * Send a message and get streaming response
   */
  async sendMessage(options: SendMessageOptions): Promise<void> {
    const { message, context, onChunk, onComplete, onError } = options;

    // Build messages
    const messages: Message[] = [
      { id: '1', role: 'user', content: message, timestamp: Date.now() },
    ];

    // Get tools (cast to any to avoid type mismatch)
    const tools = toolRegistry.getToolsForLLM() as any;

    // Build options
    const chatOptions: ChatOptions = {
      model: context?.model,
      temperature: context?.temperature ?? 0.7,
      maxTokens: context?.maxTokens ?? 2000,
      tools: tools?.length > 0 ? tools : undefined,
    };

    // Get provider
    const provider = context?.provider
      ? providerFactory.getProvider(context.provider)
      : providerFactory.getCurrentProvider();

    // Start time for usage tracking
    const startTime = Date.now();

    // Use streaming service
    await streamingService.startStreaming(
      messages,
      chatOptions,
      {
        onChunk: (content, isThinking) => {
          if (!isThinking && onChunk) {
            onChunk(content);
          }
        },
        onThinkingComplete: () => {},
        onComplete: (fullContent) => {
          // Record usage
          const latency = Date.now() - startTime;
          usageTrackingService.recordUsage(
            providerFactory.getCurrentProviderType(),
            provider.getDefaultModel(),
            Math.floor(fullContent.length / 4), // Estimate tokens
            Math.floor(fullContent.length / 4),
            latency
          );

          if (onComplete) {
            onComplete(fullContent);
          }
        },
        onError: (error) => {
          if (onError) {
            onError(error);
          }
        },
      }
    );
  }

  /**
   * Switch provider
   */
  async switchProvider(providerType: ProviderType): Promise<void> {
    await providerFactory.switchProvider(providerType);
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): { type: ProviderType; name: string }[] {
    return providerFactory.getAvailableProviders().map((p) => ({
      type: p.type,
      name: p.name,
    }));
  }

  /**
   * Validate API key for a provider
   */
  async validateApiKey(providerType: ProviderType, apiKey: string): Promise<{
    valid: boolean;
    error?: string;
  }> {
    return providerFactory.validateApiKey(providerType, apiKey);
  }

  /**
   * Get available models for current provider
   */
  async getModels(): Promise<ModelInfo[]> {
    const provider = providerFactory.getCurrentProvider();
    if (provider.listModels) {
      return provider.listModels();
    }
    return [];
  }

  /**
   * Search knowledge base
   */
  async searchKnowledge(query: string): Promise<{
    content: string;
    sources: { id: string; title: string }[];
  }> {
    const result = await ragService.retrieve(query);
    return {
      content: result.content,
      sources: result.sources.map((s) => ({
        id: s.documentId,
        title: s.title,
      })),
    };
  }

  /**
   * Get usage statistics
   */
  getUsageSummary(hours: number = 24): UsageSummary {
    return usageTrackingService.getSummary(hours);
  }

  /**
   * Get today's usage
   */
  getTodayUsage(): UsageSummary {
    return usageTrackingService.getTodaySummary();
  }
}

// Singleton
export const aiFacade = new AIFacade();
export default aiFacade;
