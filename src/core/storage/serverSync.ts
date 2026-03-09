// Server Sync Service
// 服务端同步服务 - 表结构更新、配置同步、数据同步

import { apiServices } from '../network';
import { dbUtils, TableNames } from './sqlite';
import { mmkvStorage } from './mmkv';

// ============================================
// 类型定义
// ============================================

/** 表结构定义 */
export interface TableSchema {
  name: string;
  columns: ColumnDefinition[];
  indexes?: IndexDefinition[];
}

/** 列定义 */
export interface ColumnDefinition {
  name: string;
  type: 'TEXT' | 'INTEGER' | 'REAL' | 'BLOB';
  primaryKey?: boolean;
  notNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  foreignKey?: {
    table: string;
    column: string;
  };
}

/** 索引定义 */
export interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
}

/** 服务端配置 */
export interface ServerConfig {
  version: number;
  tables: TableSchema[];
  appConfig: Record<string, any>;
  lastSyncTime: number;
}

/** 同步选项 */
export interface SyncOptions {
  /** 是否强制同步表结构 */
  forceSchemaSync?: boolean;
  /** 是否同步配置 */
  syncConfig?: boolean;
  /** 是否同步数据 */
  syncData?: boolean;
  /** 同步完成的回调 */
  onComplete?: (result: SyncResult) => void;
  /** 同步错误的回调 */
  onError?: (error: Error) => void;
}

/** 同步结果 */
export interface SyncResult {
  success: boolean;
  schemaUpdated: boolean;
  configUpdated: boolean;
  dataSynced: boolean;
  errors: string[];
  timestamp: number;
}

// ============================================
// 常量
// ============================================

const CONFIG_VERSION_KEY = 'server_config_version';
const LAST_SYNC_TIME_KEY = 'last_sync_time';
const SERVER_CONFIG_KEY = 'server_config';

// ============================================
// 服务端同步服务
// ============================================

class ServerSyncService {
  private isSyncing: boolean = false;
  private currentConfig: ServerConfig | null = null;

  /** 初始化 */
  async initialize(): Promise<void> {
    console.log('[ServerSync] 初始化同步服务');
    // 加载保存的配置
    const savedConfig = mmkvStorage.getString(SERVER_CONFIG_KEY);
    if (savedConfig) {
      try {
        this.currentConfig = JSON.parse(savedConfig);
      } catch (e) {
        console.error('[ServerSync] 加载配置失败', e);
      }
    }
  }

  /** 执行完整同步 */
  async sync(options: SyncOptions = {}): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[ServerSync] 同步正在进行中');
      return {
        success: false,
        schemaUpdated: false,
        configUpdated: false,
        dataSynced: false,
        errors: ['同步正在进行中'],
        timestamp: Date.now(),
      };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      schemaUpdated: false,
      configUpdated: false,
      dataSynced: false,
      errors: [],
      timestamp: Date.now(),
    };

    try {
      // 1. 同步表结构
      if (options.forceSchemaSync || options.syncConfig !== false) {
        try {
          await this.syncTableSchema();
          result.schemaUpdated = true;
        } catch (error) {
          result.errors.push(`表结构同步失败: ${error}`);
        }
      }

      // 2. 同步配置
      if (options.syncConfig !== false) {
        try {
          await this.syncAppConfig();
          result.configUpdated = true;
        } catch (error) {
          result.errors.push(`配置同步失败: ${error}`);
        }
      }

      // 3. 同步数据
      if (options.syncData !== false) {
        try {
          await this.syncData();
          result.dataSynced = true;
        } catch (error) {
          result.errors.push(`数据同步失败: ${error}`);
        }
      }

      result.success = result.errors.length === 0;
    } catch (error) {
      result.success = false;
      result.errors.push(`同步出错: ${error}`);
      options.onError?.(error as Error);
    } finally {
      this.isSyncing = false;
      options.onComplete?.(result);
    }

    return result;
  }

  /** 同步表结构 */
  async syncTableSchema(): Promise<void> {
    console.log('[ServerSync] 开始同步表结构');

    // 从服务端获取最新的表结构定义
    // 注意：这里需要服务端提供相应的接口
    const serverSchema = await this.fetchServerSchema();

    if (!serverSchema || !serverSchema.tables) {
      console.log('[ServerSync] 未获取到服务端表结构，使用本地默认');
      return;
    }

    // 遍历服务端定义的表
    for (const table of serverSchema.tables) {
      await this.syncTable(table);
    }

    // 更新本地保存的版本号
    mmkvStorage.setNumber(CONFIG_VERSION_KEY, serverSchema.version);
    console.log(`[ServerSync] 表结构同步完成，共 ${serverSchema.tables.length} 个表`);
  }

  /** 同步单个表 */
  private async syncTable(schema: TableSchema): Promise<void> {
    const tableName = schema.name;

    // 检查表是否存在
    const exists = await this.checkTableExists(tableName);

    if (!exists) {
      // 创建新表
      await this.createTable(tableName, schema.columns, schema.indexes);
      console.log(`[ServerSync] 创建新表: ${tableName}`);
    } else {
      // 检查并添加新列
      await this.syncTableColumns(tableName, schema.columns);
    }
  }

  /** 检查表是否存在 */
  private async checkTableExists(tableName: string): Promise<boolean> {
    try {
      await dbUtils.queryOne(
        'sqlite_master',
        'type = ? AND name = ?',
        ['table', tableName]
      );
      return true;
    } catch {
      return false;
    }
  }

  /** 创建表 */
  private async createTable(
    tableName: string,
    columns: ColumnDefinition[],
    indexes?: IndexDefinition[]
  ): Promise<void> {
    const columnDefs = columns.map((col) => {
      let def = `${col.name} ${col.type}`;
      if (col.primaryKey) def += ' PRIMARY KEY';
      if (col.notNull) def += ' NOT NULL';
      if (col.defaultValue !== undefined) def += ` DEFAULT ${col.defaultValue}`;
      if (col.unique) def += ' UNIQUE';
      return def;
    });

    // 添加外键约束
    const foreignKeys = columns
      .filter((col) => col.foreignKey)
      .map((col) => {
        const fk = col.foreignKey!;
        return `FOREIGN KEY (${col.name}) REFERENCES ${fk.table}(${fk.column})`;
      });

    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (
      ${columnDefs.join(', ')}
      ${foreignKeys.length > 0 ? ', ' + foreignKeys.join(', ') : ''}
    );`;

    await dbUtils.execute(sql);

    // 创建索引
    if (indexes) {
      for (const idx of indexes) {
        const uniqueStr = idx.unique ? 'UNIQUE ' : '';
        await dbUtils.execute(
          `CREATE ${uniqueStr}INDEX IF NOT EXISTS ${idx.name} ON ${tableName} (${idx.columns.join(', ')});`
        );
      }
    }
  }

  /** 同步表列 */
  private async syncTableColumns(tableName: string, serverColumns: ColumnDefinition[]): Promise<void> {
    // 获取当前表的列
    const db = await import('./sqlite').then((m) => m.getDatabase());
    const result = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName});`);
    const existingColumns = new Set(result.map((r) => r.name));

    // 添加新列
    for (const col of serverColumns) {
      if (!existingColumns.has(col.name)) {
        let alterSql = `ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${col.type}`;
        if (col.defaultValue !== undefined) {
          alterSql += ` DEFAULT ${col.defaultValue}`;
        }
        if (col.notNull) {
          alterSql += ' NOT NULL';
        }

        try {
          await dbUtils.execute(alterSql);
          console.log(`[ServerSync] 表 ${tableName} 添加列: ${col.name}`);
        } catch (error) {
          console.warn(`[ServerSync] 添加列失败: ${col.name}`, error);
        }
      }
    }
  }

  /** 从服务端获取表结构 */
  private async fetchServerSchema(): Promise<ServerConfig | null> {
    try {
      // 这里调用服务端的配置接口获取表结构
      // 暂时返回 null，使用本地默认表结构
      // TODO: 实现服务端接口调用
      // const config = await apiServices.getConfig();
      // return config;
      return null;
    } catch (error) {
      console.error('[ServerSync] 获取表结构失败', error);
      return null;
    }
  }

  /** 同步应用配置 */
  async syncAppConfig(): Promise<void> {
    console.log('[ServerSync] 开始同步应用配置');

    try {
      // 从服务端获取配置
      const config = await this.fetchServerConfig();

      if (config && config.appConfig) {
        // 保存配置
        for (const [key, value] of Object.entries(config.appConfig)) {
          mmkvStorage.setString(`config_${key}`, JSON.stringify(value));
        }

        // 保存完整配置
        this.currentConfig = config;
        mmkvStorage.setString(SERVER_CONFIG_KEY, JSON.stringify(config));
        mmkvStorage.setNumber(LAST_SYNC_TIME_KEY, Date.now());

        console.log('[ServerSync] 应用配置同步完成');
      }
    } catch (error) {
      console.error('[ServerSync] 配置同步失败', error);
      throw error;
    }
  }

  /** 从服务端获取配置 */
  private async fetchServerConfig(): Promise<ServerConfig | null> {
    try {
      // TODO: 实现服务端接口调用
      // return await apiServices.getServerConfig();
      return null;
    } catch (error) {
      console.error('[ServerSync] 获取配置失败', error);
      return null;
    }
  }

  /** 同步数据 */
  async syncData(): Promise<void> {
    console.log('[ServerSync] 开始同步数据');

    const lastSyncTime = mmkvStorage.getNumber(LAST_SYNC_TIME_KEY) || 0;

    try {
      // 1. 拉取服务端新增/更新的数据
      await this.pullServerData(lastSyncTime);

      // 2. 将本地数据推送到服务端
      await this.pushLocalData();

      // 更新同步时间
      mmkvStorage.setNumber(LAST_SYNC_TIME_KEY, Date.now());
      console.log('[ServerSync] 数据同步完成');
    } catch (error) {
      console.error('[ServerSync] 数据同步失败', error);
      throw error;
    }
  }

  /** 拉取服务端数据 */
  private async pullServerData(since: number): Promise<void> {
    try {
      // 拉取隐患数据
      const hazards = await apiServices.hazard.list({
        updatedAt: since,
      });
      if (hazards?.list) {
        await dbUtils.batchInsert(TableNames.HAZARD, hazards.list);
        console.log(`[ServerSync] 拉取隐患数据: ${hazards.list.length} 条`);
      }

      // 拉取设备数据
      const devices = await apiServices.device.list({
        updatedAt: since,
      });
      if (devices?.list) {
        await dbUtils.batchInsert(TableNames.DEVICE, devices.list);
        console.log(`[ServerSync] 拉取设备数据: ${devices.list.length} 条`);
      }

      // 拉取消息数据
      const messages = await apiServices.message.list({
        updatedAt: since,
      });
      if (messages?.list) {
        await dbUtils.batchInsert(TableNames.MESSAGE, messages.list);
        console.log(`[ServerSync] 拉取消息数据: ${messages.list.length} 条`);
      }
    } catch (error) {
      console.error('[ServerSync] 拉取数据失败', error);
      throw error;
    }
  }

  /** 推送本地数据到服务端 */
  private async pushLocalData(): Promise<void> {
    // 这个功能由 syncQueue.ts 处理
    // 这里只是触发同步队列的执行
    const { syncQueue } = await import('./syncQueue');
    await syncQueue.sync();
  }

  /** 获取当前配置 */
  getCurrentConfig(): ServerConfig | null {
    return this.currentConfig;
  }

  /** 获取配置项 */
  getConfig<T>(key: string): T | undefined {
    const value = mmkvStorage.getString(`config_${key}`);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  /** 获取最后同步时间 */
  getLastSyncTime(): number {
    return mmkvStorage.getNumber(LAST_SYNC_TIME_KEY) || 0;
  }

  /** 是否正在同步 */
  getIsSyncing(): boolean {
    return this.isSyncing;
  }
}

// ============================================
// 导出单例
// ============================================

export const serverSync = new ServerSyncService();
export default serverSync;
