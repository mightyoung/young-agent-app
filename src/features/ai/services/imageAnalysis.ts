// Image Analysis Service - 图像分析服务
// 提供图像识别和分析能力

import { mmkvStorage } from '../../../core/storage/mmkv';

const IMAGE_SETTINGS_KEY = 'image_settings';

export interface ImageSettings {
  enabled: boolean;
  autoAnalyze: boolean;
  maxImageSize: number; // KB
}

// 默认设置
const DEFAULT_SETTINGS: ImageSettings = {
  enabled: true,
  autoAnalyze: true,
  maxImageSize: 5000, // 5MB
};

export interface ImageAnalysisResult {
  success: boolean;
  description?: string;
  tags?: string[];
  objects?: string[];
  hazards?: string[];
  safetyIssues?: string[];
  confidence?: number;
  error?: string;
}

/**
 * 图像分析服务
 * 注意：此服务需要连接视觉大模型 API 进行图像分析
 * 支持的 Provider：
 * - OpenAI Vision (GPT-4V)
 * - Claude Vision
 * - Anthropic Claude
 */
class ImageAnalysisService {
  private settings: ImageSettings = { ...DEFAULT_SETTINGS };

  constructor() {
    this.loadSettings();
  }

  /**
   * 加载设置
   */
  private loadSettings(): void {
    try {
      const settingsJson = mmkvStorage.getString(IMAGE_SETTINGS_KEY);
      if (settingsJson) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) };
      }
    } catch (error) {
      console.error('[ImageAnalysis] Failed to load settings:', error);
    }
  }

  /**
   * 保存设置
   */
  private saveSettings(): void {
    try {
      mmkvStorage.setString(IMAGE_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('[ImageAnalysis] Failed to save settings:', error);
    }
  }

  /**
   * 获取设置
   */
  getSettings(): ImageSettings {
    return { ...this.settings };
  }

  /**
   * 更新设置
   */
  updateSettings(updates: Partial<ImageSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
  }

  /**
   * 检查是否支持图像分析
   */
  isSupported(): boolean {
    // 需要配置视觉大模型 API
    return true; // 预留接口
  }

  /**
   * 分析图像
   * @param imageUri 图像 URI (本地或远程)
   * @param prompt 分析提示词（可选）
   */
  async analyze(
    imageUri: string,
    prompt?: string
  ): Promise<ImageAnalysisResult> {
    const defaultPrompt = prompt || `请分析这张图片，识别：
1. 图像中的主要物体和场景
2. 是否存在安全隐患（如消防通道堵塞、电气问题等）
3. 如果是设备，检查设备状态是否正常
4. 给出简短的安全评估`;

    try {
      // 注意：这里需要集成实际的视觉大模型 API
      // 当前返回模拟结果，实际实现需要：
      // 1. 将图像转换为 base64
      // 2. 调用视觉大模型 API (如 OpenAI GPT-4V, Claude Vision)
      // 3. 解析返回结果

      console.log('[ImageAnalysis] Analyzing image:', imageUri);

      // 预留接口 - 返回模拟结果
      // 实际实现需要连接视觉大模型 API
      return {
        success: true,
        description: '图像分析需要配置视觉大模型 API',
        tags: ['需要配置API'],
        hazards: [],
        safetyIssues: [],
        confidence: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '分析失败',
      };
    }
  }

  /**
   * 批量分析图像
   */
  async analyzeBatch(
    imageUris: string[],
    prompt?: string
  ): Promise<ImageAnalysisResult[]> {
    const results: ImageAnalysisResult[] = [];

    for (const uri of imageUris) {
      const result = await this.analyze(uri, prompt);
      results.push(result);
    }

    return results;
  }

  /**
   * 从图像中提取安全隐患（简化版）
   * 基于关键词匹配，不需要 API
   */
  extractSafetyIssues(description: string): string[] {
    const issues: string[] = [];
    const lowerDesc = description.toLowerCase();

    // 常见安全隐患关键词
    const safetyKeywords = [
      { keyword: '堵塞', issue: '通道堵塞' },
      { keyword: '杂物', issue: '杂物堆放' },
      { keyword: '破损', issue: '设备破损' },
      { keyword: '损坏', issue: '设施损坏' },
      { keyword: '老化', issue: '设备老化' },
      { keyword: '漏电', issue: '电气安全隐患' },
      { keyword: '火花', issue: '电气火花' },
      { keyword: '烟雾', issue: '烟雾隐患' },
      { keyword: '火焰', issue: '火灾隐患' },
      { keyword: '过期', issue: '设备过期' },
      { keyword: '无水', issue: '消防设施无水' },
      { keyword: '无电', issue: '断电隐患' },
    ];

    for (const { keyword, issue } of safetyKeywords) {
      if (lowerDesc.includes(keyword)) {
        issues.push(issue);
      }
    }

    return issues;
  }

  /**
   * 验证图像大小
   */
  validateImageSize(sizeBytes: number): boolean {
    const maxBytes = this.settings.maxImageSize * 1024;
    return sizeBytes <= maxBytes;
  }

  /**
   * 压缩图像（预留接口）
   * 实际实现需要使用 expo-image-manipulator
   */
  async compressImage(uri: string, quality: number = 0.8): Promise<string | null> {
    // 预留接口
    console.log('[ImageAnalysis] Compress image (not implemented)');
    return uri;
  }
}

// Singleton
export const imageAnalysisService = new ImageAnalysisService();

// 便捷函数
export const imageService = {
  /**
   * 分析图像
   */
  analyze: (imageUri: string, prompt?: string) =>
    imageAnalysisService.analyze(imageUri, prompt),

  /**
   * 批量分析
   */
  analyzeBatch: (imageUris: string[], prompt?: string) =>
    imageAnalysisService.analyzeBatch(imageUris, prompt),

  /**
   * 提取安全隐患
   */
  extractSafetyIssues: (description: string) =>
    imageAnalysisService.extractSafetyIssues(description),

  /**
   * 验证图像大小
   */
  validateSize: (sizeBytes: number) =>
    imageAnalysisService.validateImageSize(sizeBytes),

  /**
   * 获取设置
   */
  getSettings: () => imageAnalysisService.getSettings(),

  /**
   * 更新设置
   */
  updateSettings: (settings: Partial<ImageSettings>) =>
    imageAnalysisService.updateSettings(settings),
};

export default imageService;
