// API Service Layer
// 基于 apiClient 的服务层封装

import { apiClient } from './apiClient';
import { ApiEndpoints } from './endpoints';
import type {
  LoginRequest,
  LoginResponse,
  UserInfo,
  PageParams,
  DeviceInfo,
  HazardInfo,
  InspectionTask,
  InspectionRecord,
  MessageInfo,
} from './endpoints';
import type { PaginatedResponse } from './apiClient';

// ============================================
// 认证服务
// ============================================

export const authService = {
  /** 登录 */
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>(ApiEndpoints.AUTH.LOGIN, data),

  /** 登出 */
  logout: () => apiClient.post(ApiEndpoints.AUTH.LOGOUT),

  /** 刷新 Token */
  refreshToken: (refreshToken: string) =>
    apiClient.post(ApiEndpoints.AUTH.REFRESH_TOKEN, { refreshToken }),

  /** 获取用户信息 */
  getUserInfo: () => apiClient.get<UserInfo>(ApiEndpoints.AUTH.GET_USER_INFO),
};

// ============================================
// 用户服务
// ============================================

export const userService = {
  /** 用户列表 */
  list: (params: PageParams & { role?: string; deptId?: string }) =>
    apiClient.get<PaginatedResponse<UserInfo>>(ApiEndpoints.USER.LIST, params),

  /** 用户详情 */
  detail: (id: string) =>
    apiClient.get<UserInfo>(ApiEndpoints.USER.DETAIL(id)),

  /** 创建用户 */
  create: (data: Partial<UserInfo>) =>
    apiClient.post(ApiEndpoints.USER.CREATE, data),

  /** 更新用户 */
  update: (id: string, data: Partial<UserInfo>) =>
    apiClient.put(ApiEndpoints.USER.UPDATE(id), data),

  /** 删除用户 */
  delete: (id: string) =>
    apiClient.delete(ApiEndpoints.USER.DELETE(id)),
};

// ============================================
// 部门服务
// ============================================

export const departmentService = {
  /** 部门列表 */
  list: (params?: PageParams & { enterpriseId?: string; parentId?: string }) =>
    apiClient.get(ApiEndpoints.DEPARTMENT.LIST, params),

  /** 部门详情 */
  detail: (id: string) =>
    apiClient.get(ApiEndpoints.DEPARTMENT.DETAIL(id)),
};

// ============================================
// 设备服务
// ============================================

export const deviceService = {
  /** 设备列表 */
  list: (params?: PageParams & {
    status?: string;
    location?: string;
    deviceTypeId?: string;
    deptId?: string;
    keyword?: string;
  }) => apiClient.get<PaginatedResponse<DeviceInfo>>(ApiEndpoints.DEVICE.LIST, params),

  /** 设备详情 */
  detail: (id: string) =>
    apiClient.get<DeviceInfo>(ApiEndpoints.DEVICE.DETAIL(id)),

  /** 创建设备 */
  create: (data: Partial<DeviceInfo>) =>
    apiClient.post(ApiEndpoints.DEVICE.CREATE, data),

  /** 更新设备 */
  update: (id: string, data: Partial<DeviceInfo>) =>
    apiClient.put(ApiEndpoints.DEVICE.UPDATE(id), data),

  /** 删除设备 */
  delete: (id: string) =>
    apiClient.delete(ApiEndpoints.DEVICE.DELETE(id)),

  /** 设备二维码 */
  getQrCode: (id: string) =>
    apiClient.get<{ url: string }>(ApiEndpoints.DEVICE.QR_CODE(id)),

  /** 设备检查清单 */
  getChecklist: (id: string) =>
    apiClient.get(ApiEndpoints.DEVICE.CHECKLIST(id)),

  /** 更新检查清单 */
  updateChecklist: (id: string, data: any) =>
    apiClient.put(ApiEndpoints.DEVICE.UPDATE_CHECKLIST(id), data),
};

// ============================================
// 巡检服务
// ============================================

export const inspectionService = {
  /** 巡检任务列表 */
  getTaskList: (params?: PageParams & {
    status?: number;
    assigneeId?: string;
    startDate?: string;
    endDate?: string;
  }) => apiClient.get<PaginatedResponse<InspectionTask>>(ApiEndpoints.INSPECTION.TASK_LIST, params),

  /** 巡检任务详情 */
  getTaskDetail: (id: string) =>
    apiClient.get<InspectionTask>(ApiEndpoints.INSPECTION.TASK_DETAIL(id)),

  /** 创建巡检任务 */
  createTask: (data: Partial<InspectionTask>) =>
    apiClient.post(ApiEndpoints.INSPECTION.CREATE_TASK, data),

  /** 更新巡检任务 */
  updateTask: (id: string, data: Partial<InspectionTask>) =>
    apiClient.put(ApiEndpoints.INSPECTION.UPDATE_TASK(id), data),

  /** 巡检记录列表 */
  getRecordList: (params?: PageParams & {
    taskId?: string;
    deviceId?: string;
    userId?: string;
    status?: number;
  }) => apiClient.get<PaginatedResponse<InspectionRecord>>(ApiEndpoints.INSPECTION.RECORD_LIST, params),

  /** 巡检记录详情 */
  getRecordDetail: (id: string) =>
    apiClient.get<InspectionRecord>(ApiEndpoints.INSPECTION.RECORD_DETAIL(id)),

  /** 提交巡检记录 */
  submitRecord: (data: Partial<InspectionRecord>) =>
    apiClient.post(ApiEndpoints.INSPECTION.SUBMIT_RECORD, data),

  /** 更新巡检记录 */
  updateRecord: (id: string, data: Partial<InspectionRecord>) =>
    apiClient.put(ApiEndpoints.INSPECTION.UPDATE_RECORD(id), data),
};

// ============================================
// 隐患服务
// ============================================

export const hazardService = {
  /** 隐患列表 */
  list: (params?: PageParams & {
    status?: number;
    hazardType?: string;
    startDate?: string;
    endDate?: string;
    keyword?: string;
    deptId?: string;
  }) => apiClient.get<PaginatedResponse<HazardInfo>>(ApiEndpoints.HAZARD.LIST, params),

  /** 隐患详情 */
  detail: (id: string) =>
    apiClient.get<HazardInfo>(ApiEndpoints.HAZARD.DETAIL(id)),

  /** 创建隐患 */
  create: (data: Partial<HazardInfo>) =>
    apiClient.post<HazardInfo>(ApiEndpoints.HAZARD.CREATE, data),

  /** 更新隐患 */
  update: (id: string, data: Partial<HazardInfo>) =>
    apiClient.put(ApiEndpoints.HAZARD.UPDATE(id), data),

  /** 删除隐患 */
  delete: (id: string) =>
    apiClient.delete(ApiEndpoints.HAZARD.DELETE(id)),

  /** 确认隐患 */
  confirm: (id: string, remark?: string) =>
    apiClient.post(ApiEndpoints.HAZARD.CONFIRM(id), { remark }),

  /** 整改隐患 */
  rectify: (id: string, description: string) =>
    apiClient.post(ApiEndpoints.HAZARD.RECTIFY(id), { description }),

  /** 验收隐患 */
  accept: (id: string, remark?: string) =>
    apiClient.post(ApiEndpoints.HAZARD.ACCEPT(id), { remark }),

  /** 退回隐患 */
  reject: (id: string, reason: string) =>
    apiClient.post(ApiEndpoints.HAZARD.REJECT(id), { reason }),

  /** 隐患流程记录 */
  getFlowLog: (id: string) =>
    apiClient.get(ApiEndpoints.HAZARD.FLOW_LOG(id)),

  /** 隐患统计 */
  getStats: () => apiClient.get(ApiEndpoints.HAZARD.STATS),
};

// ============================================
// 消息服务
// ============================================

export const messageService = {
  /** 消息列表 */
  list: (params?: PageParams & { type?: number; readStatus?: boolean }) =>
    apiClient.get<PaginatedResponse<MessageInfo>>(ApiEndpoints.MESSAGE.LIST, params),

  /** 消息详情 */
  detail: (id: string) =>
    apiClient.get<MessageInfo>(ApiEndpoints.MESSAGE.DETAIL(id)),

  /** 标记已读 */
  markRead: (id: string) =>
    apiClient.post(ApiEndpoints.MESSAGE.MARK_READ(id)),

  /** 全部标记已读 */
  markAllRead: () =>
    apiClient.post(ApiEndpoints.MESSAGE.MARK_ALL_READ),

  /** 未读数量 */
  getUnreadCount: () =>
    apiClient.get<{ count: number }>(ApiEndpoints.MESSAGE.UNREAD_COUNT),

  /** 删除消息 */
  delete: (id: string) =>
    apiClient.delete(ApiEndpoints.MESSAGE.DELETE(id)),
};

// ============================================
// 文件服务
// ============================================

export const fileService = {
  /** 上传图片 */
  uploadImage: (formData: FormData, onProgress?: (progress: number) => void) =>
    apiClient.upload<{ id: string; url: string }>(ApiEndpoints.FILE.UPLOAD_IMAGE, formData, onProgress),

  /** 上传语音 */
  uploadVoice: (formData: FormData, onProgress?: (progress: number) => void) =>
    apiClient.upload<{ id: string; url: string }>(ApiEndpoints.FILE.UPLOAD_VOICE, formData, onProgress),

  /** 上传文件 */
  upload: (formData: FormData, onProgress?: (progress: number) => void) =>
    apiClient.upload<{ id: string; url: string }>(ApiEndpoints.FILE.UPLOAD_FILE, formData, onProgress),

  /** 获取文件URL */
  getUrl: (id: string) =>
    apiClient.get<{ url: string }>(ApiEndpoints.FILE.GET_URL(id)),

  /** 删除文件 */
  delete: (id: string) =>
    apiClient.delete(ApiEndpoints.FILE.DELETE(id)),
};

// ============================================
// 报表服务
// ============================================

export const reportService = {
  /** 隐患统计 */
  getHazardStats: (params?: { startDate?: string; endDate?: string; deptId?: string }) =>
    apiClient.get(ApiEndpoints.REPORT.HAZARD_STATS, params),

  /** 巡检统计 */
  getInspectionStats: (params?: { startDate?: string; endDate?: string; deptId?: string }) =>
    apiClient.get(ApiEndpoints.REPORT.INSPECTION_STATS, params),

  /** 设备统计 */
  getDeviceStats: (params?: { deptId?: string }) =>
    apiClient.get(ApiEndpoints.REPORT.DEVICE_STATS, params),

  /** 人员统计 */
  getUserStats: (params?: { deptId?: string; startDate?: string; endDate?: string }) =>
    apiClient.get(ApiEndpoints.REPORT.USER_STATS, params),

  /** 趋势分析 */
  getTrend: (params?: { type: string; startDate?: string; endDate?: string }) =>
    apiClient.get(ApiEndpoints.REPORT.TREND, params),
};

// ============================================
// 导出所有服务
// ============================================

export const apiServices = {
  auth: authService,
  user: userService,
  department: departmentService,
  device: deviceService,
  inspection: inspectionService,
  hazard: hazardService,
  message: messageService,
  file: fileService,
  report: reportService,
};

export default apiServices;
