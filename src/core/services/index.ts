// Core Services - 核心服务导出

// 消息服务
export { messageService, MessageType, MessageStatus } from './messageService';
export type { Message, PushPayload, NavigationConfig } from './messageService';

// 权限服务
export { permissionService } from './permissionService';
export type { PermissionContext, PermissionResult } from './permissionService';
export { PREDEFINED_PERMISSIONS, ROLE_PERMISSIONS } from './permissionService';
export type { RoleType, Permission, RolePermissions } from './permissionService';

// 局域网通讯服务
export { lanService } from './lanService';
export type { LANDevice, LANMessage, TaskAssignRequest, ConflictInfo, LANServiceStatus } from './lanService';
export { LANMessageType } from './lanService';
