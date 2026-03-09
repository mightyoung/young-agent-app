// Cross-platform MMKV storage
// Uses AsyncStorage for React Native, localStorage for web

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  USER: 'might_young_user',
  TOKEN: 'might_young_token',
  SETTINGS: 'might_young_settings',
  AI_CONFIG: 'might_young_ai_config',
  LAST_SYNC: 'might_young_last_sync',
  ONBOARDING: 'might_young_onboarding',
} as const;

// Detect if running in React Native
const isReactNative = typeof window !== 'undefined' && !window.localStorage;

// Synchronous storage for web
const webStorage = {
  getString: (key: string): string | undefined => {
    return localStorage.getItem(key) ?? undefined;
  },
  setString: (key: string, value: string): void => {
    localStorage.setItem(key, value);
  },
  getNumber: (key: string): number | undefined => {
    const value = localStorage.getItem(key);
    if (value === null) return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  },
  setNumber: (key: string, value: number): void => {
    localStorage.setItem(key, String(value));
  },
  getBoolean: (key: string): boolean | undefined => {
    const value = localStorage.getItem(key);
    if (value === null) return undefined;
    return value === 'true';
  },
  setBoolean: (key: string, value: boolean): void => {
    localStorage.setItem(key, String(value));
  },
  getObject: <T>(key: string): T | undefined => {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return undefined;
      }
    }
    return undefined;
  },
  setObject: <T>(key: string, value: T): void => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  delete: (key: string): void => {
    localStorage.removeItem(key);
  },
  contains: (key: string): boolean => {
    return localStorage.getItem(key) !== null;
  },
  clearAll: (): void => {
    const keys = Object.values(STORAGE_KEYS);
    keys.forEach(key => localStorage.removeItem(key));
  },
  getAllKeys: (): string[] => {
    return Object.values(STORAGE_KEYS).filter(key => localStorage.getItem(key) !== null);
  },
};

// React Native storage cache (sync access after initial load)
let rnCache: Record<string, string> = {};

// Initialize React Native cache
const initRNStorage = async (): Promise<void> => {
  try {
    const allKeys = Object.values(STORAGE_KEYS);
    const pairs = await AsyncStorage.multiGet(allKeys);
    rnCache = {};
    pairs.forEach(([key, value]) => {
      if (value !== null) {
        rnCache[key] = value;
      }
    });
  } catch (e) {
    console.warn('Failed to initialize RN storage cache:', e);
  }
};

// React Native storage (with sync cache)
const rnStorage = {
  getString: (key: string): string | undefined => {
    return rnCache[key] ?? undefined;
  },
  setString: (key: string, value: string): void => {
    rnCache[key] = value;
    AsyncStorage.setItem(key, value).catch(e => console.warn('AsyncStorage setString error:', e));
  },
  getNumber: (key: string): number | undefined => {
    const value = rnCache[key];
    if (value === undefined) return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  },
  setNumber: (key: string, value: number): void => {
    const strValue = String(value);
    rnCache[key] = strValue;
    AsyncStorage.setItem(key, strValue).catch(e => console.warn('AsyncStorage setNumber error:', e));
  },
  getBoolean: (key: string): boolean | undefined => {
    const value = rnCache[key];
    if (value === undefined) return undefined;
    return value === 'true';
  },
  setBoolean: (key: string, value: boolean): void => {
    const strValue = String(value);
    rnCache[key] = strValue;
    AsyncStorage.setItem(key, strValue).catch(e => console.warn('AsyncStorage setBoolean error:', e));
  },
  getObject: <T>(key: string): T | undefined => {
    const value = rnCache[key];
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return undefined;
      }
    }
    return undefined;
  },
  setObject: <T>(key: string, value: T): void => {
    const strValue = JSON.stringify(value);
    rnCache[key] = strValue;
    AsyncStorage.setItem(key, strValue).catch(e => console.warn('AsyncStorage setObject error:', e));
  },
  delete: (key: string): void => {
    delete rnCache[key];
    AsyncStorage.removeItem(key).catch(e => console.warn('AsyncStorage delete error:', e));
  },
  contains: (key: string): boolean => {
    return key in rnCache;
  },
  clearAll: (): void => {
    const keys = Object.values(STORAGE_KEYS);
    keys.forEach(key => delete rnCache[key]);
    AsyncStorage.multiRemove(keys).catch(e => console.warn('AsyncStorage clearAll error:', e));
  },
  getAllKeys: (): string[] => {
    return Object.values(STORAGE_KEYS).filter(key => key in rnCache);
  },
};

// Initialize on module load (for React Native)
if (isReactNative) {
  initRNStorage();
}

// Export the appropriate storage based on environment
export const mmkvStorage = isReactNative ? rnStorage : webStorage;

// Legacy export for compatibility
export const storage = mmkvStorage;

// Initialize function for React Native (call this after app starts)
export const initializeStorage = async (): Promise<void> => {
  if (isReactNative) {
    await initRNStorage();
  }
};

// User-specific storage helpers
export const userStorage = {
  saveUser: (user: any): void => {
    mmkvStorage.setObject(STORAGE_KEYS.USER, user);
  },

  getUser: () => {
    return mmkvStorage.getObject<any>(STORAGE_KEYS.USER);
  },

  saveToken: (token: string): void => {
    mmkvStorage.setString(STORAGE_KEYS.TOKEN, token);
  },

  getToken: (): string | undefined => {
    return mmkvStorage.getString(STORAGE_KEYS.TOKEN);
  },

  clearUser: (): void => {
    mmkvStorage.delete(STORAGE_KEYS.USER);
    mmkvStorage.delete(STORAGE_KEYS.TOKEN);
  },
};

// Settings storage helpers
export const settingsStorage = {
  saveSettings: (settings: any): void => {
    mmkvStorage.setObject(STORAGE_KEYS.SETTINGS, settings);
  },

  getSettings: () => {
    return mmkvStorage.getObject<any>(STORAGE_KEYS.SETTINGS);
  },

  updateSettings: (updates: Partial<any>): void => {
    const current = settingsStorage.getSettings() || {};
    settingsStorage.saveSettings({ ...current, ...updates });
  },
};
