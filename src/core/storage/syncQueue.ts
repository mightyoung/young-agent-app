// Sync Queue Manager
// 同步队列管理 - 离线数据同步

import { dbUtils, TableNames } from './sqlite';
import { apiServices } from '../network';

// ============================================
// 类型定义
// ============================================

/** 同步队列项 */
export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'device' | 'hazard' | 'inspection' | 'message';
  entityId: string;
  payload?: any;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
  errorMsg?: string;
  createdAt: number;
  updatedAt: number;
}

/** 同步配置 */
export interface SyncConfig {
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  onSyncStart?: () => void;
  onSyncComplete?: (success: number, failed: number) => void;
  onSyncError?: (error: Error) => void;
}

// ============================================
// 同步队列管理
// ============================================

class SyncQueueManager {
  private config: SyncConfig;
  private isSyncing: boolean = false;

  constructor() {
    this.config = {
      maxRetries: 3,
      retryDelay: 5000,
      batchSize: 50,
    };
  }

  /** 初始化 */
  async initialize(): Promise<void> {
    console.log('[Sync] 同步队列管理器初始化');
  }

  /** 配置 */
  configure(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /** 添加到同步队列 */
  async addToQueue(item: Omit<SyncQueueItem, 'id' | 'retryCount' | 'status' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = Date.now();
    await dbUtils.insert(TableNames.SYNC_QUEUE, {
      id: `sync_${now}_${Math.random().toString(36).substr(2, 9)}`,
      type: item.type,
      entity: item.entity,
      entity_id: item.entityId,
      payload: item.payload ? JSON.stringify(item.payload) : null,
      retry_count: 0,
      status: 'pending',
      created_at: now,
      updated_at: now,
    });

    console.log(`[Sync] 添加到队列: ${item.entity} ${item.entityId} (${item.type})`);
  }

  /** 获取待同步项 */
  async getPendingItems(limit: number = 50): Promise<SyncQueueItem[]> {
    const rows = await dbUtils.queryAll<any>(
      TableNames.SYNC_QUEUE,
      'status = ? AND retry_count < ?',
      ['pending', this.config.maxRetries]
    );

    return rows.slice(0, limit).map(this.rowToItem);
  }

  /** 执行同步 */
  async sync(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      console.log('[Sync] 同步正在进行中，跳过');
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.config.onSyncStart?.();

    let success = 0;
    let failed = 0;

    try {
      const items = await this.getPendingItems(this.config.batchSize);
      console.log(`[Sync] 开始同步 ${items.length} 项`);

      for (const item of items) {
        try {
          await this.syncItem(item);
          await this.removeFromQueue(item.id);
          success++;
        } catch (error) {
          await this.markFailed(item.id, error as Error);
          failed++;
        }
      }
    } catch (error) {
      console.error('[Sync] 同步出错:', error);
      this.config.onSyncError?.(error as Error);
    } finally {
      this.isSyncing = false;
      this.config.onSyncComplete?.(success, failed);
    }

    return { success, failed };
  }

  /** 同步单个项 */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    // 标记为同步中
    await dbUtils.update(
      TableNames.SYNC_QUEUE,
      { status: 'syncing', updated_at: Date.now() },
      'id = ?',
      [item.id]
    );

    const payload = item.payload ? JSON.parse(item.payload) : undefined;

    switch (item.entity) {
      case 'hazard':
        await this.syncHazard(item.type, item.entityId, payload);
        break;
      case 'inspection':
        await this.syncInspection(item.type, item.entityId, payload);
        break;
      case 'device':
        await this.syncDevice(item.type, item.entityId, payload);
        break;
      default:
        console.warn(`[Sync] 未知实体类型: ${item.entity}`);
    }
  }

  /** 同步隐患 */
  private async syncHazard(type: string, id: string, payload?: any): Promise<void> {
    switch (type) {
      case 'create':
        await apiServices.hazard.create(payload);
        break;
      case 'update':
        await apiServices.hazard.update(id, payload);
        break;
      case 'delete':
        await apiServices.hazard.delete(id);
        break;
    }
  }

  /** 同步巡检 */
  private async syncInspection(type: string, id: string, payload?: any): Promise<void> {
    switch (type) {
      case 'create':
        await apiServices.inspection.submitRecord(payload);
        break;
      case 'update':
        await apiServices.inspection.updateRecord(id, payload);
        break;
    }
  }

  /** 同步设备 */
  private async syncDevice(type: string, id: string, payload?: any): Promise<void> {
    switch (type) {
      case 'create':
        await apiServices.device.create(payload);
        break;
      case 'update':
        await apiServices.device.update(id, payload);
        break;
      case 'delete':
        await apiServices.device.delete(id);
        break;
    }
  }

  /** 标记失败 */
  private async markFailed(id: string, error: Error): Promise<void> {
    const row = await dbUtils.queryOne<any>(TableNames.SYNC_QUEUE, 'id = ?', [id]);
    if (!row) return;

    const retryCount = row.retry_count + 1;
    const status = retryCount >= this.config.maxRetries ? 'failed' : 'pending';

    await dbUtils.update(
      TableNames.SYNC_QUEUE,
      {
        retry_count: retryCount,
        status,
        error_msg: error.message,
        updated_at: Date.now(),
      },
      'id = ?',
      [id]
    );

    console.log(`[Sync] 项同步失败 (重试 ${retryCount}/${this.config.maxRetries}): ${id}`);
  }

  /** 从队列移除 */
  private async removeFromQueue(id: string): Promise<void> {
    await dbUtils.delete(TableNames.SYNC_QUEUE, 'id = ?', [id]);
  }

  /** 行转对象 */
  private rowToItem(row: any): SyncQueueItem {
    return {
      id: row.id,
      type: row.type,
      entity: row.entity,
      entityId: row.entity_id,
      payload: row.payload,
      retryCount: row.retry_count,
      status: row.status,
      errorMsg: row.error_msg,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /** 获取队列状态 */
  async getQueueStatus(): Promise<{ pending: number; syncing: number; failed: number }> {
    const pending = await dbUtils.queryOne<{ count: number }>(
      TableNames.SYNC_QUEUE,
      "status = 'pending'",
      []
    );
    const syncing = await dbUtils.queryOne<{ count: number }>(
      TableNames.SYNC_QUEUE,
      "status = 'syncing'",
      []
    );
    const failed = await dbUtils.queryOne<{ count: number }>(
      TableNames.SYNC_QUEUE,
      "status = 'failed'",
      []
    );

    return {
      pending: pending?.count || 0,
      syncing: syncing?.count || 0,
      failed: failed?.count || 0,
    };
  }

  /** 清除失败项 */
  async clearFailed(): Promise<number> {
    const db = await import('./sqlite').then((m) => m.getDatabase());
    const result = await db.runAsync(
      `DELETE FROM ${TableNames.SYNC_QUEUE} WHERE status = 'failed';`
    );
    return result.changes;
  }

  /** 是否正在同步 */
  getIsSyncing(): boolean {
    return this.isSyncing;
  }
}

// ============================================
// 导出单例
// ============================================

export const syncQueue = new SyncQueueManager();
export default syncQueue;
