# 企业与部门管理模块设计方案

**设计日期**: 2026-03-10
**版本**: v1.0
**状态**: 已确认

---

## 一、业务背景

- **用途**: 单企业多部门管理，作为设备台账的关联档案
- **部门层级**: 二级（企业 > 部门）
- **设备关联**: 强制关联部门

---

## 二、数据模型

### 2.1 企业 (Enterprise)

```typescript
interface Enterprise {
  id: string;           // 企业ID
  name: string;        // 企业名称
  logo?: string;       // Logo URL
  contactPhone: string;// 联系电话
  address: string;     // 地址
  status: number;      // 1:正常 0:禁用
  createdAt: number;   // 创建时间
}
```

### 2.2 部门 (Department)

```typescript
interface Department {
  id: string;           // 部门ID
  enterpriseId: string; // 所属企业ID
  parentId?: string;   // 父部门ID（二级）
  name: string;        // 部门名称
  code: string;        // 部门编码
  leaderIds: string[]; // 负责人ID列表（多个）
  leaderNames: string[];// 负责人姓名列表
  sortOrder: number;   // 排序
  status: number;      // 1:正常 0:禁用
  createdAt: number;   // 创建时间
}
```

---

## 三、状态管理设计

### 3.1 useEnterpriseStore

```typescript
interface EnterpriseState {
  enterprises: Enterprise[];
  currentEnterprise: Enterprise | null;
  isLoading: boolean;

  fetchEnterprises: () => Promise<void>;
  fetchEnterpriseById: (id: string) => Promise<Enterprise | null>;
  createEnterprise: (data: Partial<Enterprise>) => Promise<Enterprise>;
  updateEnterprise: (id: string, data: Partial<Enterprise>) => Promise<void>;
  deleteEnterprise: (id: string) => Promise<void>;
}
```

### 3.2 useDepartmentStore

```typescript
interface DepartmentState {
  departments: Department[];
  departmentsByEnterprise: Map<string, Department[]>; // 按企业分组
  currentDepartment: Department | null;
  isLoading: boolean;

  fetchDepartments: (enterpriseId?: string) => Promise<void>;
  fetchDepartmentById: (id: string) => Promise<Department | null>;
  createDepartment: (data: Partial<Department>) => Promise<Department>;
  updateDepartment: (id: string, data: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  getSubDepartments: (parentId: string) => Department[];
}
```

---

## 四、页面设计

### 4.1 企业管理页面

| 页面 | 路由 | 功能 |
|------|------|------|
| EnterpriseListScreen | /enterprise | 企业列表、搜索、新增 |
| EnterpriseDetailScreen | /enterprise/:id | 详情、编辑、删除 |
| EnterpriseFormScreen | /enterprise/form | 新增/编辑表单 |

### 4.2 部门管理页面

| 页面 | 路由 | 功能 |
|------|------|------|
| DepartmentListScreen | /department | 部门列表、树形展示 |
| DepartmentDetailScreen | /department/:id | 详情、编辑、删除、成员管理 |
| DepartmentFormScreen | /department/form | 新增/编辑表单 |

---

## 五、表单字段

### 5.1 EnterpriseFormScreen

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 企业名称 |
| contactPhone | string | 是 | 联系电话 |
| address | string | 否 | 地址 |
| status | number | 否 | 状态(默认1) |

### 5.2 DepartmentFormScreen

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 部门名称 |
| code | string | 否 | 部门编码 |
| parentId | string | 否 | 上级部门 |
| enterpriseId | string | 是 | 所属企业 |
| leaderIds | string[] | 是 | 负责人列表 |
| sortOrder | number | 否 | 排序(默认0) |

---

## 六、集成设计

### 6.1 设备台账

- 创建设备时必须选择所属部门
- 设备详情显示部门信息
- 部门删除检查设备关联

### 6.2 巡检任务

- 任务可关联执行部门
- 部门负责人查看本部门任务

### 6.3 隐患管理

- 隐患可关联部门
- 部门负责人处理本部门隐患

---

## 七、技术架构

### 7.1 目录结构

```
src/features/org/
├── stores/
│   ├── enterpriseStore.ts
│   └── departmentStore.ts
├── screens/
│   ├── EnterpriseListScreen.tsx
│   ├── EnterpriseDetailScreen.tsx
│   ├── EnterpriseFormScreen.tsx
│   ├── DepartmentListScreen.tsx
│   ├── DepartmentDetailScreen.tsx
│   └── DepartmentFormScreen.tsx
└── types/
    └── index.ts
```

### 7.2 数据库表

- 使用现有 `enterprises` 表
- 使用现有 `departments` 表
- 无需新增表

---

## 八、设计确认

- [x] 数据模型已确认
- [x] Store结构已确认
- [x] 页面结构已确认
- [x] 分离Store已确认
- [x] 部门多负责人已确认
- [x] 设备强制关联部门已确认
