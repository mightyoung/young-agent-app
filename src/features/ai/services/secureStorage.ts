// Secure Storage Service - API Key Management
// Uses SecureStore on mobile, localStorage on web

import * as SecureStore from 'expo-secure-store';
import type { ProviderType } from './types';

// Storage key prefix
const API_KEY_PREFIX = 'ai_provider_api_key_';

// Check if we're running on web
const isWeb = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

/**
 * Get storage key for a specific provider
 */
function getProviderKey(providerType: ProviderType | string): string {
  return `${API_KEY_PREFIX}${providerType}`;
}

export const secureStorage = {
  /**
   * Save API key to secure storage (Keychain on iOS, Keystore on Android, localStorage on web)
   * @param apiKey - The API key to save
   * @param providerType - The provider type (defaults to 'deepseek')
   */
  async setApiKey(apiKey: string, providerType: ProviderType = 'deepseek'): Promise<void> {
    try {
      const key = getProviderKey(providerType);
      if (isWeb) {
        localStorage.setItem(key, apiKey);
      } else {
        await SecureStore.setItemAsync(key, apiKey, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED,
        });
      }
    } catch (error) {
      console.error('Failed to save API key:', error);
      throw new Error('Failed to save API key securely');
    }
  },

  /**
   * Get API key from secure storage
   * @param providerType - The provider type (defaults to 'deepseek')
   */
  async getApiKey(providerType: ProviderType = 'deepseek'): Promise<string | null> {
    try {
      const key = getProviderKey(providerType);
      if (isWeb) {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Failed to retrieve API key:', error);
      return null;
    }
  },

  /**
   * Delete API key from secure storage
   * @param providerType - The provider type (defaults to 'deepseek')
   */
  async deleteApiKey(providerType: ProviderType = 'deepseek'): Promise<void> {
    try {
      const key = getProviderKey(providerType);
      if (isWeb) {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
      throw new Error('Failed to delete API key');
    }
  },

  /**
   * Check if API key exists for a provider
   * @param providerType - The provider type (defaults to 'deepseek')
   */
  async hasApiKey(providerType: ProviderType = 'deepseek'): Promise<boolean> {
    const key = await this.getApiKey(providerType);
    return key !== null && key.length > 0;
  },

  /**
   * Get all configured provider API keys
   */
  async getAllConfiguredProviders(): Promise<ProviderType[]> {
    const providers: ProviderType[] = [
      'deepseek',
      'openai',
      'anthropic',
      'minimax',
      'kimi',
      'doubao',
      'glm',
      'custom',
    ];

    const configured: ProviderType[] = [];
    for (const provider of providers) {
      if (await this.hasApiKey(provider)) {
        configured.push(provider);
      }
    }
    return configured;
  },

  /**
   * Delete all API keys
   */
  async deleteAllApiKeys(): Promise<void> {
    const providers: ProviderType[] = [
      'deepseek',
      'openai',
      'anthropic',
      'minimax',
      'kimi',
      'doubao',
      'glm',
      'custom',
    ];

    for (const provider of providers) {
      await this.deleteApiKey(provider);
    }
  },

  /**
   * Initialize API key from .env if not exists
   * This is a fallback for development; in production, user should input their own key
   */
  async initializeApiKey(envKey?: string, providerType: ProviderType = 'deepseek'): Promise<boolean> {
    const hasKey = await this.hasApiKey(providerType);
    if (!hasKey && envKey) {
      await this.setApiKey(envKey, providerType);
      return true;
    }
    return hasKey;
  },

  /**
   * Get/set string value (generic)
   */
  async getString(key: string): Promise<string | null> {
    try {
      if (isWeb) {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  async setString(key: string, value: string): Promise<void> {
    try {
      if (isWeb) {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED,
        });
      }
    } catch (error) {
      console.error('Failed to save to secure storage:', error);
    }
  },

  async delete(key: string): Promise<void> {
    try {
      if (isWeb) {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('Failed to delete from secure storage:', error);
    }
  },
};
