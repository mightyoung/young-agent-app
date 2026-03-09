// AI Service Initialization - Load API Key from .env to Keychain

import { secureStorage } from './secureStorage';
import { syncBusinessDataToRAG } from './businessDataSync';

// API Key from environment (only works in development with expo-dotenv or similar)
// In production, user should input their own key
const ENV_API_KEY = process.env.DEEPSEEK_API_KEY;

// Test mode: allow using a test API key when no real key is configured
const TEST_MODE = typeof window !== 'undefined' && (__DEV__ || process.env.NODE_ENV === 'test');

export async function initializeAIService(): Promise<boolean> {
  console.log('[AI Service] Initializing...');

  try {
    // Check if API key already exists in Keychain
    const hasKey = await secureStorage.hasApiKey();
    console.log('[AI Service] API key exists in Keychain:', hasKey);

    if (!hasKey) {
      // Try to load from .env (development) or prompt user (production)
      if (ENV_API_KEY) {
        console.log('[AI Service] Loading API key from .env...');
        await secureStorage.setApiKey(ENV_API_KEY);
        console.log('[AI Service] API key saved to Keychain');
      } else if (TEST_MODE) {
        // In test mode, allow app to run without API key for UI testing
        console.log('[AI Service] Test mode: running without API key');
        return true;
      } else {
        console.log('[AI Service] No API key found. Please configure in settings.');
        return false;
      }
    }

    // R4.3: 启动时同步业务数据到 RAG
    console.log('[AI Service] Syncing business data to RAG...');
    try {
      const syncResult = await syncBusinessDataToRAG();
      if (syncResult.success) {
        console.log('[AI Service] Business data synced:', syncResult);
      } else {
        console.warn('[AI Service] Business data sync failed:', syncResult.error);
      }
    } catch (syncError) {
      console.warn('[AI Service] Business data sync error:', syncError);
    }

    return true;
  } catch (error) {
    console.error('[AI Service] Initialization failed:', error);

    // In test mode, return true anyway to allow UI testing
    if (TEST_MODE) {
      console.log('[AI Service] Test mode: continuing despite error');
      return true;
    }

    return false;
  }
}

/**
 * Check if AI service is ready (API key exists)
 */
export async function isAIServiceReady(): Promise<boolean> {
  return secureStorage.hasApiKey();
}

/**
 * Reset API key (for testing or reconfiguration)
 */
export async function resetAPIKey(): Promise<void> {
  await secureStorage.deleteApiKey();
  console.log('[AI Service] API key removed from Keychain');
}
