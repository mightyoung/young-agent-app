// Pure JavaScript Storage - no native dependencies
// This works on all platforms (web, iOS, Android)

import { config } from '../constants/config';

// In-memory storage
class InMemoryDB {
  private data: Map<string, any[]> = new Map();

  getTable(tableName: string): any[] {
    if (!this.data.has(tableName)) {
      this.data.set(tableName, []);
    }
    return this.data.get(tableName)!;
  }

  insert<T extends Record<string, any>>(table: string, item: T): void {
    const items = this.getTable(table);
    const index = items.findIndex((i: any) => i.id === item.id);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.push(item);
    }
  }

  queryAll<T>(table: string): T[] {
    return this.getTable(table) as T[];
  }

  queryOne<T>(table: string): T | null {
    const items = this.getTable(table);
    return (items[0] as T) || null;
  }

  update(table: string, data: any, id: string): void {
    const items = this.getTable(table);
    const index = items.findIndex((i: any) => i.id === id);
    if (index >= 0) {
      items[index] = { ...items[index], ...data };
    }
  }

  delete(table: string, id: string): void {
    const items = this.getTable(table);
    const filtered = items.filter((i: any) => i.id !== id);
    this.data.set(table, filtered);
  }

  count(table: string): number {
    return this.getTable(table).length;
  }
}

// Singleton instance
const db = new InMemoryDB();

// Initialize database - seeds mock data
export const initDatabase = async (): Promise<InMemoryDB> => {
  console.log('[DB] Initializing in-memory database');
  return db;
};

// Get database instance
export const getDatabase = async (): Promise<InMemoryDB> => {
  return db;
};

// DB helpers
export const dbHelpers = {
  insert: async <T extends Record<string, any>>(table: string, data: T): Promise<void> => {
    db.insert(table, data);
  },

  queryAll: async <T>(table: string, _where?: string, _params?: any[]): Promise<T[]> => {
    return db.queryAll(table) as T[];
  },

  queryOne: async <T>(table: string, _where: string, params?: any[]): Promise<T | null> => {
    return db.queryOne(table) as T | null;
  },

  update: async (table: string, data: any, _where: string, params: any[]): Promise<void> => {
    db.update(table, data, params[0]);
  },

  delete: async (table: string, _where: string, params?: any[]): Promise<void> => {
    db.delete(table, params?.[0] || '');
  },

  count: async (table: string, _where?: string, _params?: any[]): Promise<number> => {
    return db.count(table);
  },
};

// Sync helpers
export const syncHelpers = {
  addToQueue: async (item: any): Promise<void> => {
    await dbHelpers.insert('sync_queue', {
      ...item,
      id: item.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: Date.now(),
      retry_count: 0,
      status: 'pending',
    });
  },

  getPendingItems: async (): Promise<any[]> => {
    return await dbHelpers.queryAll('sync_queue', 'status = ?', ['pending']);
  },

  markSynced: async (id: string): Promise<void> => {
    await dbHelpers.delete('sync_queue', 'id = ?', [id]);
  },

  markFailed: async (id: string, retryCount: number): Promise<void> => {
    await dbHelpers.update(
      'sync_queue',
      { retry_count: retryCount, status: retryCount >= 3 ? 'failed' : 'pending' },
      'id = ?',
      [id]
    );
  },
};
