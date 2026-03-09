// Data Repository Layer
// 数据仓库层 - 封装数据库操作，提供领域模型转换

import { dbUtils, TableNames } from './sqlite';
import type { Device, DeviceType, DeviceLocation } from '../../types';

// ============================================
// 类型转换辅助函数
// ============================================

/** 数据库行转设备模型 */
function rowToDevice(row: any): Device {
  return {
    id: row.id,
    name: row.name,
    qrCode: row.qr_code,
    typeId: row.device_type_id,
    typeName: row.device_type_name,
    locationId: row.device_location_id,
    locationName: row.device_location_name,
    deptId: row.dept_id,
    checklistTemplateId: row.checklist_template_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 设备模型转数据库行 */
function deviceToRow(device: Partial<Device>): any {
  return {
    id: device.id,
    name: device.name,
    qr_code: device.qrCode,
    device_type_id: device.typeId,
    device_type_name: device.typeName,
    device_location_id: device.locationId,
    device_location_name: device.locationName,
    dept_id: device.deptId,
    checklist_template_id: device.checklistTemplateId,
    status: device.status,
    created_at: device.createdAt || Date.now(),
    updated_at: device.updatedAt || Date.now(),
  };
}

// ============================================
// 设备仓库
// ============================================

export const deviceRepository = {
  /** 查询设备列表 */
  async findAll(params?: {
    status?: string;
    locationId?: string;
    typeId?: string;
    deptId?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ list: Device[]; total: number }> {
    const { page = 1, pageSize = 20, ...filters } = params || {};
    const conditions: string[] = [];
    const paramsList: any[] = [];

    if (filters.status) {
      conditions.push('status = ?');
      paramsList.push(filters.status);
    }
    if (filters.locationId) {
      conditions.push('device_location_id = ?');
      paramsList.push(filters.locationId);
    }
    if (filters.typeId) {
      conditions.push('device_type_id = ?');
      paramsList.push(filters.typeId);
    }
    if (filters.deptId) {
      conditions.push('dept_id = ?');
      paramsList.push(filters.deptId);
    }
    if (filters.keyword) {
      conditions.push('(name LIKE ? OR device_no LIKE ?)');
      paramsList.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
    }

    const where = conditions.length > 0 ? conditions.join(' AND ') : undefined;

    const result = await dbUtils.queryPage<any>(
      TableNames.DEVICE,
      page,
      pageSize,
      where,
      'created_at DESC',
      paramsList
    );

    return {
      list: result.list.map(rowToDevice),
      total: result.total,
    };
  },

  /** 查询设备详情 */
  async findById(id: string): Promise<Device | null> {
    const row = await dbUtils.queryOne<any>(TableNames.DEVICE, 'id = ?', [id]);
    return row ? rowToDevice(row) : null;
  },

  /** 创建设备 */
  async create(device: Partial<Device>): Promise<void> {
    await dbUtils.insert(TableNames.DEVICE, deviceToRow(device));
  },

  /** 更新设备 */
  async update(id: string, updates: Partial<Device>): Promise<void> {
    const row = deviceToRow({ ...updates, id, updatedAt: Date.now() });
    delete row.id;
    delete row.created_at;
    await dbUtils.update(TableNames.DEVICE, row, 'id = ?', [id]);
  },

  /** 删除设备 */
  async delete(id: string): Promise<void> {
    await dbUtils.delete(TableNames.DEVICE, 'id = ?', [id]);
  },

  /** 统计设备数量 */
  async count(params?: { status?: string; deptId?: string }): Promise<number> {
    const conditions: string[] = [];
    const paramsList: any[] = [];

    if (params?.status) {
      conditions.push('status = ?');
      paramsList.push(params.status);
    }
    if (params?.deptId) {
      conditions.push('dept_id = ?');
      paramsList.push(params.deptId);
    }

    const where = conditions.length > 0 ? conditions.join(' AND ') : undefined;
    const result = await dbUtils.queryOne<{ count: number }>(
      TableNames.DEVICE,
      where || '1=1',
      paramsList.length > 0 ? paramsList : []
    );

    return result?.count || 0;
  },
};

// ============================================
// 隐患仓库
// ============================================

export const hazardRepository = {
  /** 查询隐患列表 */
  async findAll(params?: {
    status?: number;
    hazardType?: string;
    startDate?: number;
    endDate?: number;
    keyword?: string;
    deptId?: string;
    userId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ list: any[]; total: number }> {
    const { page = 1, pageSize = 20, ...filters } = params || {};
    const conditions: string[] = [];
    const paramsList: any[] = [];

    if (filters.status !== undefined) {
      conditions.push('status = ?');
      paramsList.push(filters.status);
    }
    if (filters.hazardType) {
      conditions.push('hazard_type = ?');
      paramsList.push(filters.hazardType);
    }
    if (filters.startDate) {
      conditions.push('created_at >= ?');
      paramsList.push(filters.startDate);
    }
    if (filters.endDate) {
      conditions.push('created_at <= ?');
      paramsList.push(filters.endDate);
    }
    if (filters.deptId) {
      conditions.push('dept_id = ?');
      paramsList.push(filters.deptId);
    }
    if (filters.userId) {
      conditions.push('user_id = ?');
      paramsList.push(filters.userId);
    }
    if (filters.keyword) {
      conditions.push('(description LIKE ? OR business_no LIKE ?)');
      paramsList.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
    }

    const where = conditions.length > 0 ? conditions.join(' AND ') : undefined;

    const result = await dbUtils.queryPage<any>(
      TableNames.HAZARD,
      page,
      pageSize,
      where,
      'created_at DESC',
      paramsList
    );

    return {
      list: result.list,
      total: result.total,
    };
  },

  /** 查询隐患详情 */
  async findById(id: string): Promise<any | null> {
    const row = await dbUtils.queryOne<any>(TableNames.HAZARD, 'id = ?', [id]);
    return row;
  },

  /** 创建隐患 */
  async create(hazard: any): Promise<void> {
    await dbUtils.insert(TableNames.HAZARD, {
      ...hazard,
      created_at: hazard.createdAt || Date.now(),
      updated_at: hazard.updatedAt || Date.now(),
    });
  },

  /** 更新隐患 */
  async update(id: string, updates: any): Promise<void> {
    await dbUtils.update(
      TableNames.HAZARD,
      { ...updates, updated_at: Date.now() },
      'id = ?',
      [id]
    );
  },

  /** 删除隐患 */
  async delete(id: string): Promise<void> {
    await dbUtils.delete(TableNames.HAZARD, 'id = ?', [id]);
  },

  /** 统计隐患数量 */
  async count(params?: { status?: number; deptId?: string }): Promise<number> {
    const conditions: string[] = [];
    const paramsList: any[] = [];

    if (params?.status !== undefined) {
      conditions.push('status = ?');
      paramsList.push(params.status);
    }
    if (params?.deptId) {
      conditions.push('dept_id = ?');
      paramsList.push(params.deptId);
    }

    const where = conditions.length > 0 ? conditions.join(' AND ') : undefined;
    const result = await dbUtils.queryOne<{ count: number }>(
      TableNames.HAZARD,
      where || '1=1',
      paramsList.length > 0 ? paramsList : []
    );

    return result?.count || 0;
  },
};

// ============================================
// 消息仓库
// ============================================

export const messageRepository = {
  /** 查询消息列表 */
  async findAll(params?: {
    type?: number;
    readStatus?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<{ list: any[]; total: number }> {
    const { page = 1, pageSize = 20, ...filters } = params || {};
    const conditions: string[] = [];
    const paramsList: any[] = [];

    if (filters.type !== undefined) {
      conditions.push('type = ?');
      paramsList.push(filters.type);
    }
    if (filters.readStatus !== undefined) {
      conditions.push('read_status = ?');
      paramsList.push(filters.readStatus ? 1 : 0);
    }

    const where = conditions.length > 0 ? conditions.join(' AND ') : undefined;

    const result = await dbUtils.queryPage<any>(
      TableNames.MESSAGE,
      page,
      pageSize,
      where,
      'created_at DESC',
      paramsList
    );

    return {
      list: result.list,
      total: result.total,
    };
  },

  /** 标记已读 */
  async markRead(id: string): Promise<void> {
    await dbUtils.update(
      TableNames.MESSAGE,
      { read_status: 1, read_at: Date.now() },
      'id = ?',
      [id]
    );
  },

  /** 标记全部已读 */
  async markAllRead(userId: string): Promise<void> {
    await dbUtils.update(
      TableNames.MESSAGE,
      { read_status: 1, read_at: Date.now() },
      'user_id = ? AND read_status = 0',
      [userId]
    );
  },

  /** 未读数量 */
  async getUnreadCount(userId: string): Promise<number> {
    const result = await dbUtils.queryOne<{ count: number }>(
      TableNames.MESSAGE,
      'user_id = ? AND read_status = 0',
      [userId]
    );
    return result?.count || 0;
  },
};

// ============================================
// 导出
// ============================================

export const repositories = {
  device: deviceRepository,
  hazard: hazardRepository,
  message: messageRepository,
};

export default repositories;
