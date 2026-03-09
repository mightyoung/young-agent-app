// Permission Service - 权限服务
// 功能权限 + 数据权限管理

import { mmkvStorage } from '../storage/mmkv';

// ============================================
// 类型定义
// ============================================

/** 角色类型 */
export type RoleType = 'user' | 'inspector' | 'leader' | 'admin';

/** 功能权限 */
export interface Permission {
  /** 权限编码 */
  code: string;
  /** 权限名称 */
  name: string;
  /** 权限描述 */
  description?: string;
  /** 是否启用 */
  enabled: boolean;
}

/** 角色权限配置 */
export interface RolePermissions {
  /** 角色编码 */
  role: RoleType;
  /** 角色名称 */
  name: string;
  /** 功能权限列表 */
  permissions: string[];
  /** 数据权限范围 */
  dataScope: 'self' | 'dept' | 'dept_and_child' | 'all';
}

/** 用户权限上下文 */
export interface PermissionContext {
  /** 用户ID */
  userId: string;
  /** 角色 */
  role: RoleType;
  /** 部门ID */
  deptId: string;
  /** 部门名称 */
  deptName?: string;
  /** 企业ID */
  enterpriseId: string;
  /** 权限列表 */
  permissions: string[];
  /** 数据权限范围 */
  dataScope: 'self' | 'dept' | 'dept_and_child' | 'all';
}

/** 权限验证结果 */
export interface PermissionResult {
  /** 是否有权限 */
  allowed: boolean;
  /** 拒绝原因 */
  reason?: string;
}

// ============================================
// 权限配置
// ============================================

/** 预定义权限列表 */
export const PREDEFINED_PERMISSIONS: Permission[] = [
  // 隐患相关
  { code: 'hazard:report', name: '上报隐患', description: '可以上报隐患记录', enabled: true },
  { code: 'hazard:view', name: '查看隐患', description: '可以查看隐患列表', enabled: true },
  { code: 'hazard:confirm', name: '确认隐患', description: '可以确认隐患', enabled: true },
  { code: 'hazard:rectify', name: '整改隐患', description: '可以执行整改', enabled: true },
  { code: 'hazard:accept', name: '验收隐患', description: '可以验收整改结果', enabled: true },
  { code: 'hazard:reject', name: '退回隐患', description: '可以退回隐患', enabled: true },
  { code: 'hazard:delete', name: '删除隐患', description: '可以删除隐患记录', enabled: true },

  // 巡检相关
  { code: 'inspection:view', name: '查看巡检', description: '可以查看巡检任务', enabled: true },
  { code: 'inspection:execute', name: '执行巡检', description: '可以执行巡检任务', enabled: true },
  { code: 'inspection:assign', name: '分配任务', description: '可以分配巡检任务', enabled: true },
  { code: 'inspection:template', name: '管理模板', description: '可以管理检查模板', enabled: true },

  // 设备相关
  { code: 'device:view', name: '查看设备', description: '可以查看设备列表', enabled: true },
  { code: 'device:manage', name: '管理设备', description: '可以管理设备台账', enabled: true },
  { code: 'device:qrcode', name: '二维码管理', description: '可以管理设备二维码', enabled: true },

  // 消息相关
  { code: 'message:view', name: '查看消息', description: '可以查看消息列表', enabled: true },
  { code: 'message:manage', name: '管理消息', description: '可以管理消息', enabled: true },

  // 用户相关
  { code: 'user:view', name: '查看用户', description: '可以查看用户列表', enabled: true },
  { code: 'user:manage', name: '管理用户', description: '可以管理用户', enabled: true },

  // 报表相关
  { code: 'report:view', name: '查看报表', description: '可以查看统计报表', enabled: true },
  { code: 'report:export', name: '导出报表', description: '可以导出报表数据', enabled: true },

  // 系统相关
  { code: 'system:config', name: '系统配置', description: '可以进行系统配置', enabled: true },
  { code: 'system:log', name: '查看日志', description: '可以查看系统日志', enabled: true },
];

/** 预定义角色权限 */
export const ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'user',
    name: '普通用户',
    permissions: [
      'hazard:report',
      'hazard:view',
      'device:view',
      'message:view',
    ],
    dataScope: 'self',
  },
  {
    role: 'inspector',
    name: '巡检人员',
    permissions: [
      'hazard:report',
      'hazard:view',
      'inspection:view',
      'inspection:execute',
      'device:view',
      'message:view',
    ],
    dataScope: 'self',
  },
  {
    role: 'leader',
    name: '组长',
    permissions: [
      'hazard:report',
      'hazard:view',
      'hazard:confirm',
      'hazard:rectify',
      'inspection:view',
      'inspection:execute',
      'inspection:assign',
      'device:view',
      'device:manage',
      'message:view',
      'message:manage',
      'report:view',
    ],
    dataScope: 'dept_and_child',
  },
  {
    role: 'admin',
    name: '管理员',
    permissions: PREDEFINED_PERMISSIONS.map((p) => p.code),
    dataScope: 'all',
  },
];

// ============================================
// 权限服务
// ============================================

class PermissionService {
  private currentContext: PermissionContext | null = null;
  private customPermissions: Map<string, RolePermissions[]> = new Map();

  /** 初始化权限服务 */
  initialize(): void {
    console.log('[PermissionService] 初始化完成');
  }

  /** 设置当前用户权限上下文 */
  setContext(context: PermissionContext): void {
    this.currentContext = context;
    // 缓存到本地存储
    mmkvStorage.setString('permission_context', JSON.stringify(context));
    console.log('[PermissionService] 设置权限上下文', context.role);
  }

  /** 从缓存恢复权限上下文 */
  restoreContext(): boolean {
    const saved = mmkvStorage.getString('permission_context');
    if (saved) {
      try {
        this.currentContext = JSON.parse(saved);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  /** 清除权限上下文 */
  clearContext(): void {
    this.currentContext = null;
    mmkvStorage.delete('permission_context');
  }

  /** 获取当前权限上下文 */
  getContext(): PermissionContext | null {
    return this.currentContext;
  }

  /** 检查是否有指定权限 */
  hasPermission(permissionCode: string): boolean {
    if (!this.currentContext) {
      console.warn('[PermissionService] 未设置权限上下文');
      return false;
    }

    // 管理员拥有所有权限
    if (this.currentContext.role === 'admin') {
      return true;
    }

    return this.currentContext.permissions.includes(permissionCode);
  }

  /** 验证权限 (返回详细结果) */
  checkPermission(permissionCode: string): PermissionResult {
    if (!this.currentContext) {
      return { allowed: false, reason: '未登录' };
    }

    if (this.hasPermission(permissionCode)) {
      return { allowed: true };
    }

    const perm = PREDEFINED_PERMISSIONS.find((p) => p.code === permissionCode);
    return {
      allowed: false,
      reason: `缺少权限: ${perm?.name || permissionCode}`,
    };
  }

  /** 批量检查权限 */
  hasAnyPermission(permissionCodes: string[]): boolean {
    return permissionCodes.some((code) => this.hasPermission(code));
  }

  /** 检查是否拥有所有权限 */
  hasAllPermissions(permissionCodes: string[]): boolean {
    return permissionCodes.every((code) => this.hasPermission(code));
  }

  /** 检查数据权限 */
  canAccessData(dataDeptId: string): boolean {
    if (!this.currentContext) {
      return false;
    }

    // 管理员可以访问所有数据
    if (this.currentContext.role === 'admin') {
      return true;
    }

    // 根据数据范围判断
    switch (this.currentContext.dataScope) {
      case 'self':
        // 只能访问自己的数据
        // 需要在查询时额外过滤 userId
        return true;

      case 'dept':
        // 可以访问本部门数据
        return dataDeptId === this.currentContext.deptId;

      case 'dept_and_child':
        // 可以访问本部门及子部门数据
        // 需要在查询时额外过滤 deptId 树
        return true;

      case 'all':
        // 可以访问所有数据
        return true;

      default:
        return false;
    }
  }

  /** 获取数据权限过滤条件 */
  getDataScopeFilter(): {
    userId?: string;
    deptId?: string;
    includeChildDepts?: boolean;
  } {
    if (!this.currentContext) {
      return {};
    }

    switch (this.currentContext.dataScope) {
      case 'self':
        return { userId: this.currentContext.userId };

      case 'dept':
        return { deptId: this.currentContext.deptId };

      case 'dept_and_child':
        return { deptId: this.currentContext.deptId, includeChildDepts: true };

      case 'all':
      default:
        return {};
    }
  }

  /** 获取角色权限配置 */
  getRolePermissions(role: RoleType): RolePermissions | undefined {
    // 先检查自定义配置
    const customConfigs = this.customPermissions.get(role);
    if (customConfigs && customConfigs.length > 0) {
      return customConfigs[0];
    }

    // 使用预定义配置
    return ROLE_PERMISSIONS.find((r) => r.role === role);
  }

  /** 设置自定义权限配置 (供管理员使用) */
  setCustomPermissions(role: RoleType, permissions: RolePermissions[]): void {
    this.customPermissions.set(role, permissions);
    // TODO: 保存到服务端
    console.log('[PermissionService] 设置自定义权限', role);
  }

  /** 获取用户可访问的部门ID列表 */
  getAccessibleDeptIds(): string[] {
    if (!this.currentContext) {
      return [];
    }

    switch (this.currentContext.dataScope) {
      case 'self':
        return [];
      case 'dept':
        return [this.currentContext.deptId];
      case 'dept_and_child':
        // TODO: 查询子部门
        return [this.currentContext.deptId];
      case 'all':
      default:
        return [];
    }
  }

  /** 获取当前用户角色 */
  getCurrentRole(): RoleType | null {
    return this.currentContext?.role || null;
  }

  /** 判断是否管理员 */
  isAdmin(): boolean {
    return this.currentContext?.role === 'admin';
  }

  /** 判断是否组长或以上 */
  isLeaderOrAbove(): boolean {
    return (
      this.currentContext?.role === 'leader' ||
      this.currentContext?.role === 'admin'
    );
  }
}

// ============================================
// 导出单例
// ============================================

export const permissionService = new PermissionService();
export default permissionService;

// 导出类型
export type { PermissionContext, PermissionResult };
