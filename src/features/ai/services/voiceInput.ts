// Voice Input Service - 语音输入服务
// 提供语音识别能力（需要 expo-speech 或第三方库支持）

// 注意：expo-speech 可能未安装，这里使用动态导入
import { mmkvStorage } from '../../../core/storage/mmkv';

let Speech: any = null;
try {
  Speech = require('expo-speech');
} catch (e) {
  console.warn('[Voice] expo-speech not available');
}

const VOICE_SETTINGS_KEY = 'voice_settings';

export interface VoiceSettings {
  enabled: boolean;
  language: string;
  autoSend: boolean;
}

// 默认设置
const DEFAULT_SETTINGS: VoiceSettings = {
  enabled: true,
  language: 'zh-CN',
  autoSend: false,
};

/**
 * 语音输入服务
 * 注意：此服务依赖 expo-speech 进行语音识别
 * 如果需要更高级的语音识别，建议使用：
 * - expo-av (音频录制)
 * - @react-native-voice/voice
 * - 第三方 ASR 服务
 */
class VoiceInputService {
  private settings: VoiceSettings = { ...DEFAULT_SETTINGS };
  private isListening: boolean = false;
  private onResultCallback: ((text: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    this.loadSettings();
  }

  /**
   * 加载设置
   */
  private loadSettings(): void {
    try {
      const settingsJson = mmkvStorage.getString(VOICE_SETTINGS_KEY);
      if (settingsJson) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) };
      }
    } catch (error) {
      console.error('[Voice] Failed to load settings:', error);
    }
  }

  /**
   * 保存设置
   */
  private saveSettings(): void {
    try {
      mmkvStorage.setString(VOICE_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('[Voice] Failed to save settings:', error);
    }
  }

  /**
   * 获取设置
   */
  getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  /**
   * 更新设置
   */
  updateSettings(updates: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
  }

  /**
   * 检查是否支持语音识别
   */
  isSupported(): boolean {
    // expo-speech 主要用于语音合成
    // 真正的语音识别需要额外的库
    return false; // 需要额外配置
  }

  /**
   * 开始监听（预留接口）
   */
  async startListening(
    onResult: (text: string) => void,
    onError?: (error: string) => void
  ): Promise<boolean> {
    if (this.isListening) {
      return false;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;
    this.isListening = true;

    // 注意：这里需要集成实际的语音识别库
    // 当前预留接口，实际实现需要：
    // 1. 使用 @react-native-voice/voice
    // 2. 或使用第三方 ASR API

    console.log('[Voice] Start listening (not implemented - requires additional setup)');
    return true;
  }

  /**
   * 停止监听
   */
  stopListening(): void {
    this.isListening = false;
    this.onResultCallback = null;
    this.onErrorCallback = null;
  }

  /**
   * 是否正在监听
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * 语音合成（朗读文本）
   */
  speak(text: string, options?: {
    language?: string;
    pitch?: number;
    rate?: number;
    onDone?: () => void;
    onError?: (error: string) => void;
  }): void {
    if (!Speech) {
      console.warn('[Voice] Speech not available');
      return;
    }

    const speakOptions = {
      language: options?.language || this.settings.language,
      pitch: options?.pitch || 1.0,
      rate: options?.rate || 1.0,
    };

    Speech.speak(text, {
      ...speakOptions,
      onDone: () => {
        options?.onDone?.();
      },
      onError: (error: unknown) => {
        console.error('[Voice] Speak error:', error);
        options?.onError?.(error instanceof Error ? error.message : 'Unknown error');
      },
    });
  }

  /**
   * 停止朗读
   */
  stopSpeaking(): void {
    if (Speech) {
      Speech.stop();
    }
  }

  /**
   * 检查是否正在朗读
   */
  async isSpeaking(): Promise<boolean> {
    if (!Speech) return false;
    return await Speech.isSpeakingAsync();
  }
}

// Singleton
export const voiceInputService = new VoiceInputService();

// 便捷函数
export const voiceService = {
  /**
   * 朗读文本
   */
  speak: (text: string, options?: {
    language?: string;
    pitch?: number;
    rate?: number;
    onDone?: () => void;
    onError?: (error: string) => void;
  }) => voiceInputService.speak(text, options),

  /**
   * 停止朗读
   */
  stop: () => voiceInputService.stopSpeaking(),

  /**
   * 是否正在朗读
   */
  isSpeaking: () => voiceInputService.isSpeaking(),

  /**
   * 获取设置
   */
  getSettings: () => voiceInputService.getSettings(),

  /**
   * 更新设置
   */
  updateSettings: (settings: Partial<VoiceSettings>) =>
    voiceInputService.updateSettings(settings),
};

export default voiceService;
