/**
 * API 适配层 - 将现有 apiClient 转换为 React Query 兼容的函数
 *
 * 这里定义所有数据获取的查询函数
 * 供 useQuery 和 useSuspenseQuery 使用
 */

import { apiClient, ApiResponse } from '@/core/network/apiClient';
import { queryKeys, HazardFilters, ListParams } from './queryKeys';

// ============================================
// 类型定义
// ============================================

/** API 错误类型 - 与 React Query 兼容 */
export class FetchError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: number
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

// ============================================
// 隐患相关 API
// ============================================

/** 获取隐患列表 */
export const fetchHazards = async (filters?: HazardFilters) => {
  try {
    const data = await apiClient.get<any[]>('/hazard/list', filters);
    return data;
  } catch (error: any) {
    throw new FetchError(
      error.message || '获取隐患列表失败',
      error.status,
      error.code
    );
  }
};

/** 获取隐患详情 */
export const fetchHazardById = async (id: string) => {
  try {
    const data = await apiClient.get<any>(`/hazard/${id}`);
    return data;
  } catch (error: any) {
    throw new FetchError(
      error.message || '获取隐患详情失败',
      error.status,
      error.code
    );
  }
};

/** 获取隐患草稿 */
export const fetchHazardDrafts = async () => {
  try {
    const data = await apiClient.get<any[]>('/hazard/drafts');
    return data;
  } catch (error: any) {
    throw new FetchError(
      error.message || '获取草稿失败',
      error.status,
      error.code
    );
  }
};

/** 创建隐患 */
export const createHazard = async (data: any) => {
  try {
    const result = await apiClient.post<any>('/hazard', data);
    return result;
  } catch (error: any) {
    throw new FetchError(
      error.message || '创建隐患失败',
      error.status,
      error.code
    );
  }
};

/** 确认隐患 */
export const confirmHazard = async (hazardId: string, userId: string) => {
  try {
    const result = await apiClient.post<any>(`/hazard/${hazardId}/confirm`, { userId });
    return result;
  } catch (error: any) {
    throw new FetchError(
      error.message || '确认隐患失败',
      error.status,
      error.code
    );
  }
};

/** 整改隐患 */
export const rectifyHazard = async (hazardId: string, data: any) => {
  try {
    const result = await apiClient.post<any>(`/hazard/${hazardId}/rectify`, data);
    return result;
  } catch (error: any) {
    throw new FetchError(
      error.message || '整改隐患失败',
      error.status,
      error.code
    );
  }
};

/** 验收隐患 */
export const acceptHazard = async (hazardId: string, data: any) => {
  try {
    const result = await apiClient.post<any>(`/hazard/${hazardId}/accept`, data);
    return result;
  } catch (error: any) {
    throw new FetchError(
      error.message || '验收隐患失败',
      error.status,
      error.code
    );
  }
};

// ============================================
// 设备相关 API
// ============================================

/** 获取设备列表 */
export const fetchDevices = async (deptId?: string) => {
  try {
    const params = deptId ? { deptId } : {};
    const data = await apiClient.get<any[]>('/device/list', params);
    return data;
  } catch (error: any) {
    throw new FetchError(
      error.message || '获取设备列表失败',
      error.status,
      error.code
    );
  }
};

/** 获取设备详情 */
export const fetchDeviceById = async (id: string) => {
  try {
    const data = await apiClient.get<any>(`/device/${id}`);
    return data;
  } catch (error: any) {
    throw new FetchError(
      error.message || '获取设备详情失败',
      error.status,
      error.code
    );
  }
};

/** 获取设备类型 */
export const fetchDeviceTypes = async () => {
  try {
    const data = await apiClient.get<any[]>('/device/types');
    return data;
  } catch (error: any) {
    throw new FetchError(
      error.message || '获取设备类型失败',
      error.status,
      error.code
    );
  }
};

/** 获取设备位置 */
export const fetchDeviceLocations = async () => {
  try {
    const data = await apiClient.get<any[]>('/device/locations');
    return data;
  } catch (error: any) {
    throw new FetchError(
      error.message || '获取设备位置失败',
      error.status,
      error.code
    );
  }
};

// ============================================
// 检查相关 API
// ============================================

/** 获取检查记录列表 */
export const fetchInspections = async (params?: ListParams) => {
  try {
    const data = await apiClient.get<any[]>('/inspection/list', params);
    return data;
  } catch (error: any) {
    throw new FetchError(
      error.message || '获取检查记录失败',
      error.status,
      error.code
    );
  }
};

/** 获取检查详情 */
export const fetchInspectionById = async (id: string) => {
  try {
    const data = await apiClient.get<any>(`/inspection/${id}`);
    return data;
  } catch (error: any) {
    throw new FetchError(
      error.message || '获取检查详情失败',
      error.status,
      error.code
    );
  }
};

/** 获取检查任务 */
export const fetchInspectionTasks = async () => {
  try {
    const data = await apiClient.get<any[]>('/inspection/tasks');
    return data;
  } catch (error: any) {
    throw new FetchError(
      error.message || '获取检查任务失败',
      error.status,
      error.code
    );
  }
};

/** 开始检查 */
export const startInspection = async (taskId: string) => {
  try {
    const data = await apiClient.post<any>(`/inspection/${taskId}/start`);
    return data;
  } catch (error: any) {
    throw new FetchError(
      error.message || '开始检查失败',
      error.status,
      error.code
    );
  }
};

/** 提交检查结果 */
export const submitInspection = async (taskId: string, data: any) => {
  try {
    const result = await apiClient.post<any>(`/inspection/${taskId}/submit`, data);
    return result;
  } catch (error: any) {
    throw new FetchError(
      error.message || '提交检查失败',
      error.status,
      error.code
    );
  }
};

// ============================================
// 消息相关 API
// ============================================

/** 获取消息列表 */
export const fetchMessages = async () => {
  try {
    const data = await apiClient.get<any[]>('/message/list');
    return data;
  } catch (error: any) {
    throw new FetchError(
      error.message || '获取消息失败',
      error.status,
      error.code
    );
  }
};

/** 获取未读消息数 */
export const fetchUnreadCount = async () => {
  try {
    const data = await apiClient.get<number>('/message/unread/count');
    return data;
  } catch (error: any) {
    throw new FetchError(
      error.message || '获取未读消息数失败',
      error.status,
      error.code
    );
  }
};

/** 标记消息已读 */
export const markMessageRead = async (messageId: string) => {
  try {
    const data = await apiClient.post<any>(`/message/${messageId}/read`);
    return data;
  } catch (error: any) {
    throw new FetchError(
      error.message || '标记已读失败',
      error.status,
      error.code
    );
  }
};

// ============================================
// 用户相关 API
// ============================================

/** 获取当前用户信息 */
export const fetchCurrentUser = async () => {
  try {
    const data = await apiClient.get<any>('/user/current');
    return data;
  } catch (error: any) {
    throw new FetchError(
      error.message || '获取用户信息失败',
      error.status,
      error.code
    );
  }
};

/** 更新用户信息 */
export const updateUserProfile = async (data: any) => {
  try {
    const result = await apiClient.put<any>('/user/profile', data);
    return result;
  } catch (error: any) {
    throw new FetchError(
      error.message || '更新用户信息失败',
      error.status,
      error.code
    );
  }
};

// ============================================
// 通用 API
// ============================================

/** 获取部门列表 */
export const fetchDepartments = async () => {
  try {
    const data = await apiClient.get<any[]>('/common/departments');
    return data;
  } catch (error: any) {
    throw new FetchError(
      error.message || '获取部门列表失败',
      error.status,
      error.code
    );
  }
};

/** 获取企业列表 */
export const fetchEnterprises = async () => {
  try {
    const data = await apiClient.get<any[]>('/common/enterprises');
    return data;
  } catch (error: any) {
    throw new FetchError(
      error.message || '获取企业列表失败',
      error.status,
      error.code
    );
  }
};
