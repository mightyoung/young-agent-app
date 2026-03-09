// Config Sync Service - 配置同步服务
// 实现配置同步、定时更新、离线缓存

import { mmkvStorage } from '../../../core/storage/mmkv';
import { cloudConfigService, type CloudConfig } from './cloudConfig';

const SYNC_CONFIG_KEY = 'config_sync_settings';
const LAST_SYNC_TIME_KEY = 'last_sync_time';
const SYNC_ENABLED_KEY = 'sync_enabled';

// 同步配置
export interface SyncConfig {
  enabled: boolean;
  intervalMs: number;        // 同步间隔（毫秒），默认 30 分钟
  lastSyncTime: number;     // 上次同步时间
  autoSync: boolean;        // 是否自动同步
  syncOnAppStart: boolean;  // 是否在应用启动时同步
}

// 默认配置
const DEFAULT_SYNC_CONFIG: SyncConfig = {
  enabled: true,
  intervalMs: 30 * 60 * 1000, // 30 分钟
  lastSyncTime: 0,
  autoSync: true,
  syncOnAppStart: true,
};

let syncTimer: ReturnType<typeof setInterval> | null = null;
let syncCallback: (() => Promise<void>) | null = null;

/**
 * 配置同步服务
 */
class ConfigSyncService {
  private config: SyncConfig = { ...DEFAULT_SYNC_CONFIG };

  constructor() {
    this.loadFromStorage();
  }

  /**
   * 从存储加载配置
   */
  private loadFromStorage(): void {
    try {
      const configJson = mmkvStorage.getString(SYNC_CONFIG_KEY);
      if (configJson) {
        this.config = { ...DEFAULT_SYNC_CONFIG, ...JSON.parse(configJson) };
      }
    } catch (error) {
      console.error('[ConfigSync] Failed to load config:', error);
    }
  }

  /**
   * 保存配置到存储
   */
  private saveToStorage(): void {
    try {
      mmkvStorage.setString(SYNC_CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('[ConfigSync] Failed to save config:', error);
    }
  }

  /**
   * 获取同步配置
   */
  getConfig(): SyncConfig {
    return { ...this.config };
  }

  /**
   * 更新同步配置
   */
  updateConfig(updates: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveToStorage();
  }

  /**
   * 是否启用同步
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * 启用同步
   */
  enable(): void {
    this.config.enabled = true;
    this.saveToStorage();
    if (this.config.autoSync) {
      this.startAutoSync();
    }
  }

  /**
   * 禁用同步
   */
  disable(): void {
    this.config.enabled = false;
    this.saveToStorage();
    this.stopAutoSync();
  }

  /**
   * 设置同步回调函数
   */
  setSyncCallback(callback: () => Promise<void>): void {
    syncCallback = callback;
  }

  /**
   * 启动自动同步
   */
  startAutoSync(): void {
    if (syncTimer) {
      this.stopAutoSync();
    }

    if (!this.config.enabled || !syncCallback) {
      return;
    }

    // 立即执行一次同步
    this.syncNow();

    // 设置定时同步
    syncTimer = setInterval(() => {
      this.syncNow();
    }, this.config.intervalMs);
  }

  /**
   * 停止自动同步
   */
  stopAutoSync(): void {
    if (syncTimer) {
      clearInterval(syncTimer);
      syncTimer = null;
    }
  }

  /**
   * 立即同步
   */
  async syncNow(): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!syncCallback) {
      return { success: false, error: 'No sync callback configured' };
    }

    try {
      console.log('[ConfigSync] Starting sync...');
      await syncCallback();
      this.config.lastSyncTime = Date.now();
      this.saveToStorage();
      console.log('[ConfigSync] Sync completed successfully');
      return { success: true };
    } catch (error) {
      console.error('[ConfigSync] Sync failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 获取上次同步时间
   */
  getLastSyncTime(): number {
    return this.config.lastSyncTime;
  }

  /**
   * 获取上次同步时间（格式化）
   */
  getLastSyncTimeFormatted(): string {
    if (this.config.lastSyncTime === 0) {
      return '从未同步';
    }
    const date = new Date(this.config.lastSyncTime);
    return date.toLocaleString('zh-CN');
  }

  /**
   * 检查是否需要同步
   */
  needsSync(): boolean {
    if (!this.config.enabled) return false;
    if (this.config.lastSyncTime === 0) return true;
    return Date.now() - this.config.lastSyncTime > this.config.intervalMs;
  }

  /**
   * 重置为默认配置
   */
  reset(): void {
    this.config = { ...DEFAULT_SYNC_CONFIG };
    this.saveToStorage();
    this.stopAutoSync();
  }
}

// Singleton
export const configSyncService = new ConfigSyncService();

/**
 * 便捷函数：初始化同步
 */
export function initializeSync(callback: () => Promise<void>): void {
  configSyncService.setSyncCallback(callback);
  if (configSyncService.getConfig().syncOnAppStart) {
    configSyncService.startAutoSync();
  }
}

/**
 * 便捷函数：手动触发同步
 */
export async function triggerSync(): Promise<{
  success: boolean;
  error?: string;
}> {
  return configSyncService.syncNow();
}

/**
 * 便捷函数：获取同步状态
 */
export function getSyncStatus(): {
  enabled: boolean;
  lastSyncTime: string;
  interval: string;
  needsSync: boolean;
} {
  const config = configSyncService.getConfig();
  return {
    enabled: config.enabled,
    lastSyncTime: configSyncService.getLastSyncTimeFormatted(),
    interval: `${config.intervalMs / 60000} 分钟`,
    needsSync: configSyncService.needsSync(),
  };
}
