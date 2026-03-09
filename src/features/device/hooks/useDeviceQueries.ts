/**
 * Device 模块 React Query Hooks
 *
 * Phase 2: 数据迁移 - 设备模块
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  fetchDevices,
  fetchDeviceById,
  fetchDeviceTypes,
  fetchDeviceLocations,
} from '@/shared/api/fetchFunctions';

// ============================================
// 查询 Hooks
// ============================================

/**
 * 获取设备列表
 * @param deptId - 部门ID筛选
 */
export const useDeviceQueries = (deptId?: string) => {
  return useQuery({
    queryKey: queryKeys.device.all(deptId),
    queryFn: () => fetchDevices(deptId),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

/**
 * 获取设备详情
 */
export const useDeviceQuery = (id: string) => {
  return useQuery({
    queryKey: queryKeys.device.detail(id),
    queryFn: () => fetchDeviceById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * 获取设备类型列表
 */
export const useDeviceTypes = () => {
  return useQuery({
    queryKey: queryKeys.device.types,
    queryFn: () => fetchDeviceTypes(),
    staleTime: 30 * 60 * 1000, // 设备类型相对稳定，30分钟
  });
};

/**
 * 获取设备位置列表
 */
export const useDeviceLocations = () => {
  return useQuery({
    queryKey: queryKeys.device.locations,
    queryFn: () => fetchDeviceLocations(),
    staleTime: 30 * 60 * 1000,
  });
};

/**
 * 获取设备统计数据
 */
export const useDeviceStatistics = (deptId?: string) => {
  return useQuery({
    queryKey: queryKeys.device.all(deptId),
    queryFn: async () => {
      const devices = await fetchDevices(deptId);

      return {
        total: devices.length,
        online: devices.filter((d: any) => d.status === 'online').length,
        offline: devices.filter((d: any) => d.status === 'offline').length,
        warning: devices.filter((d: any) => d.status === 'warning').length,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ============================================
// 工具 Hooks
// ============================================

/**
 * 预加载设备数据
 */
export const usePrefetchDevice = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.device.detail(id),
      queryFn: () => fetchDeviceById(id),
      staleTime: 10 * 60 * 1000,
    });
  };
};
