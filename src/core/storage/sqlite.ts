// SQLite Database Manager
// 基于 expo-sqlite 的本地数据库管理

import * as SQLite from 'expo-sqlite';
import { config } from '../constants/config';

// ============================================
// 类型定义
// ============================================

/** 数据库表名 */
export const TableNames = {
  USER: 'users',
  ENTERPRISE: 'enterprises',
  DEPARTMENT: 'departments',
  DEVICE_TYPE: 'device_types',
  DEVICE_LOCATION: 'device_locations',
  DEVICE: 'devices',
  CHECKLIST_TEMPLATE: 'checklist_templates',
  INSPECTION_TASK: 'inspection_tasks',
  INSPECTION_RECORD: 'inspection_records',
  HAZARD: 'hazards',
  HAZARD_FLOW: 'hazard_flows',
  MESSAGE: 'messages',
  SYNC_QUEUE: 'sync_queue',
  SETTINGS: 'settings',
} as const;

/** 表字段定义 */
export interface TableColumn {
  name: string;
  type: string;
  primaryKey?: boolean;
  notNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
}

// ============================================
// 数据库初始化
// ============================================

let db: SQLite.SQLiteDatabase | null = null;

/** 获取数据库实例 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(config.database.name);
  }
  return db;
}

/** 初始化数据库 - 创建所有表 */
export async function initDatabase(): Promise<void> {
  const database = await getDatabase();

  // 启用外键
  await database.execAsync('PRAGMA foreign_keys = ON;');

  // 创建所有表
  await createTables(database);

  console.log('[Database] 初始化完成');
}

/** 创建所有表 */
async function createTables(db: SQLite.SQLiteDatabase): Promise<void> {
  // 用户表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TableNames.USER} (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      real_name TEXT,
      avatar TEXT,
      phone TEXT,
      email TEXT,
      role TEXT NOT NULL,
      role_name TEXT,
      dept_id TEXT,
      dept_name TEXT,
      enterprise_id TEXT,
      enterprise_name TEXT,
      status INTEGER DEFAULT 1,
      created_at INTEGER,
      updated_at INTEGER
    );
  `);

  // 企业表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TableNames.ENTERPRISE} (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logo TEXT,
      contact_phone TEXT,
      address TEXT,
      status INTEGER DEFAULT 1,
      created_at INTEGER
    );
  `);

  // 部门表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TableNames.DEPARTMENT} (
      id TEXT PRIMARY KEY,
      enterprise_id TEXT,
      parent_id TEXT,
      name TEXT NOT NULL,
      code TEXT,
      leader_id TEXT,
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at INTEGER,
      FOREIGN KEY (enterprise_id) REFERENCES ${TableNames.ENTERPRISE}(id)
    );
  `);

  // 设备类型表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TableNames.DEVICE_TYPE} (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      icon TEXT,
      description TEXT,
      created_at INTEGER
    );
  `);

  // 设备位置表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TableNames.DEVICE_LOCATION} (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      parent_id TEXT,
      building TEXT,
      floor TEXT,
      area TEXT,
      created_at INTEGER,
      FOREIGN KEY (parent_id) REFERENCES ${TableNames.DEVICE_LOCATION}(id)
    );
  `);

  // 设备台账表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TableNames.DEVICE} (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      device_no TEXT UNIQUE,
      qr_code TEXT,
      device_type_id TEXT,
      device_type_name TEXT,
      device_location_id TEXT,
      device_location_name TEXT,
      dept_id TEXT,
      dept_name TEXT,
      brand TEXT,
      model TEXT,
      serial_no TEXT,
      purchase_date TEXT,
      install_date TEXT,
      responsible_id TEXT,
      responsible_name TEXT,
      status TEXT DEFAULT 'normal',
      created_at INTEGER,
      updated_at INTEGER,
      sync_status TEXT DEFAULT 'synced',
      FOREIGN KEY (device_type_id) REFERENCES ${TableNames.DEVICE_TYPE}(id),
      FOREIGN KEY (device_location_id) REFERENCES ${TableNames.DEVICE_LOCATION}(id)
    );
  `);

  // 检查模板表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TableNames.CHECKLIST_TEMPLATE} (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      name TEXT NOT NULL,
      items TEXT NOT NULL,
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY (device_id) REFERENCES ${TableNames.DEVICE}(id)
    );
  `);

  // 巡检任务表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TableNames.INSPECTION_TASK} (
      id TEXT PRIMARY KEY,
      task_no TEXT UNIQUE,
      task_type INTEGER,
      device_ids TEXT,
      device_names TEXT,
      dept_id TEXT,
      dept_name TEXT,
      assignee_id TEXT,
      assignee_name TEXT,
      assigner_id TEXT,
      assigner_name TEXT,
      plan_date TEXT,
      due_date TEXT,
      status INTEGER DEFAULT 0,
      priority INTEGER DEFAULT 1,
      remark TEXT,
      created_at INTEGER,
      completed_at INTEGER,
      sync_status TEXT DEFAULT 'synced'
    );
  `);

  // 巡检记录表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TableNames.INSPECTION_RECORD} (
      id TEXT PRIMARY KEY,
      record_no TEXT UNIQUE,
      task_id TEXT,
      task_no TEXT,
      device_id TEXT,
      device_name TEXT,
      user_id TEXT,
      user_name TEXT,
      check_date INTEGER,
      status INTEGER DEFAULT 0,
      result INTEGER,
      location_gps TEXT,
      items TEXT,
      photos TEXT,
      remark TEXT,
      created_at INTEGER,
      submitted_at INTEGER,
      sync_status TEXT DEFAULT 'synced',
      FOREIGN KEY (task_id) REFERENCES ${TableNames.INSPECTION_TASK}(id),
      FOREIGN KEY (device_id) REFERENCES ${TableNames.DEVICE}(id)
    );
  `);

  // 隐患记录表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TableNames.HAZARD} (
      id TEXT PRIMARY KEY,
      business_id TEXT UNIQUE,
      business_no TEXT,
      source INTEGER,
      photos TEXT,
      hazard_type TEXT,
      hazard_type_name TEXT,
      location_desc TEXT,
      device_id TEXT,
      device_name TEXT,
      dept_id TEXT,
      dept_name TEXT,
      description TEXT,
      voice_note TEXT,
      voice_duration INTEGER,
      status INTEGER DEFAULT 0,
      user_id TEXT,
      user_name TEXT,
      reporter_phone TEXT,
      gps_location TEXT,
      confirmed_at INTEGER,
      confirmed_by TEXT,
      confirmed_by_name TEXT,
      rectified_at INTEGER,
      rectified_by TEXT,
      rectified_by_name TEXT,
      rectified_description TEXT,
      accepted_at INTEGER,
      accepted_by TEXT,
      accepted_by_name TEXT,
      reject_reason TEXT,
      created_at INTEGER,
      updated_at INTEGER,
      sync_status TEXT DEFAULT 'synced',
      FOREIGN KEY (device_id) REFERENCES ${TableNames.DEVICE}(id)
    );
  `);

  // 隐患流程记录表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TableNames.HAZARD_FLOW} (
      id TEXT PRIMARY KEY,
      hazard_id TEXT NOT NULL,
      from_status INTEGER,
      to_status INTEGER,
      operator_id TEXT,
      operator_name TEXT,
      action_type INTEGER,
      remark TEXT,
      voice_note TEXT,
      created_at INTEGER,
      FOREIGN KEY (hazard_id) REFERENCES ${TableNames.HAZARD}(id)
    );
  `);

  // 消息表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TableNames.MESSAGE} (
      id TEXT PRIMARY KEY,
      type INTEGER NOT NULL,
      type_name TEXT,
      title TEXT NOT NULL,
      content TEXT,
      user_id TEXT,
      user_name TEXT,
      read_status INTEGER DEFAULT 0,
      read_at INTEGER,
      related_id TEXT,
      related_type TEXT,
      related_title TEXT,
      created_at INTEGER,
      sync_status TEXT DEFAULT 'synced'
    );
  `);

  // 同步队列表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TableNames.SYNC_QUEUE} (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      payload TEXT,
      retry_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      error_msg TEXT,
      created_at INTEGER,
      updated_at INTEGER
    );
  `);

  // 设置表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TableNames.SETTINGS} (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at INTEGER
    );
  `);

  console.log('[Database] 所有表创建完成');
}

// ============================================
// 数据库操作工具
// ============================================

/** 数据库工具类 */
export const dbUtils = {
  /** 插入数据 */
  async insert<T>(table: string, data: T): Promise<void> {
    const db = await getDatabase();
    const keys = Object.keys(data as Record<string, any>);
    const values = Object.values(data as Record<string, any>);
    const placeholders = keys.map(() => '?').join(', ');

    await db.runAsync(
      `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders});`,
      values
    );
  },

  /** 插入或替换 */
  async insertOrReplace<T>(table: string, data: T): Promise<void> {
    const db = await getDatabase();
    const keys = Object.keys(data as Record<string, any>);
    const values = Object.values(data as Record<string, any>);
    const placeholders = keys.map(() => '?').join(', ');

    await db.runAsync(
      `INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders});`,
      values
    );
  },

  /** 批量插入 */
  async batchInsert<T>(table: string, dataList: T[]): Promise<void> {
    if (dataList.length === 0) return;

    const db = await getDatabase();
    const keys = Object.keys(dataList[0] as Record<string, any>);
    const placeholders = keys.map(() => '?').join(', ');
    const values = dataList.flatMap((data) => Object.values(data as Record<string, any>));

    await db.runAsync(
      `INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders});`,
      values
    );
  },

  /** 查询单条 */
  async queryOne<T>(table: string, where: string, params: any[] = []): Promise<T | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<T>(
      `SELECT * FROM ${table} WHERE ${where} LIMIT 1;`,
      params
    );
    return result || null;
  },

  /** 查询多条 */
  async queryAll<T>(table: string, where?: string, params: any[] = []): Promise<T[]> {
    const db = await getDatabase();
    const sql = where
      ? `SELECT * FROM ${table} WHERE ${where};`
      : `SELECT * FROM ${table};`;
    const result = await db.getAllAsync<T>(sql, params);
    return result;
  },

  /** 分页查询 */
  async queryPage<T>(
    table: string,
    page: number,
    pageSize: number,
    where?: string,
    orderBy?: string,
    params: any[] = []
  ): Promise<{ list: T[]; total: number }> {
    const db = await getDatabase();

    const whereClause = where ? `WHERE ${where}` : '';
    const orderClause = orderBy ? `ORDER BY ${orderBy}` : '';
    const offset = (page - 1) * pageSize;

    const list = await db.getAllAsync<T>(
      `SELECT * FROM ${table} ${whereClause} ${orderClause} LIMIT ? OFFSET ?;`,
      [...params, pageSize, offset]
    );

    const countResult = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${table} ${whereClause};`,
      params
    );

    return {
      list,
      total: countResult?.count || 0,
    };
  },

  /** 更新数据 */
  async update(table: string, data: Record<string, any>, where: string, params: any[] = []): Promise<void> {
    const db = await getDatabase();
    const sets = Object.keys(data).map((key) => `${key} = ?`).join(', ');
    const values = [...Object.values(data), ...params];

    await db.runAsync(`UPDATE ${table} SET ${sets} WHERE ${where};`, values);
  },

  /** 删除数据 */
  async delete(table: string, where: string, params: any[] = []): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM ${table} WHERE ${where};`, params);
  },

  /** 执行原始SQL */
  async execute(sql: string, params: any[] = []): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(sql, params);
  },

  /** 事务执行 */
  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    const db = await getDatabase();
    return await db.withTransactionAsync(fn);
  },

  /** 清空表 */
  async clearTable(table: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM ${table};`);
  },
};

/**
 * Sync helpers for offline queue management
 */
export const syncHelpers = {
  addToQueue: async (item: any): Promise<void> => {
    await dbUtils.insert(TableNames.SYNC_QUEUE, {
      ...item,
      id: item.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: Date.now(),
      retry_count: 0,
      status: 'pending',
    });
  },
  getPendingItems: async (): Promise<any[]> => {
    return await dbUtils.queryAll(TableNames.SYNC_QUEUE, 'status = ?', ['pending']);
  },
  markSynced: async (id: string): Promise<void> => {
    await dbUtils.delete(TableNames.SYNC_QUEUE, 'id = ?', [id]);
  },
  markFailed: async (id: string, retryCount: number): Promise<void> => {
    await dbUtils.update(
      TableNames.SYNC_QUEUE,
      { retry_count: retryCount, status: retryCount >= 3 ? 'failed' : 'pending' },
      'id = ?',
      [id]
    );
  },
};

export default {
  getDatabase,
  initDatabase,
  TableNames,
  dbUtils,
  // Re-export sync helpers for compatibility
  syncHelpers: {
    addToQueue: async (item: any): Promise<void> => {
      await dbUtils.insert(TableNames.SYNC_QUEUE, {
        ...item,
        id: item.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: Date.now(),
        retry_count: 0,
        status: 'pending',
      });
    },
    getPendingItems: async (): Promise<any[]> => {
      return await dbUtils.queryAll(TableNames.SYNC_QUEUE, 'status = ?', ['pending']);
    },
    markSynced: async (id: string): Promise<void> => {
      await dbUtils.delete(TableNames.SYNC_QUEUE, 'id = ?', [id]);
    },
    markFailed: async (id: string, retryCount: number): Promise<void> => {
      await dbUtils.update(
        TableNames.SYNC_QUEUE,
        { retry_count: retryCount, status: retryCount >= 3 ? 'failed' : 'pending' },
        'id = ?',
        [id]
      );
    },
  },
};
