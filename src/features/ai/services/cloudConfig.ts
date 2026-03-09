// Cloud Config Service - 云端配置服务
// 预留接口：供后续快速接入云端大模型API Key管理

import { mmkvStorage } from '../../../core/storage/mmkv';
import type { ProviderType } from './types';

const CLOUD_CONFIG_KEY = 'ai_cloud_config';

// 云端配置结构
export interface CloudConfig {
  enabled: boolean;
  provider?: ProviderType;
  apiKey?: string;
  baseURL?: string;
  model?: string;
  // 预留更多配置项
  customHeaders?: Record<string, string>;
  timeout?: number;
  maxRetries?: number;
}

/**
 * 云端配置服务
 * 预留接口，供后续快速迭代
 */
class CloudConfigService {
  private config: CloudConfig = { enabled: false };

  constructor() {
    this.loadFromStorage();
  }

  /**
   * 从存储加载配置
   */
  private loadFromStorage(): void {
    try {
      const configJson = mmkvStorage.getString(CLOUD_CONFIG_KEY);
      if (configJson) {
        this.config = JSON.parse(configJson);
      }
    } catch (error) {
      console.error('Failed to load cloud config:', error);
    }
  }

  /**
   * 保存配置到存储
   */
  private saveToStorage(): void {
    try {
      mmkvStorage.setString(CLOUD_CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save cloud config:', error);
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): CloudConfig {
    return { ...this.config };
  }

  /**
   * 检查是否启用云端配置
   */
  isEnabled(): boolean {
    return this.config.enabled && !!this.config.apiKey;
  }

  /**
   * 设置云端配置
   */
  setConfig(config: Partial<CloudConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveToStorage();
  }

  /**
   * 启用云端配置
   */
  enable(config: Omit<CloudConfig, 'enabled'>): void {
    this.config = { ...config, enabled: true };
    this.saveToStorage();
  }

  /**
   * 禁用云端配置
   */
  disable(): void {
    this.config.enabled = false;
    this.saveToStorage();
  }

  /**
   * 清除云端配置
   */
  clear(): void {
    this.config = { enabled: false };
    mmkvStorage.delete(CLOUD_CONFIG_KEY);
  }

  /**
   * 获取Provider配置（用于API调用）
   */
  getProviderConfig(): {
    baseURL: string;
    model: string;
    apiKey: string;
    timeout: number;
  } | null {
    if (!this.isEnabled()) return null;

    // 根据provider返回对应配置
    const providerConfigs: Record<string, { baseURL: string; model: string }> = {
      deepseek: { baseURL: 'https://api.deepseek.com', model: 'deepseek-chat' },
      openai: { baseURL: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
      anthropic: { baseURL: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-20241022' },
      minimax: { baseURL: 'https://api.minimax.chat/v1', model: 'abab6.5s-chat' },
      kimi: { baseURL: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
      doubao: { baseURL: 'https://ark.cn-beijing.volces.com/api/v3', model: 'doubao-pro-32k' },
      glm: { baseURL: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4' },
    };

    const providerConfig = providerConfigs[this.config.provider || 'deepseek'];

    return {
      baseURL: this.config.baseURL || providerConfig?.baseURL || '',
      model: this.config.model || providerConfig?.model || '',
      apiKey: this.config.apiKey || '',
      timeout: this.config.timeout || 30000,
    };
  }
}

// Singleton
export const cloudConfigService = new CloudConfigService();
export default cloudConfigService;
