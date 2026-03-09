import { create } from 'zustand';
import { AppSettings, AIProvider } from '../../../types';
import { settingsStorage, mmkvStorage, STORAGE_KEYS } from '../../../core/storage/mmkv';
import { config } from '../../../core/constants/config';

interface SettingsState {
  settings: AppSettings;
  aiProviders: AIProvider[];
  isLoading: boolean;

  // Actions
  loadSettings: () => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  loadAIProviders: () => void;
  updateAIProvider: (provider: AIProvider) => void;
  setAPI: (mode: 'local' | 'cloud', url?: string) => void;
  toggleHomeScreenMode: () => void;
}

const defaultSettings: AppSettings = {
  aiProvider: config.ai.defaultProvider,
  apiMode: 'local',
  offlineEnabled: true,
  syncOnWifiOnly: false,
  homeScreenMode: 'classic',
};

const defaultAIProviders: AIProvider[] = [
  { id: 'openai', name: 'OpenAI', type: 'openai', enabled: true, model: 'gpt-4o-mini' },
  { id: 'anthropic', name: 'Anthropic Claude', type: 'anthropic', enabled: false },
  { id: 'deepseek', name: 'DeepSeek', type: 'deepseek', enabled: false },
  { id: 'minimax', name: 'MiniMax', type: 'minimax', enabled: false },
  { id: 'kimi', name: 'Kimi', type: 'kimi', enabled: false },
  { id: 'doubao', name: 'Doubao', type: 'doubao', enabled: false },
  { id: 'glm', name: 'GLM', type: 'glm', enabled: false },
  { id: 'custom', name: '自定义', type: 'custom', enabled: false },
];

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  aiProviders: defaultAIProviders,
  isLoading: false,

  loadSettings: () => {
    const saved = settingsStorage.getSettings();
    if (saved) {
      set({ settings: { ...defaultSettings, ...saved } });
    }

    // Load AI config
    const aiConfig = mmkvStorage.getObject<{ providers: AIProvider[] }>(STORAGE_KEYS.AI_CONFIG);
    if (aiConfig?.providers) {
      set({ aiProviders: aiConfig.providers });
    }
  },

  updateSettings: (updates: Partial<AppSettings>) => {
    const current = get().settings;
    const updated = { ...current, ...updates };
    settingsStorage.saveSettings(updated);
    set({ settings: updated });
  },

  loadAIProviders: () => {
    const aiConfig = mmkvStorage.getObject<{ providers: AIProvider[] }>(STORAGE_KEYS.AI_CONFIG);
    if (aiConfig?.providers) {
      set({ aiProviders: aiConfig.providers });
    } else {
      set({ aiProviders: defaultAIProviders });
    }
  },

  updateAIProvider: (provider: AIProvider) => {
    const providers = get().aiProviders;
    const index = providers.findIndex((p) => p.id === provider.id);

    if (index >= 0) {
      providers[index] = provider;
    } else {
      providers.push(provider);
    }

    mmkvStorage.setObject(STORAGE_KEYS.AI_CONFIG, { providers });
    set({ aiProviders: [...providers] });
  },

  setAPI: (mode: 'local' | 'cloud', url?: string) => {
    get().updateSettings({
      apiMode: mode,
      cloudUrl: url,
    });
  },

  toggleHomeScreenMode: () => {
    const current = get().settings.homeScreenMode;
    const newMode = current === 'classic' ? 'modern' : 'classic';
    get().updateSettings({ homeScreenMode: newMode });
  },
}));
