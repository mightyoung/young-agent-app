/**
 * React Query 客户端配置
 * 基于 TanStack Query v5
 *
 * 移动端最佳实践:
 * - 持久化缓存支持离线访问
 * - 智能重连后刷新
 * - 针对移动端网络特性优化
 *
 * 参考: https://tanstack.com/query/v5/docs/framework/react/guides/advanced-scripts
 */

import { QueryClient } from '@tanstack/react-query';
import { mmkvPersister } from './queryPersist';

/**
 * QueryClient 配置选项
 * 针对 React Native/Expo 进行了优化
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    /**
     * 查询的默认选项
     */
    queries: {
      // 数据在5分钟内被视为新鲜
      // 减少不必要的重新获取,节省移动端流量
      staleTime: 5 * 60 * 1000,

      // 缓存数据在30分钟后被垃圾回收
      // 对于移动端设备,减少内存占用很重要
      gcTime: 30 * 60 * 1000,

      // 后台重新获取失败时最多重试3次
      // 避免频繁的网络错误影响用户体验
      retry: 3,

      // 重试延迟: 指数退避 (1s, 2s, 4s, 8s...)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // 组件挂载时不重新获取
      // 避免不必要的网络请求
      refetchOnMount: false,

      // 窗口重新获得焦点时不重新获取
      // 移动端用户经常切换应用,避免中断用户体验
      refetchOnWindowFocus: false,

      // ✅ 网络重新连接时自动刷新
      // 移动端网络不稳定,这是关键特性!
      // 用户从离线恢复后,自动获取最新数据
      refetchOnReconnect: true,

      // 抛出错误而不是在 isError 状态返回
      // 配合 Error Boundary 使用
      throwOnError: false,

      // ✅ 启用持久化
      // 支持离线访问和数据恢复
      // 使用 mmkvPersister (高性能移动端存储)
      persister: mmkvPersister,
    },

    /**
     * mutations 的默认选项
     */
    mutations: {
      // mutation 错误默认不抛出,可以在调用处处理
      throwOnError: false,

      // mutation 默认不重试
      // 写入操作需要用户明确确认
      retry: 0,
    },
  },
});

/**
 * 导出 QueryClient 实例
 * 在 App 入口处使用 QueryClientProvider 包裹应用
 */
export default queryClient;
