/**
 * QueryProvider - React Query 上下文提供者
 *
 * 在应用入口处使用,包裹整个应用
 */

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * QueryProvider 组件
 * 只需在应用根节点包裹一次
 *
 * @example
 * ```tsx
 * // 在 App.tsx 中使用
 * import { QueryProvider } from '@/shared/api';
 *
 * export default function App() {
 *   return (
 *     <QueryProvider>
 *       <YourApp />
 *     </QueryProvider>
 *   );
 * }
 * ```
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export default QueryProvider;
