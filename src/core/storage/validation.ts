// Data Validation Schemas
// 基于 Zod 的数据验证规则

import { z } from 'zod';

// ============================================
// 基础类型验证
// ============================================

/** ID 验证 */
export const idSchema = z.string().min(1, 'ID不能为空');

/** 时间戳验证 */
export const timestampSchema = z.number().int().positive();

/** 分页参数验证 */
export const pageParamsSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(20),
  keyword: z.string().optional(),
});

// ============================================
// 用户模块验证
// ============================================

/** 用户信息验证 */
export const userSchema = z.object({
  id: idSchema,
  username: z.string().min(1, '用户名不能为空').max(50),
  realName: z.string().optional(),
  avatar: z.string().url().optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').optional(),
  email: z.string().email('邮箱格式不正确').optional(),
  role: z.enum(['user', 'inspector', 'leader', 'admin']),
  roleName: z.string().optional(),
  deptId: z.string().optional(),
  deptName: z.string().optional(),
  enterpriseId: z.string().optional(),
  enterpriseName: z.string().optional(),
  status: z.number().int().min(0).max(2).optional().default(1),
});

/** 登录请求验证 */
export const loginRequestSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

// ============================================
// 设备模块验证
// ============================================

/** 设备信息验证 */
export const deviceSchema = z.object({
  id: idSchema,
  name: z.string().min(1, '设备名称不能为空').max(100),
  qrCode: z.string().optional(),
  typeId: idSchema,
  typeName: z.string().optional(),
  locationId: idSchema,
  locationName: z.string().optional(),
  deptId: z.string().optional(),
  deptName: z.string().optional(),
  brand: z.string().max(50).optional(),
  model: z.string().max(50).optional(),
  serialNo: z.string().max(50).optional(),
  purchaseDate: z.string().optional(),
  installDate: z.string().optional(),
  responsibleId: z.string().optional(),
  responsibleName: z.string().optional(),
  status: z.enum(['normal', 'warning', 'error', 'offline']).optional().default('normal'),
});

/** 设备类型验证 */
export const deviceTypeSchema = z.object({
  id: idSchema,
  name: z.string().min(1, '类型名称不能为空').max(100),
  code: z.string().max(50).optional(),
  icon: z.string().optional(),
  description: z.string().max(255).optional(),
});

/** 设备位置验证 */
export const deviceLocationSchema = z.object({
  id: idSchema,
  name: z.string().min(1, '位置名称不能为空').max(100),
  code: z.string().max(50).optional(),
  parentId: z.string().optional(),
  building: z.string().max(50).optional(),
  floor: z.string().max(20).optional(),
  area: z.string().max(50).optional(),
});

/** 检查项验证 */
export const checklistItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.enum(['choice', 'text']),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  unit: z.string().optional(),
  threshold: z.string().optional(),
});

/** 检查模板验证 */
export const checklistTemplateSchema = z.object({
  id: idSchema,
  deviceId: idSchema,
  name: z.string().min(1, '模板名称不能为空').max(100),
  items: z.array(checklistItemSchema).min(1, '至少需要一个检查项'),
});

// ============================================
// 巡检模块验证
// ============================================

/** 巡检任务验证 */
export const inspectionTaskSchema = z.object({
  id: idSchema,
  taskNo: z.string().optional(),
  taskType: z.number().int().min(1).max(2),
  deviceIds: z.array(z.string()),
  deviceNames: z.array(z.string()).optional(),
  deptId: z.string().optional(),
  deptName: z.string().optional(),
  assigneeId: idSchema,
  assigneeName: z.string().optional(),
  assignerId: z.string().optional(),
  assignerName: z.string().optional(),
  planDate: z.string(),
  dueDate: z.string().optional(),
  status: z.number().int().min(0).max(3).optional().default(0),
  priority: z.number().int().min(1).max(3).optional().default(1),
  remark: z.string().max(500).optional(),
});

/** 巡检项结果验证 */
export const inspectionItemResultSchema = z.object({
  itemId: z.string(),
  itemName: z.string(),
  result: z.string(),
  isQualified: z.boolean(),
  remark: z.string().optional(),
  photo: z.string().optional(),
});

/** 巡检记录验证 */
export const inspectionRecordSchema = z.object({
  id: idSchema,
  recordNo: z.string().optional(),
  taskId: z.string().optional(),
  taskNo: z.string().optional(),
  deviceId: idSchema,
  deviceName: z.string().optional(),
  userId: idSchema,
  userName: z.string().optional(),
  checkDate: z.number().int().positive(),
  status: z.number().int().min(0).max(2).optional().default(0),
  result: z.number().int().min(1).max(3).optional(),
  locationGps: z.string().optional(),
  items: z.array(inspectionItemResultSchema),
  photos: z.array(z.string().url()).optional(),
  remark: z.string().max(500).optional(),
});

// ============================================
// 隐患模块验证
// ============================================

/** 隐患记录验证 */
export const hazardSchema = z.object({
  id: idSchema,
  businessId: z.string().optional(),
  businessNo: z.string().optional(),
  source: z.enum([1, 2]).or(z.enum(['photo', 'inspection'])),
  photos: z.array(z.string().url()).optional().default([]),
  hazardType: z.string().min(1, '隐患类型不能为空'),
  hazardTypeName: z.string().optional(),
  locationDesc: z.string().max(255).optional(),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
  deptId: z.string().optional(),
  deptName: z.string().optional(),
  description: z.string().max(2000).optional(),
  voiceNote: z.string().url().optional(),
  voiceDuration: z.number().int().positive().optional(),
  status: z.number().int().min(0).max(8).optional().default(0),
  userId: idSchema,
  userName: z.string().optional(),
  reporterPhone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').optional(),
  gpsLocation: z.string().optional(),
});

/** 隐患流程记录验证 */
export const hazardFlowSchema = z.object({
  id: idSchema,
  hazardId: idSchema,
  fromStatus: z.number().int().min(0).max(8),
  toStatus: z.number().int().min(0).max(8),
  operatorId: idSchema,
  operatorName: z.string().optional(),
  actionType: z.number().int().min(1).max(5),
  remark: z.string().max(1000).optional(),
  voiceNote: z.string().url().optional(),
});

// ============================================
// 消息模块验证
// ============================================

/** 消息验证 */
export const messageSchema = z.object({
  id: idSchema,
  type: z.number().int().min(1).max(4),
  typeName: z.string().optional(),
  title: z.string().min(1, '消息标题不能为空').max(100),
  content: z.string().max(5000).optional(),
  userId: idSchema,
  userName: z.string().optional(),
  readStatus: z.boolean().optional().default(false),
  readAt: z.number().int().positive().optional(),
  relatedId: z.string().optional(),
  relatedType: z.string().optional(),
  relatedTitle: z.string().optional(),
});

// ============================================
// 部门企业验证
// ============================================

/** 企业验证 */
export const enterpriseSchema = z.object({
  id: idSchema,
  name: z.string().min(1, '企业名称不能为空').max(100),
  logo: z.string().url().optional(),
  contactPhone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').optional(),
  address: z.string().max(255).optional(),
  status: z.number().int().min(0).max(1).optional().default(1),
});

/** 部门验证 */
export const departmentSchema = z.object({
  id: idSchema,
  enterpriseId: idSchema,
  parentId: z.string().optional(),
  name: z.string().min(1, '部门名称不能为空').max(100),
  code: z.string().max(50).optional(),
  leaderId: z.string().optional(),
  sortOrder: z.number().int().optional().default(0),
  status: z.number().int().min(0).max(1).optional().default(1),
});

// ============================================
// 验证工具函数
// ============================================

/** 验证数据并返回结果 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: z.ZodError['errors'];
} {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    return { success: false, errors: [{ message: '未知验证错误', path: [] }] };
  }
}

/** 安全解析数据 (不抛出异常) */
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): T | undefined {
  try {
    return schema.parse(data);
  } catch {
    return undefined;
  }
}

/** 创建部分验证 schema (用于更新) */
export function createPartialSchema<T extends z.ZodTypeAny>(schema: T): z.ZodOptional<T> {
  return schema.optional();
}

export default {
  idSchema,
  timestampSchema,
  pageParamsSchema,
  userSchema,
  loginRequestSchema,
  deviceSchema,
  deviceTypeSchema,
  deviceLocationSchema,
  checklistTemplateSchema,
  inspectionTaskSchema,
  inspectionRecordSchema,
  hazardSchema,
  hazardFlowSchema,
  messageSchema,
  enterpriseSchema,
  departmentSchema,
  validate,
  safeParse,
};
