// API Endpoint Definitions
// 统一的 API 端点定义，用于类型安全和 AI 智能助手

// ============================================
// 端点基础路径
// ============================================

/** API 端点路径枚举 */
export const ApiEndpoints = {
  // ==================
  // 认证模块
  // ==================
  AUTH: {
    /** 登录 */
    LOGIN: '/auth/login',
    /** 登出 */
    LOGOUT: '/auth/logout',
    /** 刷新 Token */
    REFRESH_TOKEN: '/auth/refresh',
    /** 获取用户信息 */
    GET_USER_INFO: '/auth/userinfo',
  },

  // ==================
  // 用户管理模块
  // ==================
  USER: {
    /** 用户列表 */
    LIST: '/users',
    /** 用户详情 */
    DETAIL: (id: string) => `/users/${id}`,
    /** 创建用户 */
    CREATE: '/users',
    /** 更新用户 */
    UPDATE: (id: string) => `/users/${id}`,
    /** 删除用户 */
    DELETE: (id: string) => `/users/${id}`,
    /** 修改密码 */
    CHANGE_PASSWORD: '/users/change-password',
  },

  // ==================
  // 企业与部门模块
  // ==================
  ENTERPRISE: {
    /** 企业详情 */
    DETAIL: '/enterprise',
    /** 企业列表 */
    LIST: '/enterprises',
  },

  DEPARTMENT: {
    /** 部门列表 */
    LIST: '/departments',
    /** 部门详情 */
    DETAIL: (id: string) => `/departments/${id}`,
    /** 创建部门 */
    CREATE: '/departments',
    /** 更新部门 */
    UPDATE: (id: string) => `/departments/${id}`,
    /** 删除部门 */
    DELETE: (id: string) => `/departments/${id}`,
  },

  // ==================
  // 设备模块
  // ==================
  DEVICE: {
    /** 设备列表 */
    LIST: '/devices',
    /** 设备详情 */
    DETAIL: (id: string) => `/devices/${id}`,
    /** 创建设备 */
    CREATE: '/devices',
    /** 更新设备 */
    UPDATE: (id: string) => `/devices/${id}`,
    /** 删除设备 */
    DELETE: (id: string) => `/devices/${id}`,
    /** 设备二维码 */
    QR_CODE: (id: string) => `/devices/${id}/qrcode`,
    /** 设备检查清单 */
    CHECKLIST: (id: string) => `/devices/${id}/checklist`,
    /** 更新检查清单 */
    UPDATE_CHECKLIST: (id: string) => `/devices/${id}/checklist`,
  },

  DEVICE_TYPE: {
    /** 设备类型列表 */
    LIST: '/device-types',
    /** 设备类型详情 */
    DETAIL: (id: string) => `/device-types/${id}`,
  },

  DEVICE_LOCATION: {
    /** 设备位置列表 */
    LIST: '/device-locations',
    /** 设备位置详情 */
    DETAIL: (id: string) => `/device-locations/${id}`,
  },

  // ==================
  // 巡检模块
  // ==================
  INSPECTION: {
    /** 巡检任务列表 */
    TASK_LIST: '/inspection/tasks',
    /** 巡检任务详情 */
    TASK_DETAIL: (id: string) => `/inspection/tasks/${id}`,
    /** 创建巡检任务 */
    CREATE_TASK: '/inspection/tasks',
    /** 更新巡检任务 */
    UPDATE_TASK: (id: string) => `/inspection/tasks/${id}`,
    /** 巡检记录列表 */
    RECORD_LIST: '/inspection/records',
    /** 巡检记录详情 */
    RECORD_DETAIL: (id: string) => `/inspection/records/${id}`,
    /** 提交巡检记录 */
    SUBMIT_RECORD: '/inspection/records',
    /** 更新巡检记录 */
    UPDATE_RECORD: (id: string) => `/inspection/records/${id}`,
  },

  // ==================
  // 隐患模块
  // ==================
  HAZARD: {
    /** 隐患列表 */
    LIST: '/hazards',
    /** 隐患详情 */
    DETAIL: (id: string) => `/hazards/${id}`,
    /** 创建隐患 */
    CREATE: '/hazards',
    /** 更新隐患 */
    UPDATE: (id: string) => `/hazards/${id}`,
    /** 删除隐患 */
    DELETE: (id: string) => `/hazards/${id}`,
    /** 确认隐患 */
    CONFIRM: (id: string) => `/hazards/${id}/confirm`,
    /** 整改隐患 */
    RECTIFY: (id: string) => `/hazards/${id}/rectify`,
    /** 验收隐患 */
    ACCEPT: (id: string) => `/hazards/${id}/accept`,
    /** 退回隐患 */
    REJECT: (id: string) => `/hazards/${id}/reject`,
    /** 隐患流程记录 */
    FLOW_LOG: (id: string) => `/hazards/${id}/flow`,
    /** 隐患统计 */
    STATS: '/hazards/stats',
  },

  // ==================
  // 消息模块
  // ==================
  MESSAGE: {
    /** 消息列表 */
    LIST: '/messages',
    /** 消息详情 */
    DETAIL: (id: string) => `/messages/${id}`,
    /** 标记已读 */
    MARK_READ: (id: string) => `/messages/${id}/read`,
    /** 全部标记已读 */
    MARK_ALL_READ: '/messages/read-all',
    /** 未读数量 */
    UNREAD_COUNT: '/messages/unread-count',
    /** 删除消息 */
    DELETE: (id: string) => `/messages/${id}`,
  },

  // ==================
  // 报表模块
  // ==================
  REPORT: {
    /** 隐患统计 */
    HAZARD_STATS: '/reports/hazards',
    /** 巡检统计 */
    INSPECTION_STATS: '/reports/inspections',
    /** 设备统计 */
    DEVICE_STATS: '/reports/devices',
    /** 人员统计 */
    USER_STATS: '/reports/users',
    /** 趋势分析 */
    TREND: '/reports/trend',
  },

  // ==================
  // 文件上传模块
  // ==================
  FILE: {
    /** 上传图片 */
    UPLOAD_IMAGE: '/files/upload/image',
    /** 上传语音 */
    UPLOAD_VOICE: '/files/upload/voice',
    /** 上传文件 */
    UPLOAD_FILE: '/files/upload',
    /** 获取文件URL */
    GET_URL: (id: string) => `/files/${id}/url`,
    /** 删除文件 */
    DELETE: (id: string) => `/files/${id}`,
  },

  // ==================
  // AI 模块
  // ==================
  AI: {
    /** AI 对话 */
    CHAT: '/ai/chat',
    /** AI 配置 */
    CONFIG: '/ai/config',
    /** 更新 AI 配置 */
    UPDATE_CONFIG: '/ai/config',
    /** 知识库列表 */
    KNOWLEDGE_LIST: '/ai/knowledge',
    /** 添加知识库 */
    ADD_KNOWLEDGE: '/ai/knowledge',
    /** 删除知识 */
    DELETE_KNOWLEDGE: (id: string) => `/ai/knowledge/${id}`,
  },
} as const;

// ============================================
// 请求/响应类型定义
// ============================================

/** 登录请求 */
export interface LoginRequest {
  username: string;
  password: string;
}

/** 登录响应 */
export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    username: string;
    realName: string;
    avatar?: string;
    role: string;
    deptId: string;
    enterpriseId: string;
  };
}

/** 分页请求参数 */
export interface PageParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** 用户信息 */
export interface UserInfo {
  id: string;
  username: string;
  realName: string;
  avatar?: string;
  phone?: string;
  email?: string;
  role: string;
  roleName: string;
  deptId: string;
  deptName: string;
  enterpriseId: string;
  enterpriseName: string;
}

/** 设备信息 */
export interface DeviceInfo {
  id: string;
  name: string;
  deviceNo: string;
  qrCode: string;
  deviceTypeId: string;
  deviceTypeName: string;
  deviceLocationId: string;
  deviceLocationName: string;
  deptId: string;
  deptName: string;
  brand?: string;
  model?: string;
  status: 'normal' | 'warning' | 'error' | 'offline';
  createdAt: string;
  updatedAt: string;
}

/** 隐患信息 */
export interface HazardInfo {
  id: string;
  businessNo: string;
  source: 'photo' | 'inspection';
  photos: string[];
  hazardType: string;
  hazardTypeName: string;
  locationDesc?: string;
  deviceId?: string;
  deviceName?: string;
  deptId?: string;
  deptName?: string;
  description?: string;
  voiceNote?: string;
  voiceDuration?: number;
  status: number;
  statusName: string;
  userId: string;
  userName: string;
  reporterPhone?: string;
  createdAt: string;
  updatedAt: string;
  // 流程信息
  confirmedAt?: string;
  confirmedBy?: string;
  confirmedByName?: string;
  rectifiedAt?: string;
  rectifiedBy?: string;
  rectifiedByName?: string;
  rectifiedDescription?: string;
  acceptedAt?: string;
  acceptedBy?: string;
  acceptedByName?: string;
  rejectReason?: string;
}

/** 巡检任务 */
export interface InspectionTask {
  id: string;
  taskNo: string;
  taskType: number;
  taskTypeName: string;
  deviceIds: string[];
  deviceNames?: string[];
  deptId: string;
  deptName: string;
  assigneeId: string;
  assigneeName: string;
  assignerId?: string;
  assignerName?: string;
  planDate: string;
  dueDate?: string;
  status: number;
  statusName: string;
  priority: number;
  priorityName: string;
  remark?: string;
  createdAt: string;
  completedAt?: string;
}

/** 巡检记录 */
export interface InspectionRecord {
  id: string;
  recordNo: string;
  taskId?: string;
  taskNo?: string;
  deviceId: string;
  deviceName: string;
  userId: string;
  userName: string;
  checkDate: string;
  status: number;
  statusName: string;
  result?: number;
  resultName?: string;
  locationGps?: string;
  items: InspectionItemResult[];
  photos: string[];
  remark?: string;
  createdAt: string;
  submittedAt?: string;
}

/** 巡检项结果 */
export interface InspectionItemResult {
  itemId: string;
  itemName: string;
  result: string;
  resultName: string;
  isQualified: boolean;
  remark?: string;
  photo?: string;
}

/** 消息信息 */
export interface MessageInfo {
  id: string;
  type: number;
  typeName: string;
  title: string;
  content: string;
  userId: string;
  userName?: string;
  readStatus: boolean;
  readAt?: string;
  relatedId?: string;
  relatedType?: string;
  relatedTitle?: string;
  createdAt: string;
}

// ============================================
// AI 工具使用的接口描述
// ============================================

/** AI 工具接口描述 - 用于智能助手选择正确接口 */
export const AI_TOOL_DESCRIPTIONS = {
  query_devices: {
    endpoint: ApiEndpoints.DEVICE.LIST,
    method: 'GET',
    description: '查询设备列表，支持按状态、位置、类型筛选',
    params: {
      status: '设备状态: normal/warning/error/offline',
      location: '设备位置',
      deviceTypeId: '设备类型ID',
      deptId: '所属部门ID',
      keyword: '搜索关键词',
    },
  },
  query_hazards: {
    endpoint: ApiEndpoints.HAZARD.LIST,
    method: 'GET',
    description: '查询隐患列表，支持按状态、类型、时间筛选',
    params: {
      status: '隐患状态',
      hazardType: '隐患类型',
      startDate: '开始日期',
      endDate: '结束日期',
      keyword: '搜索关键词',
    },
  },
  query_inspection_tasks: {
    endpoint: ApiEndpoints.INSPECTION.TASK_LIST,
    method: 'GET',
    description: '查询巡检任务列表',
    params: {
      status: '任务状态',
      assigneeId: '执行人ID',
      startDate: '开始日期',
      endDate: '结束日期',
    },
  },
  query_messages: {
    endpoint: ApiEndpoints.MESSAGE.LIST,
    method: 'GET',
    description: '查询消息列表',
    params: {
      type: '消息类型',
      readStatus: '已读状态',
    },
  },
  create_hazard: {
    endpoint: ApiEndpoints.HAZARD.CREATE,
    method: 'POST',
    description: '创建隐患记录（上报隐患）',
    body: {
      source: '来源: photo/inspection',
      photos: '照片数组',
      hazardType: '隐患类型',
      locationDesc: '位置描述',
      deviceId: '关联设备ID',
      description: '文字描述',
      voiceNote: '语音备注URL',
    },
  },
  confirm_hazard: {
    endpoint: ApiEndpoints.HAZARD.CONFIRM,
    method: 'POST',
    description: '确认隐患（管理员操作）',
    body: {
      remark: '确认备注',
    },
  },
} as const;

export default ApiEndpoints;
