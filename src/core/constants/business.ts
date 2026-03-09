// 业务ID生成规则
// 格式：{时间戳精确到毫秒}{用户ID(数字)}{业务台账ID(3位数字)}{数据主键ID}
// 例如：1741161000123000001 (1741161000 + 123 + 000 + 001)

// 业务台账类型枚举
export enum EntityType {
  HAZARD = '000',        // 隐患
  SCAN_CHECK = '001',    // 扫码检查
  ANNOUNCEMENT = '002',  // 公告
  USER = '003',          // 用户
  DEPARTMENT = '004',     // 部门
  MESSAGE = '005',       // 消息 (注意：用户要求005)
  DEVICE = '006',        // 设备
  LOCATION = '007',      // 地点
  INSPECTION = '008',    // 巡检 (用户提到巡检是008)
  // 预留更多类型
  TASK = '009',          // 任务
  CHECKLIST = '010',     // 检查模板
  ENTERPRISE = '011',   // 企业
  ROLE = '012',          // 角色
  DEVICE_TYPE = '013',   // 设备类型
}

// 业务台账类型配置
export const entityTypeConfig: Record<string, {
  code: string;
  name: string;
  prefix: string;
}> = {
  hazard: { code: '000', name: '隐患', prefix: 'HZ' },
  scan_check: { code: '001', name: '扫码检查', prefix: 'SC' },
  announcement: { code: '002', name: '公告', prefix: 'AN' },
  user: { code: '003', name: '用户', prefix: 'US' },
  department: { code: '004', name: '部门', prefix: 'DP' },
  message: { code: '005', name: '消息', prefix: 'MG' },
  device: { code: '006', name: '设备', prefix: 'DV' },
  location: { code: '007', name: '地点', prefix: 'LC' },
  inspection: { code: '008', name: '巡检', prefix: 'IN' },
  task: { code: '009', name: '任务', prefix: 'TK' },
  checklist: { code: '010', name: '检查模板', prefix: 'CL' },
  enterprise: { code: '011', name: '企业', prefix: 'EN' },
  role: { code: '012', name: '角色', prefix: 'RL' },
  device_type: { code: '013', name: '设备类型', prefix: 'DT' },
};

// 隐患状态配置
export const hazardStatusConfig = {
  // 状态 -> 标签显示和颜色
  statusLabels: {
    draft: { text: '待提交', color: '#8C8C8C', step: 0 },
    submitted: { text: '待确认', color: '#007AFF', step: 1 },
    confirmed: { text: '待整改', color: '#FF3B30', step: 2 },
    rectifying: { text: '待验收', color: '#FF9500', step: 3 },
    accepted: { text: '已验收', color: '#34C759', step: 4 },
    rejected: { text: '已退回', color: '#FF3B30', step: -1 },
  },
  // 审批流节点
  flowSteps: [
    { key: 'submitted', label: '提交' },
    { key: 'confirmed', label: '确认' },
    { key: 'rectifying', label: '整改' },
    { key: 'accepted', label: '验收' },
  ],
  // 筛选用步骤
  filterSteps: [
    { key: 'submitted', label: '待确认' },
    { key: 'confirmed', label: '待整改' },
    { key: 'rectifying', label: '待验收' },
    { key: 'accepted', label: '已验收' },
  ],
  // 获取当前审批流步骤索引
  getFlowStepIndex: (status: string): number => {
    switch (status) {
      case 'submitted': return 1;
      case 'confirmed': return 2;
      case 'rectifying': return 3;
      case 'accepted': return 4;
      default: return -1;
    }
  },
};

// 巡检状态配置
export const inspectionStatusConfig = {
  statusLabels: {
    draft: { text: '草稿', color: '#8C8C8C' },
    pending: { text: '待执行', color: '#007AFF' },
    in_progress: { text: '进行中', color: '#FF9500' },
    completed: { text: '已完成', color: '#34C759' },
    cancelled: { text: '已取消', color: '#FF3B30' },
  },
};

// 消息状态配置
export const messageStatusConfig = {
  statusLabels: {
    unread: { text: '未读', color: '#007AFF' },
    read: { text: '已读', color: '#8C8C8C' },
  },
};

// 设备状态配置
export const deviceStatusConfig = {
  statusLabels: {
    normal: { text: '正常', color: '#34C759' },
    warning: { text: '警告', color: '#FF9500' },
    error: { text: '故障', color: '#FF3B30' },
    offline: { text: '离线', color: '#8C8C8C' },
  },
};

// 用户角色配置
export const roleConfig = {
  roleLabels: {
    user: { text: '普通用户', code: 1 },
    inspector: { text: '检查员', code: 2 },
    leader: { text: '负责人', code: 3 },
    admin: { text: '管理员', code: 0 },
  },
  // 获取用户ID的数字表示（admin为0，其他按顺序）
  getUserCode: (role: string): number => {
    const roleCodes: Record<string, number> = {
      admin: 0,
      leader: 1,
      inspector: 2,
      user: 3,
    };
    return roleCodes[role] ?? 99;
  },
};

// 生成业务ID
// @param entityType 业务台账类型代码（如 '000'）
// @param userId 用户ID（数字）
// @param primaryId 数据主键ID
export function generateBusinessId(
  entityType: string,
  userId: number,
  primaryId: string
): string {
  const timestamp = Date.now().toString(); // 精确到毫秒
  const userIdStr = userId.toString().padStart(3, '0'); // 用户ID转3位数字
  const entityTypeStr = entityType.padStart(3, '0'); // 业务台账ID

  // 将主键ID转为数字或截取
  const primaryIdNum = parseInt(primaryId.replace(/[^0-9]/g, '').slice(-6), 10) || 1;
  const primaryIdStr = primaryIdNum.toString().padStart(6, '0'); // 主键ID转6位数字

  return `${timestamp}${userIdStr}${entityTypeStr}${primaryIdStr}`;
}

// 简化版本：生成业务编号（人类可读）
// @param entityType 实体类型（如 'hazard'）
// @param id 数据主键
export function generateBusinessNo(
  entityType: string,
  id: string
): string {
  const config = entityTypeConfig[entityType];
  if (!config) return id;

  const timestamp = Date.now().toString().slice(-8); // 8位时间戳
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); // 4位随机数确保唯一性

  return `${config.prefix}${timestamp}${random}`;
}
