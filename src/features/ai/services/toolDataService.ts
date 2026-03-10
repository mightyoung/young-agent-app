// Tool Data Service - 工具数据服务
// 统一数据访问层，连接AI工具与业务数据

import { dbUtils, TableNames } from '../../../core/storage/sqlite';
import type { Device, DeviceStatus , HazardRecord, HazardStatus, HazardType , InspectionTask } from '../../../types';

// ==================== Device Data ====================

/**
 * 设备数据查询 - 真实数据集成
 */
export async function queryDevices(options: {
  status?: 'all' | 'normal' | 'warning' | 'error' | 'offline';
  location?: string;
}): Promise<{
  devices: Device[];
  stats: { normal: number; warning: number; error: number; offline: number };
}> {
  try {
    // 从真实SQLite数据库查询
    let devices = await dbUtils.queryAll<any>(TableNames.DEVICE);

    if (devices.length === 0) {
      // 如果数据库为空，返回空数组（数据会被 stores 初始化）
      return {
        devices: [],
        stats: { normal: 0, warning: 0, error: 0, offline: 0 }
      };
    }

    // 转换数据格式
    devices = devices.map((d: any) => ({
      ...d,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));

    let filtered = devices;

    // 按状态过滤
    if (options.status && options.status !== 'all') {
      filtered = filtered.filter((d: Device) => d.status === options.status);
    }

    // 按位置过滤
    if (options.location) {
      filtered = filtered.filter((d: Device) =>
        d.locationName?.includes(options.location!) ||
        d.locationId?.includes(options.location!)
      );
    }

    // 统计各状态数量
    const allDevices = devices as Device[];
    const stats = {
      normal: allDevices.filter(d => d.status === 'normal').length,
      warning: allDevices.filter(d => d.status === 'warning').length,
      error: allDevices.filter(d => d.status === 'error').length,
      offline: allDevices.filter(d => d.status === 'offline').length,
    };

    return { devices: filtered, stats };
  } catch (error) {
    console.error('[ToolDataService] Error querying devices:', error);
    return {
      devices: [],
      stats: { normal: 0, warning: 0, error: 0, offline: 0 }
    };
  }
}

// ==================== Hazard Data ====================

/**
 * 隐患数据查询 - 真实数据集成
 */
export async function queryHazards(options: {
  status?: 'all' | 'draft' | 'submitted' | 'confirmed' | 'rectifying' | 'accepted' | 'rejected';
  type?: 'all' | 'fire' | 'electric' | 'construction' | 'other';
  level?: 'all' | 'low' | 'medium' | 'high' | 'critical';
}): Promise<{
  hazards: HazardRecord[];
  stats: { draft: number; submitted: number; confirmed: number; rectifying: number; accepted: number; rejected: number };
}> {
  try {
    // 从真实SQLite数据库查询
    let hazards = await dbUtils.queryAll<any>(TableNames.HAZARD);

    if (hazards.length === 0) {
      return {
        hazards: [],
        stats: { draft: 0, submitted: 0, confirmed: 0, rectifying: 0, accepted: 0, rejected: 0 }
      };
    }

    // 转换数据格式
    hazards = hazards.map((h: any) => ({
      ...h,
      photos: typeof h.photos === 'string' ? JSON.parse(h.photos) : h.photos || [],
      createdAt: h.created_at,
      updatedAt: h.updated_at,
    }));

    let filtered = hazards;

    // 按状态过滤
    if (options.status && options.status !== 'all') {
      filtered = filtered.filter((h: HazardRecord) => h.status === options.status);
    }

    // 按类型过滤
    if (options.type && options.type !== 'all') {
      filtered = filtered.filter((h: HazardRecord) => h.type === options.type);
    }

    // 统计各状态数量
    const allHazards = hazards as HazardRecord[];
    const stats = {
      draft: allHazards.filter(h => h.status === 'draft').length,
      submitted: allHazards.filter(h => h.status === 'submitted').length,
      confirmed: allHazards.filter(h => h.status === 'confirmed').length,
      rectifying: allHazards.filter(h => h.status === 'rectifying').length,
      accepted: allHazards.filter(h => h.status === 'accepted').length,
      rejected: allHazards.filter(h => h.status === 'rejected').length,
    };

    return { hazards: filtered, stats };
  } catch (error) {
    console.error('[ToolDataService] Error querying hazards:', error);
    return {
      hazards: [],
      stats: { draft: 0, submitted: 0, confirmed: 0, rectifying: 0, accepted: 0, rejected: 0 }
    };
  }
}

// ==================== Task Data ====================

/**
 * 任务数据查询 - 真实数据集成
 */
export async function queryTasks(options: {
  status?: 'all' | 'pending' | 'in_progress' | 'completed';
  assignee?: string;
}): Promise<{
  tasks: InspectionTask[];
  stats: { pending: number; in_progress: number; completed: number };
}> {
  try {
    // 从真实SQLite数据库查询
    let tasks = await dbUtils.queryAll<any>(TableNames.INSPECTION_TASK);

    if (tasks.length === 0) {
      return {
        tasks: [],
        stats: { pending: 0, in_progress: 0, completed: 0 }
      };
    }

    // 转换数据格式
    tasks = tasks.map((t: any) => ({
      ...t,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));

    let filtered = tasks;

    // 按状态过滤
    if (options.status && options.status !== 'all') {
      filtered = filtered.filter((t: InspectionTask) => t.status === options.status);
    }

    // 按负责人过滤
    if (options.assignee) {
      filtered = filtered.filter((t: InspectionTask) =>
        t.assigneeIds?.includes(options.assignee!)
      );
    }

    // 统计各状态数量
    const allTasks = tasks as InspectionTask[];
    const stats = {
      pending: allTasks.filter(t => t.status === 'pending').length,
      in_progress: allTasks.filter(t => t.status === 'in_progress').length,
      completed: allTasks.filter(t => t.status === 'completed').length,
    };

    return { tasks: filtered, stats };
  } catch (error) {
    console.error('[ToolDataService] Error querying tasks:', error);
    return {
      tasks: [],
      stats: { pending: 0, in_progress: 0, completed: 0 }
    };
  }
}

// ==================== Stats Data ====================

/**
 * 获取整体统计
 */
export async function getOverallStats(): Promise<{
  devices: { total: number; normal: number; warning: number; error: number; offline: number };
  hazards: { total: number; pending: number; processing: number; resolved: number };
  tasks: { total: number; pending: number; in_progress: number; completed: number };
}> {
  const [deviceData, hazardData, taskData] = await Promise.all([
    queryDevices({ status: 'all' }),
    queryHazards({ status: 'all' }),
    queryTasks({ status: 'all' }),
  ]);

  return {
    devices: {
      total: deviceData.devices.length,
      normal: deviceData.stats.normal,
      warning: deviceData.stats.warning,
      error: deviceData.stats.error,
      offline: deviceData.stats.offline,
    },
    hazards: {
      total: hazardData.hazards.length,
      pending: hazardData.stats.submitted + hazardData.stats.draft,
      processing: hazardData.stats.confirmed + hazardData.stats.rectifying,
      resolved: hazardData.stats.accepted,
    },
    tasks: {
      total: taskData.tasks.length,
      pending: taskData.stats.pending,
      in_progress: taskData.stats.in_progress,
      completed: taskData.stats.completed,
    },
  };
}

// ==================== Search Functions ====================

/**
 * 搜索设备
 */
export async function searchDevices(keyword: string): Promise<Device[]> {
  const { devices } = await queryDevices({ status: 'all' });
  const lowerKeyword = keyword.toLowerCase();

  return devices.filter(d =>
    d.name?.toLowerCase().includes(lowerKeyword) ||
    d.qrCode?.toLowerCase().includes(lowerKeyword) ||
    d.locationName?.toLowerCase().includes(lowerKeyword) ||
    d.typeName?.toLowerCase().includes(lowerKeyword)
  );
}

/**
 * 搜索隐患
 */
export async function searchHazards(keyword: string): Promise<HazardRecord[]> {
  const { hazards } = await queryHazards({ status: 'all' });
  const lowerKeyword = keyword.toLowerCase();

  return hazards.filter(h =>
    h.description?.toLowerCase().includes(lowerKeyword) ||
    h.locationName?.toLowerCase().includes(lowerKeyword) ||
    h.typeName?.toLowerCase().includes(lowerKeyword) ||
    h.businessNo?.toLowerCase().includes(lowerKeyword)
  );
}

/**
 * 搜索任务
 */
export async function searchTasks(keyword: string): Promise<InspectionTask[]> {
  const { tasks } = await queryTasks({ status: 'all' });
  const lowerKeyword = keyword.toLowerCase();

  return tasks.filter(t =>
    t.name?.toLowerCase().includes(lowerKeyword) ||
    t.description?.toLowerCase().includes(lowerKeyword)
  );
}
