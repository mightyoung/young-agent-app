// App configuration
import { hazardStatusConfig } from './business';

export const config = {
  // App info
  name: 'Young-agent',
  englishName: 'MightYoung',
  version: '1.0.0',

  // API
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com',
  apiTimeout: 30000,
  defaultPageSize: 20,

  // Storage keys
  storageKeys: {
    user: 'user',
    token: 'token',
    settings: 'settings',
    syncQueue: 'syncQueue',
    lastSyncTime: 'lastSyncTime',
  },

  // Database
  database: {
    name: 'might_young.db',
    version: 1,
  },

  // Sync
  sync: {
    maxRetries: 3,
    retryDelay: 5000,
    batchSize: 50,
  },

  // AI
  ai: {
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    maxTokens: 2000,
    temperature: 0.7,
  },

  // Animation durations (ms)
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
  },

  // Hazard types
  hazardTypes: [
    { code: 'fire', name: '火灾安全隐患', icon: 'fire' },
    { code: 'electric', name: '电力设施损坏', icon: 'flash' },
    { code: 'construction', name: '违章建筑施工', icon: 'construct' },
    { code: 'other', name: '其他环境安全', icon: 'ellipsis-horizontal' },
  ],

  // Hazard status flow configuration
  // 状态标签：待提交(灰)、待确认(蓝)、待整改(红)、待验收(黄)、已验收(绿)
  // 审批流节点：提交、确认、整改、验收
  // 注意：具体配置已移至 business.ts 中的 hazardStatusConfig
  hazardStatusFlow: {
    // 状态配置
    statusConfig: hazardStatusConfig.statusLabels,
    // 审批流节点
    flowSteps: hazardStatusConfig.flowSteps,
    // 筛选步骤
    steps: hazardStatusConfig.filterSteps,
    // 获取当前步骤索引
    getCurrentFlowStepIndex: hazardStatusConfig.getFlowStepIndex,
    // 兼容旧版本
    getCurrentStepIndex: hazardStatusConfig.getFlowStepIndex,
  },

  // Inspection results
  inspectionResults: [
    { code: 'pass', name: '合格', color: '#52C41A' },
    { code: 'fail', name: '不合格', color: '#F5222D' },
    { code: 'partial', name: '部分合格', color: '#FAAD14' },
  ],

  // User roles
  rolePermissions: {
    user: {
      canReportHazard: true,
      canScanCheck: false,
      canSafetyCheck: false,
      canViewHistory: false,
      canViewDevices: false,
      canManageDevices: false,
      canManageUsers: false,
      canViewReports: false,
    },
    inspector: {
      canReportHazard: true,
      canScanCheck: true,
      canSafetyCheck: true,
      canViewHistory: true,
      canViewDevices: true,
      canManageDevices: false,
      canManageUsers: false,
      canViewReports: false,
    },
    leader: {
      canReportHazard: true,
      canScanCheck: true,
      canSafetyCheck: true,
      canViewHistory: true,
      canViewDevices: true,
      canManageDevices: true,
      canManageUsers: true,
      canViewReports: true,
    },
    admin: {
      canReportHazard: true,
      canScanCheck: true,
      canSafetyCheck: true,
      canViewHistory: true,
      canViewDevices: true,
      canManageDevices: true,
      canManageUsers: true,
      canViewReports: true,
    },
  },
};
