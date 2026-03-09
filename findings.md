# Findings & Decisions

## Requirements
- 研究 nanobot 代码库架构
- 研究 PageIndex 架构 (VectifyAI)
- 探索其 LLM 集成、记忆管理、工具调用机制
- 提取可复用的设计模式
- 优化 might-young-app 的 AI 聊天功能

## Research Findings

### nanobot 核心架构
- **代码规模**: ~3,935 行代码（比 Clawdbot 小 99%）
- **语言**: Python ≥3.11
- **架构**: 模块化设计，分离 channel（通信平台）、provider（LLM 集成）、agent 功能

### nanobot 主要功能
1. **实时市场分析** - Financial analysis 能力
2. **全栈软件工程** - Coding assistant
3. **智能日程管理** - 日程管理
4. **个人知识助手** - 记忆和推理能力

### nanobot 技术栈
- **LLM 提供商**: OpenRouter, Anthropic, OpenAI, DeepSeek, Moonshot/Kimi, MiniMax, vLLM
- **多渠道支持**: Telegram, Discord, WhatsApp, Feishu, QQ, DingTalk, Slack, Email, Matrix
- **安装方式**: pip, uv, 源码

### nanobot 核心组件
| 组件 | 目录 | 功能 |
|------|------|------|
| bridge/ | 集成层 | 连接各聊天平台 |
| nanobot/ | 核心代码 | Agent 逻辑 |
| case/ | 示例 | 使用案例 |

### nanobot Agent 核心架构

#### 1. AgentLoop (nanobot/agent/loop.py)
- 核心处理引擎，编排消息处理流程
- 接收消息 → 构建上下文 → 调用 LLM → 执行工具 → 返回响应
- 最大迭代次数: 40 (max_iterations)
- 内置工具: 文件操作、Shell执行、Web搜索、消息发送、子Agent创建

#### 2. MemoryStore (nanobot/agent/memory.py)
- **两层记忆系统**:
  - MEMORY.md: 长期事实信息 (LLM 摘要)
  - HISTORY.md: 可 grep 搜索的时间线日志
- 记忆整合: 自动将旧消息压缩存储
- memory_window: 默认 50 条消息

#### 3. LLM Provider 架构 (nanobot/providers/base.py)
- 抽象基类 LLMProvider 定义统一接口
- 支持: OpenRouter, Anthropic, OpenAI, DeepSeek, Moonshot/Kimi, MiniMax, vLLM
- 核心方法: chat(), get_default_model()
- ToolCallRequest: 工具调用请求
- LLMResponse: 响应封装 (含 content, tool_calls, reasoning_content)

#### 4. ContextBuilder
- 构建 LLM 调用的上下文
- 整合历史消息、记忆、技能

### 当前 AIAssistantScreen 不足之处

| 问题 | 现状 | nanobot 方案 |
|------|------|-------------|
| 无真实 LLM 集成 | 模拟响应 (setTimeout) | LLMProvider 抽象层 |
| 无记忆功能 | 仅当前会话 | MemoryStore 两层记忆 |
| 无工具调用 | 静态快捷操作 | ToolRegistry 动态工具 |
| 扩展性差 | 硬编码 | 模块化 Provider/Channel |

## Phase 2 分析结果

### 当前 AI 功能架构

| 组件 | 路径 | 状态 |
|------|------|------|
| AIAssistantScreen | src/features/ai/screens/AIAssistantScreen.tsx | 基础 UI，模拟响应 |
| AIDataCenterScreen | src/features/ai/screens/AIDataCenterScreen.tsx | 设备数据展示 |
| AIProfileScreen | src/features/ai/screens/AIProfileScreen.tsx | 个人中心 |
| AI Services | src/features/ai/services/ | 空目录 |
| AI Stores | src/features/ai/stores/ | 空目录 |

### 现有 AI 配置 (config.ts)
```typescript
ai: {
  defaultProvider: 'openai',
  defaultModel: 'gpt-4o-mini',
  maxTokens: 2000,
  temperature: 0.7,
}
```
**问题**: 配置存在但未被使用！

### 详细不足分析

#### 1. AIAssistantScreen.tsx
| 问题 | 描述 | 影响 |
|------|------|------|
| 模拟响应 | 使用 setTimeout 模拟 1.5s 延迟后返回固定文本 | 无法真正与用户交互 |
| 无 API 集成 | 没有调用任何 LLM 服务 | 功能形同虚设 |
| 硬编码消息 | 响应内容写死 | 无法处理复杂查询 |
| 快捷操作无功能 | quickActions 只是 UI，无实际功能 | 用户无法执行操作 |
| 无状态管理 | 消息存储在组件内，刷新丢失 | 无法跨会话保持上下文 |

#### 2. AIDataCenterScreen.tsx
- 展示设备统计信息
- 依赖 deviceStore.fetchDevices()
- 有数据展示，无 AI 交互能力

#### 3. AIProfileScreen.tsx
- 展示用户信息
- 菜单项无实际功能 (onPress 多为空函数)

### nanobot 设计对比

| nanobot 特性 | 当前实现 | 需要改进 |
|-------------|---------|---------|
| LLMProvider 抽象层 | 无 | 创建 AI 服务层 |
| MemoryStore 两层记忆 | 无 | 实现本地记忆 |
| ToolRegistry 动态工具 | 静态快捷操作 | 动态工具系统 |
| 异步 Agent Loop | 同步 setTimeout | 异步处理 |
| 可扩展 Provider | 无 | 支持多 LLM 提供商 |
| 会话管理 | 无 | Session 管理 |

### PageIndex 架构 (VectifyAI)

#### 核心概念
- **无向量 RAG**: 使用 LLM 推理代替传统向量相似度搜索
- **树形索引**: 构建文档的层级目录结构 (Table-of-Contents)
- **推理检索**: 模拟人类专家浏览文档的行为，通过树搜索定位相关内容

#### 核心技术

| 特性 | PageIndex 方案 |
|------|---------------|
| 存储 | 无需向量数据库 |
| 文档组织 | 自然章节，非人工分块 |
| 检索方式 | LLM 推理 + 树搜索 |
| 可解释性 | 追踪来源页面/章节 |
| 准确率 | FinanceBench 98.7% |

#### 树索引生成流程
```
1. TOC 检测 → 识别目录页和页码
2. 元数据处理 → 提取标题、页范围、摘要
3. 验证 → 随机抽样验证 TOC 准确性
4. 修复 → 迭代修正错误条目
5. 生成树 → 构建层级索引结构
```

#### 推理检索流程
```
1. 用户查询 → LLM 推理
2. 树搜索 → 从根节点开始
3. 分支决策 → 判断哪个子节点最相关
4. 递归向下 → 直到定位目标内容
5. 返回结果 → 附带推理路径和引用
```

#### 与 nanobot MemoryStore 对比

| 维度 | nanobot MemoryStore | PageIndex |
|------|-------------------|-----------|
| 存储内容 | 对话历史、事实 | 文档结构、章节 |
| 索引方式 | LLM 摘要压缩 | 树形层级结构 |
| 检索方式 | 记忆检索 | 树搜索推理 |
| 用途 | 长期记忆 | 文档问答 RAG |

### 建议优化方向

1. **创建 AI 服务层** (src/features/ai/services/)
   - LLMProvider 接口
   - OpenAI/Anthropic/DeepSeek 实现
   - 消息处理和响应解析

2. **实现记忆系统** (src/features/ai/stores/)
   - 短期会话记忆 (消息历史)
   - 长期记忆存储 (用户偏好、事实)
   - **树形索引** (可选): 组织知识库内容

3. **添加工具系统**
   - 查询设备工具
   - 查询任务工具
   - 查询隐患工具

4. **UI 优化**
   - 真正的快捷操作执行
   - 加载状态优化
   - 错误处理

---

## Phase 3: 优化方案设计

### 整体架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                      AIAssistantScreen                       │
│                        (UI 层)                               │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     AI Store (Zustand)                      │
│  - messages: Message[]                                      │
│  - sendMessage()                                            │
│  - quickAction()                                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
   ┌───────────┐   ┌───────────┐   ┌───────────┐
   │  Provider │   │   Memory  │   │   Tools   │
   │  (LLM)    │   │  (记忆)   │   │  (工具)   │
   └───────────┘   └───────────┘   └───────────┘
```

### 模块详细设计

#### 1. AI Service Layer (src/features/ai/services/)

```
src/features/ai/services/
├── types.ts          # 类型定义
├── provider.ts       # Provider 接口和实现
├── chat.ts          # 聊天服务
└── index.ts         # 导出
```

**类型定义 (types.ts):**
```typescript
// 消息类型
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
}

// LLM Provider 接口
interface LLMProvider {
  chat(messages: Message[], options?: ChatOptions): Promise<LLMResponse>;
  getDefaultModel(): string;
}

// LLM 响应
interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// 工具调用
interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}
```

#### 2. AI Store (src/features/ai/stores/)

```
src/features/ai/stores/
├── aiStore.ts        # 主 store
├── memory.ts         # 记忆管理
└── index.ts          # 导出
```

**AI Store 设计:**
```typescript
interface AIStore {
  // 状态
  messages: Message[];
  isLoading: boolean;
  error: string | null;

  // 会话记忆
  sessionHistory: Message[];

  // 动作
  sendMessage: (content: string) => Promise<void>;
  executeQuickAction: (action: QuickAction) => Promise<void>;
  clearHistory: () => void;
  loadHistory: () => void;
}
```

**Memory 记忆设计 (参考 nanobot 两层记忆):**
```typescript
interface MemoryStore {
  // 短期记忆: 当前会话消息
  shortTerm: {
    add: (message: Message) => void;
    getRecent: (count: number) => Message[];
    clear: () => void;
  };

  // 长期记忆: 用户偏好、事实
  longTerm: {
    get: () => Promise<string>;
    save: (content: string) => Promise<void>;
    consolidate: (messages: Message[]) => Promise<void>;
  };
}
```

#### 3. 工具系统设计 (src/features/ai/services/tools/)

```
src/features/ai/services/tools/
├── registry.ts       # 工具注册表
├── deviceTool.ts     # 设备查询工具
├── taskTool.ts      # 任务查询工具
├── hazardTool.ts    # 隐患查询工具
└── index.ts         # 导出
```

**工具接口:**
```typescript
interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  execute: (args: Record<string, any>) => Promise<ToolResult>;
}
```

#### 4. 可选: RAG 知识库 (PageIndex 风格)

```
src/features/ai/services/rag/
├── index.ts         # 入口
├── treeIndex.ts     # 树形索引
└── retriever.ts     # 检索器
```

### 渐进式实现计划

考虑到项目现状，建议分步骤实现：

#### Step 1: 基础 LLM 集成 (最优先)
- [ ] 创建 AI Service Layer
- [ ] 实现 OpenAI Provider (或使用现有配置)
- [ ] 替换模拟响应为真实 LLM 调用
- [ ] 基本错误处理

#### Step 2: 消息状态管理
- [ ] 创建 AI Store (Zustand)
- [ ] 实现消息持久化 (MMKV)
- [ ] 加载历史消息

#### Step 3: 工具系统
- [ ] 工具注册表
- [ ] 设备查询工具
- [ ] 任务查询工具
- [ ] 隐患查询工具

#### Step 4: 记忆系统 (进阶)
- [ ] 短期会话记忆
- [ ] 长期记忆存储
- [ ] 记忆整合 (可选)

#### Step 5: RAG 知识库 (可选)
- [ ] 文档索引
- [ ] 树形检索
- [ ] 上下文增强

### 需要决策的问题

| 问题 | 选项 | 说明 |
|------|------|------|
| **LLM 提供商** | DeepSeek | API: sk-031ec5a58a574b36ab1e65ea642e9555 |
| **API Key 管理** | Keychain (expo-secure-store) | 不传递到后端，纯客户端 |
| **记忆复杂度** | 完整 (两层: 会话+长期) | 参考 nanobot 设计 |
| **工具数量** | 3个核心 | 设备、任务、隐患 |
| **RAG 知识库** | 需要添加 | 全部文档，混合来源 |

---

### RAG 知识库设计

**需求:**
- 内容: 技术文档 + 业务文档
- 来源: App 上传 + 预设内容 + API 获取

**架构 (PageIndex 风格):**
```
┌─────────────────────────────────────┐
│            RAG Service              │
├─────────────────────────────────────┤
│  文档处理 → 树形索引 → LLM 检索     │
└─────────────────────────────────────┘
```

**模块设计:**
```typescript
// src/features/ai/services/rag/
interface Document {
  id: string;
  title: string;
  content: string;
  source: 'upload' | 'preset' | 'api';
  metadata: Record<string, any>;
}

interface TreeNode {
  id: string;
  title: string;
  content: string;
  children: TreeNode[];
  pageRange?: { start: number; end: number };
}

// 核心功能
- addDocument(doc: Document): Promise<void>
- buildTreeIndex(docId: string): Promise<TreeNode>
- retrieve(query: string): Promise<RetrievedContext>
```

---

## Phase 1: 现有问题诊断 (完成)

### 决策记录

| 日期 | 议题 | 决定 | 理由 |
|------|------|------|------|
| 2026-03-05 | 主题机制 | 状态标签颜色独立于主题 | 用户明确需求 |
| 2026-03-05 | 执行顺序 | Phase 2 (API) 优先 | 所有模块依赖网络层 |
| 2026-03-05 | AI工具数据 | 依赖Phase 3数据管理 | 工具需要真实数据源 |
| 2026-03-05 | 任务范围 | 全部完成 | 不设可选任务 |
| 2026-03-05 | 执行策略 | 先全局后细节 | 全局机制设计优先 |

---

## 执行阶段

### Iteration 1: Phase 2 - API管理系统 (进行中)

### 1.1 分析现有代码结构
- [x] 分析设计文档
- [x] 分析现有代码
- [x] 互联网优秀实践调研

### 1.2 AI模块详细分析

#### 设计文档要求 (ai_architecture.md) vs 现有实现

| 功能模块 | 设计文档要求 | 现有实现 | 状态 |
|---------|------------|---------|------|
| **Provider支持** | 8种Provider (OpenAI/Anthropic/DeepSeek/MiniMax/Kimi/Doubao/GLM/Custom) | 仅DeepSeek | ❌ 缺失 |
| **LLM客户端** | fetch封装、流式响应、Provider特定headers | 基础chat，无流式 | ⚠️ 部分 |
| **API密钥管理** | 加密存储、验证连接 | secureStorage实现 | ✅ 完成 |
| **本地RAG** | Embedding生成、向量存储、相似度搜索 | 基础检索，无向量 | ❌ 缺失 |
| **Skill系统** | 工具注册、业务能力封装 | 工具注册表+3个工具 | ⚠️ 部分 |
| **初始化配置** | Provider选择、API Key验证、配置保存 | 无初始化UI | ❌ 缺失 |
| **云端配置** | 服务端地址、API Key、同步间隔 | 无配置UI | ❌ 缺失 |

#### 现有AI代码文件清单

```
src/features/ai/
├── screens/
│   ├── AIAssistantScreen.tsx      ⚠️ 需集成真实LLM
│   ├── AIDataCenterScreen.tsx    ⚠️ 需数据集成
│   └── AIProfileScreen.tsx       ⚠️ 需功能完善
├── services/
│   ├── types.ts                   ✅ 完成
│   ├── provider/
│   │   ├── index.ts              ⚠️ 仅DeepSeek
│   │   └── deepseek.ts           ✅ 基础完成
│   ├── tools/
│   │   ├── registry.ts            ✅ 完成
│   │   ├── deviceTool.ts         ⚠️ Mock数据
│   │   ├── taskTool.ts           ⚠️ Mock数据
│   │   └── hazardTool.ts         ⚠️ Mock数据
│   ├── rag/
│   │   └── index.ts              ⚠️ 简化版，无向量
│   ├── secureStorage.ts           ✅ 完成
│   ├── init.ts                   ❌ 无内容
│   └── index.ts                  ❌ 空导出
└── stores/
    ├── aiStore.ts                 ✅ 基础完成
    └── index.ts                  ✅ 完成
```

#### 详细缺失项

1. **Provider层**
   - ❌ OpenAI Provider
   - ❌ Anthropic Provider
   - ❌ MiniMax/Kimi/Doubao/GLM Provider
   - ❌ Custom Provider (用户自定义)
   - ❌ Provider动态切换机制
   - ❌ 流式响应支持

2. **本地RAG**
   - ❌ Embedding生成服务 (API/本地/哈希三种模式)
   - ❌ 向量存储与相似度搜索
   - ❌ SQLite持久化
   - ❌ 预设知识库加载
   - ❌ RAG检索增强 (与LLM结合)

3. **工具系统**
   - ⚠️ deviceTool - 需真实数据集成
   - ⚠️ taskTool - 需真实数据集成
   - ⚠️ hazardTool - 需真实数据集成
   - ❌ 隐患分析Skill (设计文档5.1)
   - ❌ 图像识别能力

4. **初始化与配置**
   - ❌ Provider选择界面
   - ❌ API Key验证
   - ❌ 云端服务配置界面
   - ❌ 同步配置

5. **对话能力**
   - ❌ 意图识别/路由
   - ❌ 多轮对话上下文
   - ❌ 语音输入
   - ❌ 图像上传分析

---

### 1.3 API接口管理问题

| 问题 | 现状 | 设计文档要求 |
|------|------|-------------|
| **网络层缺失** | `src/core/network/` 目录为空 | 完整的API请求封装 |
| **无请求拦截器** | 直接在store中操作数据 | 统一请求拦截（认证token、loading状态） |
| **无响应拦截器** | 无统一错误处理 | 统一响应处理（状态码、错误提示） |
| **无API定义** | 每个功能独立调用 | 集中API地址表 + 接口描述 |

### 1.2 数据管理问题

| 问题 | 现状 | 设计文档要求 |
|------|------|-------------|
| **存储实现** | 内存存储 (InMemoryDB) | 真正的SQLite |
| **表结构** | 仅有简单CRUD | 设计文档中的完整表结构 |
| **数据验证** | 无 | 需实现数据验证层 |
| **离线存储** | 不完整 | 完整的离线存储策略 |
| **同步机制** | 简单队列 | 完整的上线同步机制 |

**设计文档要求 (field_design.md):**
- 用户表、部门表、企业表
- 设备类型、位置、台账表
- 隐患记录、流程记录表
- 巡检任务、检查记录表
- 消息记录表

### 1.3 消息机制问题

| 问题 | 现状 | 设计文档要求 |
|------|------|-------------|
| **消息类型** | 4种简单类型 | 需支持业务消息流转 |
| **生成机制** | 分散在各store | 集中消息生成服务 |
| **管理机制** | 简单列表 | 需支持未读/已读/跳转 |
| **卡片组件** | 无 | 统一消息卡片组件 |

### 1.4 权限管理问题

| 问题 | 现状 | 设计文档要求 |
|------|------|-------------|
| **权限配置** | 硬编码在config.ts | 需支持动态配置 |
| **角色管理** | 4种固定角色 | 需管理员可配置 |
| **功能权限** | 基础布尔值 | 需细粒度控制 |
| **数据权限** | 无 | 需部门+角色管控 |

### 1.5 流程管理问题

| 问题 | 现状 | 设计文档要求 |
|------|------|-------------|
| **状态配置** | 基础枚举 | 需完整流程引擎 |
| **流程定义** | 硬编码 | 需可配置流程 |
| **状态流转** | store中直接修改 | 需统一流程引擎 |
| **流转记录** | 仅有部分字段 | 需完整流程记录表 |

### 1.6 组件管理问题

| 问题 | 现状 | 设计文档要求 |
|------|------|-------------|
| **组件库** | 无统一管理 | 需建立基础组件库 |
| **按钮组件** | 各页面重复 | 统一Button组件 |
| **输入组件** | 原生组件混用 | 统一Input组件 |
| **标签组件** | 内联样式 | 独立Tag组件 |
| **卡片组件** | 各页面重复 | 统一Card组件 |

### 1.7 核心代码缺陷总结

```
src/
├── core/
│   ├── network/        ❌ 空目录 - 无API层
│   ├── constants/     ⚠️ 部分完成 - 需完善
│   ├── storage/       ❌ 仅内存存储 - 需SQLite
│   └── utils/        ⚠️ 待探索
├── features/
│   ├── hazard/        ⚠️ 部分完成 - 需流程引擎
│   ├── device/        ⚠️ 待完善
│   ├── inspection/    ⚠️ 待完善
│   ├── message/       ❌ 需重建
│   ├── ai/           ⚠️ 基础完成 - 需LLM集成
│   └── auth/         ⚠️ 待完善
└── types/             ⚠️ 部分类型缺失
```

### 1.8 互联网优秀实践参考

**API管理最佳实践:**
- 集中式API定义 (如 OpenAPI/Swagger)
- 请求/响应拦截器模式
- API版本管理
- 请求重试与超时处理

**数据管理最佳实践:**
- ORM/Query Builder模式
- 数据验证层 (Zod/Yup)
- 离线优先架构
- 增量同步策略

**权限管理最佳实践:**
- RBAC (基于角色的访问控制)
- ABAC (基于属性的访问控制)
- 动态权限配置
- 最小权限原则

**工作流引擎最佳实践:**
- 状态机模式
- 可配置流程
- 流程模板
- 事件驱动架构

## 2026-03-06 新发现

### 当前 AI 工具数据现状

通过代码审查发现：

1. **toolDataService.ts** 存在但使用 mock 数据
   - 包含 queryDevices, queryHazards, queryTasks 三个函数
   - 所有数据都是硬编码的 mock 数组

2. **真实 stores 可用**
   - deviceStore.ts: fetchDevices() 方法存在
   - hazardStore.ts: fetchHazards() 方法存在
   - inspectionStore.ts: fetchTasks() 方法存在

3. **数据流设计**
   ```
   AI Tool → toolDataService → business Stores → InMemoryDB
   ```

4. **核心问题**
   - toolDataService 绕过了真实 stores，直接返回 mock 数据
   - 需要重构为调用真实 stores

### 待实现功能分析

| 功能 | 复杂度 | 优先级 |
|------|--------|--------|
| 真实数据集成 | 中 | P0 |
| 隐患分析Skill | 高 | P1 |
| 意图识别 | 中 | P1 |
| 云端配置 | 低 | P2 |
| 语音输入 | 高 | 可选 |
| 图像分析 | 高 | 可选 |

---

## Issues Encountered
| Issue | Resolution |
|-------|------------|

## Resources
- nanobot GitHub: https://github.com/HKUDS/nanobot
- nanobot README: 包含完整的功能描述和安装指南
- PageIndex GitHub: https://github.com/VectifyAI/PageIndex
- PageIndex: 无向量 RAG 系统，使用 LLM 推理进行文档检索

## Visual/Browser Findings
- nanobot 架构图: nanobot_arch.png
- nanobot logo: nanobot_logo.png

---
*Update this file after every 2 view/browser/search operations*
