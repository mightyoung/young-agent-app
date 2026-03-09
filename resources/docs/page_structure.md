# 页面结构规划

## 1. 页面清单

根据原型设计，整理出以下页面：

### 1.1 认证相关
| 页面 | 路径 | 说明 |
|-----|------|------|
| 启动页 | /splash | 引导页，选择入口 |
| 登录页 | /login | 账号密码登录 |
| 绑定企业 | /bind-enterprise | 首次登录绑定企业与部门 |

### 1.2 相机入口
| 页面 | 路径 | 说明 |
|-----|------|------|
| 相机入口 | /camera | 三条业务流程入口 |
| 扫码检查 | /scan-check | 扫描二维码后检查 |
| 隐患随手拍 | /hazard-report | 拍照上报隐患 |
| 安全检查 | /safety-check | 选择任务执行检查 |

### 1.3 巡检流程
| 页面 | 路径 | 说明 |
|-----|------|------|
| 检查任务列表 | /tasks | 检查任务列表 |
| 检查详情 | /inspection/:id | 单次检查详情 |
| 检查历史 | /inspection-history | 检查记录列表 |
| 提交结果 | /inspection-result | 检查提交成功 |

### 1.4 隐患流程
| 页面 | 路径 | 说明 |
|-----|------|------|
| 隐患列表 | /hazards | 隐患记录列表 |
| 隐患详情 | /hazard/:id | 隐患详情 |
| 隐患确认 | /hazard/:id/confirm | 隐患确认(管理员) |
| 隐患整改 | /hazard/:id/rectify | 隐患整改 |
| 隐患验收 | /hazard/:id/accept | 隐患验收 |
| 上报反馈 | /hazard-result | 隐患提交成功 |

### 1.5 设备管理
| 页面 | 路径 | 说明 |
|-----|------|------|
| 设备列表 | /devices | 设备台账列表 |
| 设备详情 | /device/:id | 设备详情 |
| 设备检查清单 | /device/:id/checklist | 检查清单配置(管理员) |

### 1.6 AI助手
| 页面 | 路径 | 说明 |
|-----|------|------|
| AI助手 | /ai | AI对话主页面 |
| AI初始化 | /ai-setup | 首次使用初始化 |
| 台账查询 | /ai/device-query | 设备查询 |
| 个人中心(AI子页) | /ai/profile | 个人中心 |

### 1.7 消息中心
| 页面 | 路径 | 说明 |
|-----|------|------|
| 消息列表 | /messages | 消息通知列表 |
| 隐患审核入口 | /messages/hazard-review | 审核入口 |
| 任务分配入口 | /messages/task-assign | 任务分配入口 |

### 1.8 个人中心
| 页面 | 路径 | 说明 |
|-----|------|------|
| 个人中心 | /profile | 我的台账、任务等 |
| 我的台账 | /profile/devices | 我的设备 |
| 我的任务 | /profile/tasks | 我的任务 |
| 我的隐患 | /profile/hazards | 我的隐患记录 |
| 设置 | /settings | 应用设置 |
| AI设置 | /settings/ai | AI助手配置 |
| 后台配置 | /settings/backend | 云端服务配置 |

### 1.9 管理功能(管理员)
| 页面 | 路径 | 说明 |
|-----|------|------|
| 用户管理 | /admin/users | 用户列表/管理 |
| 设备管理 | /admin/devices | 设备管理 |
| 报表中心 | /admin/reports | 数据统计报表 |

---

## 2. 导航结构

### 2.1 底部Tab导航

```
┌─────────┬─────────┐
│   首页   │  AI助手  │
│ (相机入口) │          │
└─────────┴─────────┘

Tab 1: 首页/相机入口 (/camera) - 无底部菜单
  └── 扫描二维码 → 扫码检查
  └── 拍照 → 隐患随手拍
  └── 检查按钮 → 安全检查
  └── 右上角铃铛 → 消息中心

Tab 2: AI助手 (/ai) - 有底部菜单
  ├── AI助手页面
  ├── 数据中心页面
  └── 个人中心页面
```

### 2.2 完整导航树

```
├── 启动页 (/splash)
├── 登录 (/login)
├── 绑定企业 (/bind-enterprise)
│
├── Tab 1: 首页/相机入口 (无底部菜单)
│   ├── 相机入口 (/camera)
│   │   ├── 扫码检查 (/scan-check)
│   │   │   └── 检查详情 (/inspection/:id)
│   │   ├── 隐患随手拍 (/hazard-report)
│   │   │   └── 上报反馈 (/hazard-result)
│   │   └── 安全检查 (/safety-check)
│   │       └── 提交结果 (/inspection-result)
│   │
│   ├── 检查历史 (/inspection-history)
│   │   └── 检查详情 (/inspection/:id)
│   │
│   ├── 隐患列表 (/hazards)
│   │   └── 隐患详情 (/hazard/:id)
│   │
│   └── 消息中心 (/messages) ← 右上角铃铛图标进入
│       ├── 隐患审核 (/messages/hazard-review)
│       └── 任务分配 (/messages/task-assign)
│
└── Tab 2: AI助手 (有底部菜单)
    │
    ├── AI助手 (/ai)
    │   ├── 热门功能卡片 (顶部)
    │   ├── 对话区域
    │   ├── 快捷输入建议
    │   └── 右上角铃铛 → 消息中心
    │
    ├── 数据中心 (/ai/data-center)
    │   ├── 设备列表
    │   └── 设备详情
    │
    └── 个人中心 (/ai/profile)
        ├── 我的台账
        ├── 我的任务
        ├── 我的隐患
        └── 设置
            ├── AI设置
            └── 后台配置
```

---

## 3. 权限与页面可见性

### 3.1 角色与页面可见性

| 页面 | 普通用户 | 巡检人员 | 组长 | 管理员 |
|-----|:--------:|:--------:|:----:|:------:|
| 随手拍 | ✓ | ✓ | ✓ | ✓ |
| 扫码检查 | - | ✓ | ✓ | ✓ |
| 安全检查 | - | ✓ | ✓ | ✓ |
| 检查历史 | - | ✓ | ✓ | ✓ |
| 隐患列表 | ✓ | ✓ | ✓ | ✓ |
| 设备列表 | - | ✓ | ✓ | ✓ |
| AI助手 | ✓ | ✓ | ✓ | ✓ |
| 消息中心 | ✓ | ✓ | ✓ | ✓ |
| 个人中心 | ✓ | ✓ | ✓ | ✓ |
| 用户管理 | - | - | - | ✓ |
| 设备管理 | - | - | ✓ | ✓ |
| 报表中心 | - | - | ✓ | ✓ |
| 检查清单配置 | - | - | ✓ | ✓ |

---

## 4. 页面跳转关系

### 4.1 核心流程跳转

```
┌──────────────────────────────────────────────────────────────┐
│                    随手拍流程                                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  相机入口 ──拍照──▶ 隐患随手拍 ──提交──▶ 上报反馈            │
│                        │                         │             │
│                        ▼                         ▼             │
│                   选择类型/地点        查看详情 ──确认         │
│                        │                         │             │
│                        ▼                         ▼             │
│                   文字/语音描述        整改 ──验收            │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    巡检流程                                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  相机入口 ──扫码──▶ 扫码检查 ──提交──▶ 提交结果            │
│     │                  │                         │             │
│     │                  ▼                         ▼             │
│     │            选择检查项              查看报告             │
│     │                  │                         │             │
│     ▼                  ▼                         ▼             │
│  安全检查 ──选择任务──▶ 逐项检查 ──提交──▶ 完成            │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    AI助手流程                                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Tab入口 ──首次──▶ AI初始化 ──▶ AI对话                      │
│     │                  │              │                        │
│     │                  ▼              ▼                        │
│     │            选择Provider    返回结果/页面跳转             │
│     │                  │              │                        │
│     ▼                  ▼              ▼                        │
│  对话/台账查询/个人中心  保存配置                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. 技术实现

### 5.1 路由配置

```typescript
// React Navigation 路由配置
export type RootStackParamList = {
  // 认证
  Splash: undefined;
  Login: undefined;
  BindEnterprise: undefined;

  // 主Tab
  Main: undefined;

  // 相机入口流程
  Camera: undefined;
  ScanCheck: { deviceId: string };
  HazardReport: undefined;
  HazardResult: { hazardId: string };
  SafetyCheck: { taskId?: string };
  InspectionResult: { recordId: string };

  // 巡检流程
  InspectionHistory: undefined;
  InspectionDetail: { id: string };

  // 隐患流程
  HazardList: undefined;
  HazardDetail: { id: string };
  HazardConfirm: { id: string };
  HazardRectify: { id: string };
  HazardAccept: { id: string };

  // 设备流程
  DeviceList: undefined;
  DeviceDetail: { id: string };
  DeviceChecklist: { deviceId: string };

  // AI流程
  AIAssistant: undefined;
  AISetup: undefined;
  AIDataCenter: undefined;
  AIProfile: undefined;

  // 消息中心
  Messages: undefined;
  HazardReview: undefined;
  TaskAssign: undefined;

  // 个人中心
  Profile: undefined;
  ProfileDevices: undefined;
  ProfileTasks: undefined;
  ProfileHazards: undefined;
  Settings: undefined;
  AISettings: undefined;
  BackendSettings: undefined;

  // 管理功能
  AdminUsers: undefined;
  AdminDevices: undefined;
  AdminReports: undefined;
};

export type TabParamList = {
  Home: undefined;
  AI: undefined;
};
```

注意：AI Tab内部包含3个子页面：
- AI助手 (/ai)
- 数据中心 (/ai/data-center)
- 个人中心 (/ai/profile)

---

*文档版本：v1.0*
*最后更新：2026-03-04*
