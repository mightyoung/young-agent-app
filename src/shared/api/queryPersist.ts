/**
 * React Query 持久化存储适配器
 *
 * 使用 react-native-mmkv 进行高性能缓存持久化
 * 这是移动端应用的关键功能 - 支持离线访问
 *
 * 基于 @tanstack/query-persist-client-core
 */

import { PersistedClient } from '@tanstack/query-persist-client-core';
import { mmkvStorage } from '@/core/storage/mmkv';

// 持久化存储键
const QUERY_CACHE_KEY = 'react_query_cache';

/**
 * 序列化客户端数据
 * 将 QueryClient 状态转换为可存储的字符串
 */
export const mmkvPersister = {
  /**
   * 保存客户端状态到存储
   * React Query 会调用此方法保存缓存
   */
  persistClient: async (client: PersistedClient): Promise<void> => {
    try {
      const serialized = JSON.stringify(client);
      mmkvStorage.setObject(QUERY_CACHE_KEY, {
        data: serialized,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn('[QueryPersist] Failed to persist cache:', error);
    }
  },

  /**
   * 从存储恢复客户端状态
   * React Query 启动时调用此方法恢复缓存
   */
  restoreClient: async (): Promise<PersistedClient | null> => {
    try {
      const cached = mmkvStorage.getObject<{ data: string; timestamp: number }>(QUERY_CACHE_KEY);

      if (!cached?.data) {
        return null;
      }

      // 检查缓存是否过期 (24小时)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - cached.timestamp > maxAge) {
        mmkvStorage.delete(QUERY_CACHE_KEY);
        console.log('[QueryPersist] Cache expired, cleared');
        return null;
      }

      console.log('[QueryPersist] Cache restored from', new Date(cached.timestamp).toISOString());
      return JSON.parse(cached.data) as PersistedClient;
    } catch (error) {
      console.warn('[QueryPersist] Failed to restore cache:', error);
      return null;
    }
  },

  /**
   * 清除持久化的缓存
   */
  clearClient: async (): Promise<void> => {
    mmkvStorage.delete(QUERY_CACHE_KEY);
    console.log('[QueryPersist] Cache cleared');
  },
};

/**
 * 获取缓存信息 (用于调试)
 */
export const getCacheInfo = (): { exists: boolean; size: number; timestamp: number | null } => {
  try {
    const cached = mmkvStorage.getObject<{ data: string; timestamp: number }>(QUERY_CACHE_KEY);
    return {
      exists: !!cached?.data,
      size: cached?.data?.length || 0,
      timestamp: cached?.timestamp || null,
    };
  } catch {
    return { exists: false, size: 0, timestamp: null };
  }
};
