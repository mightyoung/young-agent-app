/**
 * React Query 缓存 Key 管理
 *
 * 统一的缓存 key 管理,避免硬编码字符串
 * 遵循 React Query 的最佳实践
 */

// ============================================
// 类型定义
// ============================================

/** 隐患列表筛选条件 */
export interface HazardFilters {
  status?: string;
  typeId?: string;
  deptId?: string;
  startDate?: string;
  endDate?: string;
}

/** 列表请求参数 */
export interface ListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

// ============================================
// Query Keys
// ============================================

/**
 * 统一的查询 Key 管理
 * 结构: [entity, ...subKeys]
 *
 * 使用示例:
 * - queryKeys.hazard.all() -> ['hazard', 'all']
 * - queryKeys.hazard.detail('123') -> ['hazard', 'detail', '123']
 */
export const queryKeys = {
  // ============== 用户相关 ==============
  user: {
    all: ['user'] as const,
    detail: (id: string) => ['user', 'detail', id] as const,
    profile: ['user', 'profile'] as const,
  },

  // ============== 隐患相关 ==============
  hazard: {
    all: (filters?: HazardFilters) => ['hazard', 'all', filters] as const,
    list: (params?: ListParams) => ['hazard', 'list', params] as const,
    detail: (id: string) => ['hazard', 'detail', id] as const,
    drafts: ['hazard', 'drafts'] as const,
    statistics: ['hazard', 'statistics'] as const,
    // 流程操作
    confirm: (id: string) => ['hazard', 'confirm', id] as const,
    rectify: (id: string) => ['hazard', 'rectify', id] as const,
    accept: (id: string) => ['hazard', 'accept', id] as const,
    reject: (id: string) => ['hazard', 'reject', id] as const,
  },

  // ============== 设备相关 ==============
  device: {
    all: (deptId?: string) => ['device', 'all', deptId] as const,
    list: (params?: ListParams & { deptId?: string }) => ['device', 'list', params] as const,
    detail: (id: string) => ['device', 'detail', id] as const,
    types: ['device', 'types'] as const,
    locations: ['device', 'locations'] as const,
    templates: ['device', 'templates'] as const,
    checklist: (deviceId: string) => ['device', 'checklist', deviceId] as const,
  },

  // ============== 检查相关 ==============
  inspection: {
    all: ['inspection', 'all'] as const,
    list: (params?: ListParams) => ['inspection', 'list', params] as const,
    detail: (id: string) => ['inspection', 'detail', id] as const,
    tasks: ['inspection', 'tasks'] as const,
    history: ['inspection', 'history'] as const,
    statistics: ['inspection', 'statistics'] as const,
    // 检查流程
    start: (id: string) => ['inspection', 'start', id] as const,
    submit: (id: string) => ['inspection', 'submit', id] as const,
  },

  // ============== 消息相关 ==============
  message: {
    all: ['message', 'all'] as const,
    unread: ['message', 'unread'] as const,
    detail: (id: string) => ['message', 'detail', id] as const,
  },

  // ============== AI 相关 ==============
  ai: {
    conversations: ['ai', 'conversations'] as const,
    conversation: (id: string) => ['ai', 'conversation', id] as const,
    messages: (conversationId: string) => ['ai', 'messages', conversationId] as const,
    knowledgeBase: ['ai', 'knowledgeBase'] as const,
    knowledgeDetail: (id: string) => ['ai', 'knowledge', id] as const,
    statistics: ['ai', 'statistics'] as const,
  },

  // ============== 通用 ==============
  common: {
    departments: ['common', 'departments'] as const,
    enterprises: ['common', 'enterprises'] as const,
    dictionary: (type: string) => ['common', 'dictionary', type] as const,
  },
} as const;

/**
 * 类型安全的查询 key 生成器
 * 用于在 useQuery/useMutation 中自动推断类型
 */
export type QueryKey = typeof queryKeys;

export default queryKeys;
