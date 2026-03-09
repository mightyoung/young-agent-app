/**
 * Hazard 模块 React Query Hooks
 *
 * Phase 2: 数据迁移 - 隐患模块
 *
 * 设计原则:
 * - React Query 负责服务端数据获取和缓存
 * - Zustand 保留用于UI状态管理
 * - 渐进式迁移: 现有组件可逐步迁移到新hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  fetchHazards,
  fetchHazardById,
  fetchHazardDrafts,
  createHazard,
  confirmHazard,
  rectifyHazard,
  acceptHazard,
} from '@/shared/api/fetchFunctions';

// ============================================
// 查询 Hooks
// ============================================

/**
 * 获取隐患列表
 * @param filters - 筛选条件
 *
 * @example
 * const { data, isLoading, error } = useHazardQueries({ status: 'submitted' });
 */
export const useHazardQueries = (filters?: {
  status?: string;
  typeId?: string;
  deptId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.hazard.all(filters),
    queryFn: () => fetchHazards(filters),
    staleTime: 5 * 60 * 1000, // 5分钟
    gcTime: 30 * 60 * 1000, // 30分钟缓存
  });
};

/**
 * 获取隐患详情
 * @param id - 隐患ID
 */
export const useHazardQuery = (id: string) => {
  return useQuery({
    queryKey: queryKeys.hazard.detail(id),
    queryFn: () => fetchHazardById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * 获取隐患草稿
 */
export const useHazardDrafts = () => {
  return useQuery({
    queryKey: queryKeys.hazard.drafts,
    queryFn: () => fetchHazardDrafts(),
    staleTime: 1 * 60 * 1000, // 草稿频繁变化，1分钟
  });
};

/**
 * 获取隐患统计数据
 */
export const useHazardStatistics = () => {
  return useQuery({
    queryKey: queryKeys.hazard.statistics,
    queryFn: async () => {
      const hazards = await fetchHazards();

      return {
        total: hazards.length,
        submitted: hazards.filter((h: any) => h.status === 'submitted').length,
        confirmed: hazards.filter((h: any) => h.status === 'confirmed').length,
        rectifying: hazards.filter((h: any) => h.status === 'rectifying').length,
        accepted: hazards.filter((h: any) => h.status === 'accepted').length,
        rejected: hazards.filter((h: any) => h.status === 'rejected').length,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ============================================
// 突变 Hooks (Mutations)
// ============================================

/**
 * 创建隐患
 *
 * @example
 * const createMutation = useCreateHazardMutation();
 * createMutation.mutate({ type: 'fire', description: '...' });
 */
export const useCreateHazardMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (hazard: any) => createHazard(hazard),
    onSuccess: () => {
      // 刷新列表和统计缓存
      queryClient.invalidateQueries({ queryKey: queryKeys.hazard.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.hazard.statistics });
      queryClient.invalidateQueries({ queryKey: queryKeys.hazard.drafts });
    },
  });
};

/**
 * 确认隐患
 */
export const useConfirmHazardMutation = () => {
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
export const useRectifyHazardMutation = () => {
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
export const useAcceptHazardMutation = () => {
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

// ============================================
// 工具 Hooks
// ============================================

/**
 * 预加载隐患数据 (用于页面跳转优化)
 */
export const usePrefetchHazard = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.hazard.detail(id),
      queryFn: () => fetchHazardById(id),
      staleTime: 10 * 60 * 1000,
    });
  };
};

/**
 * 乐观更新 - 标记已读
 * 用于提升用户体验的乐观更新示例
 */
export const useOptimisticMarkRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hazardId: string) => {
      // 实际API调用
      // await markHazardRead(hazardId);
      return hazardId;
    },
    onMutate: async (hazardId) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: queryKeys.hazard.all() });

      // 保存之前的缓存数据
      const previousHazards = queryClient.getQueryData(queryKeys.hazard.all());

      // 乐观更新
      queryClient.setQueryData(queryKeys.hazard.all(), (old: any[]) => {
        return old?.map(h =>
          h.id === hazardId ? { ...h, read: true } : h
        );
      });

      return { previousHazards };
    },
    onError: (err, hazardId, context) => {
      // 回滚
      if (context?.previousHazards) {
        queryClient.setQueryData(queryKeys.hazard.all(), context.previousHazards);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hazard.all() });
    },
  });
};
