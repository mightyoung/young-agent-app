// Usage Tracking Service - Monitor API usage and costs

import { mmkvStorage } from '../../../../core/storage/mmkv';

export interface UsageRecord {
  timestamp: number;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number; // in USD
  latencyMs: number;
}

export interface UsageSummary {
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalCost: number;
  averageLatencyMs: number;
  byProvider: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
  }>;
  byModel: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
  }>;
}

// Price per 1M tokens (in USD) - can be updated
export const MODEL_PRICING: Record<string, { prompt: number; completion: number }> = {
  // OpenAI
  'gpt-4o': { prompt: 5.0, completion: 15.0 },
  'gpt-4o-mini': { prompt: 0.15, completion: 0.6 },
  'gpt-4-turbo': { prompt: 10.0, completion: 30.0 },
  'gpt-4': { prompt: 30.0, completion: 60.0 },
  'gpt-3.5-turbo': { prompt: 0.5, completion: 1.5 },

  // Anthropic
  'claude-opus-4-6': { prompt: 15.0, completion: 75.0 },
  'claude-3-5-sonnet-20241022': { prompt: 3.0, completion: 15.0 },
  'claude-3-5-sonnet': { prompt: 3.0, completion: 15.0 },
  'claude-3-haiku': { prompt: 0.25, completion: 1.25 },

  // DeepSeek
  'deepseek-chat': { prompt: 0.14, completion: 0.28 },
  'deepseek-coder': { prompt: 0.14, completion: 0.28 },

  // MiniMax
  'abab6.5s-chat': { prompt: 0.2, completion: 0.2 },

  // Kimi
  'moonshot-v1-8k': { prompt: 0.6, completion: 0.6 },
  'moonshot-v1-32k': { prompt: 1.2, completion: 1.2 },
  'moonshot-v1-128k': { prompt: 4.5, completion: 4.5 },

  // Doubao
  'doubao-pro-32k': { prompt: 0.8, completion: 2.0 },
  'doubao-lite-32k': { prompt: 0.2, completion: 0.2 },

  // GLM
  'glm-4': { prompt: 0.1, completion: 0.1 },
  'glm-4-flash': { prompt: 0.0, completion: 0.0 },
  'glm-3-turbo': { prompt: 0.05, completion: 0.05 },

  // Default fallback
  'default': { prompt: 1.0, completion: 1.0 },
};

const USAGE_RECORDS_KEY = 'ai_usage_records';
const MAX_RECORDS = 1000; // Keep last 1000 records

class UsageTrackingService {
  private records: UsageRecord[] = [];

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load records from storage
   */
  private loadFromStorage(): void {
    try {
      const recordsJson = mmkvStorage.getString(USAGE_RECORDS_KEY);
      if (recordsJson) {
        this.records = JSON.parse(recordsJson);
      }
    } catch (error) {
      console.error('Failed to load usage records:', error);
      this.records = [];
    }
  }

  /**
   * Save records to storage
   */
  private saveToStorage(): void {
    try {
      // Keep only last MAX_RECORDS
      if (this.records.length > MAX_RECORDS) {
        this.records = this.records.slice(-MAX_RECORDS);
      }
      mmkvStorage.setString(USAGE_RECORDS_KEY, JSON.stringify(this.records));
    } catch (error) {
      console.error('Failed to save usage records:', error);
    }
  }

  /**
   * Calculate cost for a given model and token counts
   */
  calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['default'];
    const promptCost = (promptTokens / 1_000_000) * pricing.prompt;
    const completionCost = (completionTokens / 1_000_000) * pricing.completion;
    return promptCost + completionCost;
  }

  /**
   * Record an API call
   */
  recordUsage(
    provider: string,
    model: string,
    promptTokens: number,
    completionTokens: number,
    latencyMs: number
  ): void {
    const totalTokens = promptTokens + completionTokens;
    const cost = this.calculateCost(model, promptTokens, completionTokens);

    const record: UsageRecord = {
      timestamp: Date.now(),
      provider,
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      cost,
      latencyMs,
    };

    this.records.push(record);
    this.saveToStorage();
  }

  /**
   * Get usage summary for a time period
   */
  getSummary(hours: number = 24): UsageSummary {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    const filtered = this.records.filter(r => r.timestamp >= cutoff);

    const byProvider: UsageSummary['byProvider'] = {};
    const byModel: UsageSummary['byModel'] = {};

    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalCost = 0;
    let totalLatency = 0;

    for (const record of filtered) {
      totalPromptTokens += record.promptTokens;
      totalCompletionTokens += record.completionTokens;
      totalCost += record.cost;
      totalLatency += record.latencyMs;

      // By provider
      if (!byProvider[record.provider]) {
        byProvider[record.provider] = { requests: 0, tokens: 0, cost: 0 };
      }
      byProvider[record.provider].requests++;
      byProvider[record.provider].tokens += record.totalTokens;
      byProvider[record.provider].cost += record.cost;

      // By model
      if (!byModel[record.model]) {
        byModel[record.model] = { requests: 0, tokens: 0, cost: 0 };
      }
      byModel[record.model].requests++;
      byModel[record.model].tokens += record.totalTokens;
      byModel[record.model].cost += record.cost;
    }

    return {
      totalRequests: filtered.length,
      totalPromptTokens,
      totalCompletionTokens,
      totalTokens: totalPromptTokens + totalCompletionTokens,
      totalCost,
      averageLatencyMs: filtered.length > 0 ? totalLatency / filtered.length : 0,
      byProvider,
      byModel,
    };
  }

  /**
   * Get today's usage summary
   */
  getTodaySummary(): UsageSummary {
    return this.getSummary(24);
  }

  /**
   * Get this week's usage summary
   */
  getWeekSummary(): UsageSummary {
    return this.getSummary(24 * 7);
  }

  /**
   * Clear all usage records
   */
  clearRecords(): void {
    this.records = [];
    this.saveToStorage();
  }

  /**
   * Get recent records
   */
  getRecentRecords(count: number = 10): UsageRecord[] {
    return this.records.slice(-count);
  }
}

// Singleton
export const usageTrackingService = new UsageTrackingService();
export default usageTrackingService;
