/**
 * AI 模块 React Query Hooks
 *
 * 渐进式迁移示例 - Phase 1
 * 这些hooks展示如何将现有Zustand store数据获取迁移到React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/api/queryKeys';
import {
  fetchHazards,
  fetchInspections,
  fetchDevices,
  fetchMessages,
  createHazard,
  confirmHazard,
  rectifyHazard,
  acceptHazard,
} from '../../../shared/api/fetchFunctions';

// ============================================
// 统计相关 Hooks
// ============================================

/**
 * 获取隐患统计数据
 * 对应现有: useHazardStore().fetchHazards()
 */
export const useHazardStats = (filters?: { status?: string; deptId?: string }) => {
  return useQuery({
    queryKey: queryKeys.hazard.statistics,
    queryFn: async () => {
      const hazards = await fetchHazards(filters);

      // 在客户端计算统计数据
      return {
        total: hazards.length,
        submitted: hazards.filter((h: any) => h.status === 'submitted').length,
        confirmed: hazards.filter((h: any) => h.status === 'confirmed').length,
        rectifying: hazards.filter((h: any) => h.status === 'rectifying').length,
        accepted: hazards.filter((h: any) => h.status === 'accepted').length,
        rejected: hazards.filter((h: any) => h.status === 'rejected').length,
      };
    },
    staleTime: 5 * 60 * 1000, // 5分钟 stale time
  });
};

/**
 * 获取检查记录统计数据
 * 对应现有: useInspectionStore().fetchRecords()
 */
export const useInspectionStats = (params?: { page?: number; pageSize?: number }) => {
  return useQuery({
    queryKey: queryKeys.inspection.list(params),
    queryFn: async () => {
      const records = await fetchInspections(params);

      return {
        total: records.length,
        completed: records.filter((r: any) => r.result === 'pass').length,
        pending: records.filter((r: any) => r.result !== 'pass').length,
        records,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * 获取设备统计数据
 */
export const useDeviceStats = (deptId?: string) => {
  return useQuery({
    queryKey: queryKeys.device.all(deptId),
    queryFn: async () => {
      const devices = await fetchDevices(deptId);

      return {
        total: devices.length,
        online: devices.filter((d: any) => d.status === 'online').length,
        offline: devices.filter((d: any) => d.status === 'offline').length,
        devices,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ============================================
// 列表查询 Hooks
// ============================================

/**
 * 获取隐患列表 (带缓存)
 */
export const useHazardList = (filters?: { status?: string; typeId?: string; deptId?: string }) => {
  return useQuery({
    queryKey: queryKeys.hazard.all(filters),
    queryFn: () => fetchHazards(filters),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * 获取检查记录列表
 */
export const useInspectionList = (params?: { page?: number; pageSize?: number; keyword?: string }) => {
  return useQuery({
    queryKey: queryKeys.inspection.list(params),
    queryFn: () => fetchInspections(params),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * 获取设备列表
 */
export const useDeviceList = (deptId?: string) => {
  return useQuery({
    queryKey: queryKeys.device.all(deptId),
    queryFn: () => fetchDevices(deptId),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * 获取未读消息数
 */
export const useUnreadMessages = () => {
  return useQuery({
    queryKey: queryKeys.message.unread,
    queryFn: () => fetchMessages(),
    staleTime: 60 * 1000, // 1分钟
    select: (messages) => messages.filter((m: any) => !m.read),
  });
};

// ============================================
// 详情查询 Hooks
// ============================================

/**
 * 获取隐患详情
 */
export const useHazardDetail = (id: string) => {
  return useQuery({
    queryKey: queryKeys.hazard.detail(id),
    queryFn: () => fetchHazards({ id } as any).then(data => data[0]),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * 获取检查详情
 */
export const useInspectionDetail = (id: string) => {
  return useQuery({
    queryKey: queryKeys.inspection.detail(id),
    queryFn: () => fetchInspections({ id } as any).then(data => data[0]),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * 获取设备详情
 */
export const useDeviceDetail = (id: string) => {
  return useQuery({
    queryKey: queryKeys.device.detail(id),
    queryFn: () => fetchDevices().then(data => data.find((d: any) => d.id === id)),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// ============================================
// 突变 Hooks (Mutations)
// ============================================

/**
 * 创建隐患
 */
export const useCreateHazard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => createHazard(data),
    onSuccess: () => {
      // 成功后 invalidate 缓存，触发重新获取
      queryClient.invalidateQueries({ queryKey: queryKeys.hazard.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.hazard.statistics });
    },
  });
};

/**
 * 确认隐患
 */
export const useConfirmHazard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ hazardId, userId }: { hazardId: string; userId: string }) =>
      confirmHazard(hazardId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hazard.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.hazard.statistics });
    },
  });
};

/**
 * 整改隐患
 */
export const useRectifyHazard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ hazardId, data }: { hazardId: string; data: any }) =>
      rectifyHazard(hazardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hazard.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.hazard.statistics });
    },
  });
};

/**
 * 验收隐患
 */
export const useAcceptHazard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ hazardId, data }: { hazardId: string; data: any }) =>
      acceptHazard(hazardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hazard.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.hazard.statistics });
    },
  });
};

/* 导入已在上方完成 */
