# 系统架构设计文档

> **引用说明**：
> - React Native官方文档：[React Native](https://reactnative.dev/)
> - Zustand状态管理：[Zustand](https://github.com/pmndrs/zustand)
> - React Navigation路由：[React Navigation](https://github.com/react-navigation/react-navigation)
> - SQLite移动端：[expo-sqlite](https://github.com/expo/expo-sqlite), [react-native-sqlite-storage](https://github.com/andreialecu/react-native-sqlite-storage)
> - MMKV键值存储：[react-native-mmkv](https://github.com/mrousavy/react-native-mmkv)
> - 动画库：[react-native-reanimated](https://github.com/software-mansion/react-native-reanimated)
> - 表单处理：[React Hook Form](https://github.com/react-hook-form/react-hook-form)
> - 图片选择：[react-native-image-picker](https://github.com/react-native-image-picker/react-native-image-picker)
> - 二维码扫描：[react-native-camera-kit](https://github.com/mrousavy/react-native-camera-kit)

---

### 1.1 前端技术栈

| 技术 | 选择 | 说明 |
|-----|------|------|
| 移动开发框架 | React Native | 原生性能好，社区成熟 |
| 语言 | TypeScript | 类型安全，IDE支持好 |
| 状态管理 | Zustand | 轻量、简单、响应式 |
| 路由 | React Navigation | RN官方推荐路由方案 |
| UI组件 | 自定义 + react-native-paper | Material Design组件库 |
| 本地存储 | SQLite + MMKV | 结构化数据 + 轻量配置 |
| HTTP请求 | Axios | 统一请求封装 |
| 表单 | React Hook Form | 性能好，易于验证 |
| 图片处理 | react-native-image-picker | 拍照/相册选择 |
| 语音 | react-native-audio-recorder-player | 录音功能 |
| 二维码 | react-native-camera-kit | 扫码识别 |
| 动画 | react-native-reanimated | 高性能动画 |

### 1.2 开发工具链

| 工具 | 用途 |
|-----|------|
| VS Code | 开发IDE |
| Prettier | 代码格式化 |
| ESLint | 代码检查 |
| Jest | 单元测试 |
| React Native Debugger | 调试工具 |

---

## 2. 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        应用层 (UI Layer)                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ 启动页  │ │ 相机入口 │ │ 扫码检查 │ │ 隐患上报 │ │ AI助手  │  │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘  │
│       │            │            │            │            │        │
│  ┌────┴────────────┴────────────┴────────────┴────────────┴────┐ │
│  │                    页面组件层 (Pages)                        │ │
│  │  Home / Camera / Inspection / Hazard / AI / Profile / ...   │ │
│  └────────────────────────────┬────────────────────────────────┘ │
└───────────────────────────────┼──────────────────────────────────┘
                                │
┌───────────────────────────────┼──────────────────────────────────┐
│                       业务逻辑层 (Business)                      │
│  ┌──────────────────────────┴──────────────────────────────┐   │
│  │                    状态管理 (Zustand)                    │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │   │
│  │  │ UserStore│ │DeviceStore│ │TaskStore │ │HazardStore│     │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                │                               │
│  ┌──────────────────────────┴──────────────────────────────┐   │
│  │                    Service 层                            │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │   │
│  │  │AuthSvc │ │DeviceSvc│ │InspectSvc│ │HazardSvc│     │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬──────────────────────────────────┘
                                │
┌───────────────────────────────┼──────────────────────────────────┐
│                        数据层 (Data)                            │
│  ┌──────────────────────────┴──────────────────────────────┐   │
│  │                    Repository 层                         │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │   │
│  │  │UserRepo │ │DeviceRepo│ │TaskRepo │ │HazardRepo│     │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                │                               │
│  ┌──────────────────────────┴──────────────────────────────┐   │
│  │                    Storage 抽象层                        │   │
│  │  ┌─────────────────┐  ┌─────────────────────────────┐  │   │
│  │  │ SQLite (结构化)  │  │ FileSystem (非结构化)      │  │   │
│  │  │ - User          │  │ - Images                   │  │   │
│  │  │ - Device        │  │ - Voice Notes              │  │   │
│  │  │ - Inspection    │  │ - Avatars                 │  │   │
│  │  │ - Hazard        │  │                           │  │   │
│  │  └─────────────────┘  └─────────────────────────────┘  │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ MMKV (轻量配置)                                 │   │   │
│  │  │ - Token / UserInfo / Settings / SyncQueue       │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        外部接口层 (External)                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  API Client (Axios)                                     │   │
│  │  - 请求拦截 (Token注入)                                 │   │
│  │  - 响应拦截 (错误处理)                                 │   │
│  │  - 离线检测与队列管理                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  预留后端API接口 (待接入)                               │   │
│  │  /api/auth/* /api/devices/* /api/inspections/* ...    │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

---

## 3. 目录结构设计

```
src/
├── app/                    # 应用入口配置
│   ├── navigation/         # 路由配置
│   │   ├── AppNavigator.tsx
│   │   ├── types.ts
│   │   └── screens.ts
│   └── store/             # 全局Store配置
│       └── index.ts
│
├── components/            # 通用组件
│   ├── common/            # 基础组件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   ├── business/          # 业务组件
│   │   ├── HazardCard.tsx
│   │   ├── DeviceCard.tsx
│   │   └── ...
│   └── index.ts
│
├── features/              # 功能模块 (按业务划分)
│   ├── auth/              # 认证模块
│   │   ├── screens/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── BindEnterpriseScreen.tsx
│   │   ├── stores/
│   │   │   └── authStore.ts
│   │   └── services/
│   │       └── authService.ts
│   │
│   ├── camera/            # 相机入口模块
│   │   ├── screens/
│   │   │   └── CameraScreen.tsx
│   │   └── components/
│   │
│   ├── inspection/        # 巡检模块
│   │   ├── screens/
│   │   │   ├── ScanCheckScreen.tsx
│   │   │   ├── SafetyCheckScreen.tsx
│   │   │   └── InspectionResultScreen.tsx
│   │   ├── stores/
│   │   │   └── inspectionStore.ts
│   │   └── services/
│   │
│   ├── hazard/            # 隐患模块
│   │   ├── screens/
│   │   │   ├── HazardReportScreen.tsx
│   │   │   ├── HazardConfirmScreen.tsx
│   │   │   ├── HazardRectifyScreen.tsx
│   │   │   └── HazardAcceptScreen.tsx
│   │   ├── stores/
│   │   │   └── hazardStore.ts
│   │   └── services/
│   │
│   ├── device/            # 设备模块
│   │   ├── screens/
│   │   │   ├── DeviceListScreen.tsx
│   │   │   ├── DeviceDetailScreen.tsx
│   │   │   └── DeviceChecklistScreen.tsx
│   │   ├── stores/
│   │   └── services/
│   │
│   ├── ai/               # AI助手模块
│   │   ├── screens/
│   │   │   └── AIAssistantScreen.tsx
│   │   ├── stores/
│   │   └── services/
│   │
│   ├── message/           # 消息中心模块
│   │   ├── screens/
│   │   └── stores/
│   │
│   └── profile/          # 个人中心模块
│       ├── screens/
│       │   ├── ProfileScreen.tsx
│       │   └── SettingsScreen.tsx
│       └── stores/
│
├── core/                  # 核心层
│   ├── storage/           # 存储抽象
│   │   ├── database.ts    # SQLite封装
│   │   ├── fileSystem.ts  # 文件系统
│   │   └── mmkv.ts       # MMKV封装
│   │
│   ├── network/           # 网络层
│   │   ├── apiClient.ts   # Axios封装
│   │   └── syncManager.ts # 同步管理
│   │
│   ├── utils/            # 工具函数
│   │   ├── format.ts
│   │   ├── validate.ts
│   │   └── helpers.ts
│   │
│   └── constants/         # 常量定义
│       ├── colors.ts
│       ├── typography.ts
│       └── config.ts
│
├── hooks/                 # 自定义Hooks
│   ├── useAuth.ts
│   ├── useOffline.ts
│   └── useCamera.ts
│
├── types/                 # TypeScript类型定义
│   ├── user.ts
│   ├── device.ts
│   ├── inspection.ts
│   └── hazard.ts
│
└── locales/               # 国际化
    ├── zh-CN.json
    └── en.json
```

---

## 4. 状态管理设计 (Zustand)

### 4.1 Store 结构

```typescript
// 用户状态
interface UserStore {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// 设备状态
interface DeviceStore {
  devices: Device[];
  currentDevice: Device | null;
  loading: boolean;
  fetchDevices: () => Promise<void>;
  setCurrentDevice: (device: Device) => void;
}

// 巡检状态
interface InspectionStore {
  currentTask: Task | null;
  records: InspectionRecord[];
  saveDraft: (record: Partial<InspectionRecord>) => void;
  submitRecord: (record: InspectionRecord) => Promise<void>;
}

// 隐患状态
interface HazardStore {
  hazards: HazardRecord[];
  drafts: HazardRecord[];
  fetchHazards: () => Promise<void>;
  createHazard: (data: Partial<HazardRecord>) => Promise<void>;
  updateHazardStatus: (id: string, status: number) => Promise<void>;
}

// 同步状态
interface SyncStore {
  pendingCount: number;
  isSyncing: boolean;
  sync: () => Promise<void>;
  resolveConflict: (id: string, resolution: 'local' | 'remote') => void;
}
```

### 4.2 Store 划分原则

| Store | 职责 | 持久化 |
|-------|------|--------|
| UserStore | 用户登录/登出/信息 | MMKV |
| DeviceStore | 设备列表/详情 | SQLite |
| InspectionStore | 巡检记录/草稿 | SQLite |
| HazardStore | 隐患记录/草稿 | SQLite |
| MessageStore | 消息列表/未读数 | SQLite |
| SyncStore | 同步队列/冲突处理 | MMKV |
| SettingsStore | 应用设置 | MMKV |

---

## 5. 数据流设计

### 5.1 典型数据流

```
用户操作 → 页面组件 → Service层 → Repository层 → Storage层
                    ↓
              API Client (在线) → 后端API
              Sync Manager (离线) → 本地队列
```

### 5.2 离线数据流

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  离线操作   │────▶│  本地存储   │────▶│  加入同步队列 │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                │
                    ┌─────────────┐              │
                    │  网络恢复   │◀─────────────┘
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  同步冲突   │────▶│ 用户选择   │
                    │  检测      │     │ 优先级     │
                    └──────┬──────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  上传成功   │
                    │  更新状态   │
                    └─────────────┘
```

---

## 6. 离线同步策略

### 6.1 同步队列管理

```typescript
interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'inspection' | 'hazard' | 'device';
  entityId: string;
  payload: any;
  createdAt: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
}
```

### 6.2 冲突处理策略

| 场景 | 处理方式 |
|-----|---------|
| 本地新建，云端无 | 直接上传 |
| 本地修改，云端无 | 直接上传 |
| 本地删除，云端有 | 上报删除请求 |
| 本地修改，云端已变 | 提示用户选择 |
| 网络超时 | 自动重试(3次)后标记失败 |
| 上传失败 | 保留在队列，下次重试 |

---

## 7. API 接口设计 (预留)

### 7.1 请求/响应格式

```typescript
// 请求
interface ApiRequest<T = any> {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: T;
  headers?: Record<string, string>;
}

// 响应
interface ApiResponse<T = any> {
  code: number;      // 0-成功，非0-失败
  message: string;
  data: T;
  timestamp: number;
}
```

### 7.2 接口分组

| 分组 | 前缀 | 说明 |
|-----|------|------|
| 认证 | /api/auth | 登录、绑定、登出 |
| 用户 | /api/users | 用户管理 |
| 企业 | /api/enterprises | 企业信息 |
| 部门 | /api/departments | 部门管理 |
| 设备 | /api/devices | 设备台账 |
| 巡检 | /api/inspections | 巡检记录 |
| 隐患 | /api/hazards | 隐患记录 |
| 消息 | /api/messages | 消息中心 |
| 报表 | /api/reports | 统计数据 |
| AI | /api/ai | 智能功能 |

---

## 8. 安全设计

### 8.1 本地安全

| 措施 | 说明 |
|-----|------|
| 密码加密 | 密码使用盐值+SHA256存储 |
| Token存储 | MMKV加密存储 |
| 生物识别 | 支持FaceID/TouchID |
| 数据加密 | 敏感字段AES加密 |

### 8.2 传输安全

| 措施 | 说明 |
|-----|------|
| HTTPS | 强制HTTPS传输 |
| Token验证 | 每次请求携带Token |
| 签名验证 | 重要接口参数签名 |

---

*文档版本：v1.0*
*最后更新：2026-03-04*
