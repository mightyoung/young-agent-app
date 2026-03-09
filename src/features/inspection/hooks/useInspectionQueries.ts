/**
 * Inspection 模块 React Query Hooks
 *
 * Phase 2: 数据迁移 - 检查模块
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  fetchInspections,
  fetchInspectionById,
  fetchInspectionTasks,
  startInspection,
  submitInspection,
} from '@/shared/api/fetchFunctions';

// ============================================
// 查询 Hooks
// ============================================

/**
 * 获取检查记录列表
 * @param params - 分页和筛选参数
 */
export const useInspectionQueries = (params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.inspection.list(params),
    queryFn: () => fetchInspections(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

/**
 * 获取检查记录详情
 */
export const useInspectionQuery = (id: string) => {
  return useQuery({
    queryKey: queryKeys.inspection.detail(id),
    queryFn: () => fetchInspectionById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * 获取检查任务列表
 */
export const useInspectionTasks = () => {
  return useQuery({
    queryKey: queryKeys.inspection.tasks,
    queryFn: () => fetchInspectionTasks(),
    staleTime: 2 * 60 * 1000, // 任务状态频繁变化，2分钟
  });
};

/**
 * 获取检查记录统计数据
 */
export const useInspectionStatistics = () => {
  return useQuery({
    queryKey: queryKeys.inspection.list({}),
    queryFn: async () => {
      const records = await fetchInspections();

      return {
        total: records.length,
        completed: records.filter((r: any) => r.result === 'pass').length,
        pending: records.filter((r: any) => r.result === 'pending').length,
        failed: records.filter((r: any) => r.result === 'fail').length,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ============================================
// 突变 Hooks
// ============================================

/**
 * 开始检查
 */
export const useStartInspectionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => startInspection(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inspection.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.inspection.all });
    },
  });
};

/**
 * 提交检查结果
 */
export const useSubmitInspectionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: any }) =>
      submitInspection(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inspection.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.inspection.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inspection.statistics });
    },
  });
};

// ============================================
// 工具 Hooks
// ============================================

/**
 * 预加载检查记录
 */
export const usePrefetchInspection = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.inspection.detail(id),
      queryFn: () => fetchInspectionById(id),
      staleTime: 10 * 60 * 1000,
    });
  };
};
