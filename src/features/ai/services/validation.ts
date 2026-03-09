// API Key Validation Service - API Key验证服务
// 验证API Key有效性，检测失效情况

import { secureStorage } from './secureStorage';
import { providerFactory } from './provider/factory';
import type { ProviderType } from './types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  provider?: ProviderType;
}

/**
 * 验证指定Provider的API Key
 */
export async function validateApiKey(providerType: ProviderType): Promise<ValidationResult> {
  try {
    const apiKey = await secureStorage.getApiKey(providerType);

    if (!apiKey) {
      return {
        valid: false,
        error: '未配置API Key',
        provider: providerType,
      };
    }

    // 尝试调用API
    const provider = providerFactory.getProvider(providerType);
    await provider.chat(
      [{ id: '1', role: 'user', content: 'test', timestamp: Date.now() }],
      { maxTokens: 5 }
    );

    return {
      valid: true,
      provider: providerType,
    };
  } catch (error) {
    if (isAuthError(error)) {
      return {
        valid: false,
        error: 'API Key已失效',
        provider: providerType,
      };
    }

    return {
      valid: false,
      error: error instanceof Error ? error.message : '验证失败',
      provider: providerType,
    };
  }
}

/**
 * 检查是否有任何有效的API Key
 */
export async function checkAnyValidApiKey(): Promise<ValidationResult> {
  const providers: ProviderType[] = [
    'deepseek',
    'openai',
    'anthropic',
    'minimax',
    'kimi',
    'doubao',
    'glm',
  ];

  for (const provider of providers) {
    const result = await validateApiKey(provider);
    if (result.valid) {
      return result;
    }
  }

  return {
    valid: false,
    error: '未配置任何有效的API Key',
  };
}

/**
 * 检测是否是认证错误
 */
function isAuthError(error: unknown): boolean {
  // 401错误
  if (error && typeof error === 'object') {
    if ('status' in error && (error as any).status === 401) {
      return true;
    }
    if ('response' in error) {
      const response = (error as any).response;
      if (response?.status === 401) {
        return true;
      }
    }
  }

  // 错误消息包含关键词
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes('401') ||
      message.includes('invalid api key') ||
      message.includes('api key') ||
      message.includes('unauthorized')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * 获取第一个可用的Provider
 */
export async function getFirstAvailableProvider(): Promise<ProviderType | null> {
  const result = await checkAnyValidApiKey();
  return result.valid ? result.provider || null : null;
}
