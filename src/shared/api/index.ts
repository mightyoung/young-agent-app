/**
 * Shared API 模块导出
 * 统一导出 React Query 相关的所有功能
 */

export { queryClient, default } from './queryClient';
export { queryKeys } from './queryKeys';
export type { QueryKey, HazardFilters, ListParams } from './queryKeys';
export * from './fetchFunctions';
