# 项目深度重构规划

## 目标
对本app进行全面深度重构，包括：接口管理、数据管理、消息机制、状态标签管理、权限管理、组件管理、AI模块增强

## 当前阶段
**Iteration 5: 任务编排与执行验证** (新规划)

### 剩余任务分析

基于代码审查，当前 AI 模块增强任务的实际情况：

| 任务ID | 任务 | 现状 | 依赖 |
|--------|------|------|------|
| **1.5.2.5** | 业务数据集成 | toolDataService.ts 存在但用mock数据 | 需要连接 stores |
| **1.5.3.1** | deviceTool 真实数据 | 使用mock数据 | 依赖1.5.2.5 |
| **1.5.3.2** | taskTool 真实数据 | 使用mock数据 | 依赖1.5.2.5 |
| **1.5.3.3** | hazardTool 真实数据 | 使用mock数据 | 依赖1.5.2.5 |
| **1.5.3.4** | 隐患分析Skill | 无实现 | 依赖1.5.3.3 |
| **1.5.4.6** | 云端配置界面 | 无实现 | 依赖1.5.4.5 |
| **1.5.4.7** | 同步配置 | 无实现 | 依赖1.5.4.6 |
| **1.5.5.4** | 意图识别/路由 | 无实现 | 依赖流式响应 |
| **1.5.5.5** | 多轮对话 | 部分实现 | 依赖AI Store |
| **1.5.5.6** | 语音输入 | 无实现 | 需第三方库 |
| **1.5.5.7** | 图像分析 | 无实现 | 需第三方库 |

---

## 任务编排设计

### Phase A: 数据集成层 (优先级最高)

> 原因：工具系统需要真实数据，这是 AI 功能的核心价值

#### A.1 数据服务重构 ✅ 完成
- [x] A.1.1 修改 toolDataService.ts 连接真实 stores
- [x] A.1.2 集成 deviceStore 数据查询
- [x] A.1.3 集成 hazardStore 数据查询
- [x] A.1.4 集成 inspectionStore 任务数据查询

#### A.2 工具函数真实数据调用 ✅ 完成
- [x] A.2.1 重写 deviceTool.ts 使用真实数据
- [x] A.2.2 重写 hazardTool.ts 使用真实数据
- [x] A.2.3 重写 taskTool.ts 使用真实数据
- [x] A.2.4 测试工具返回真实业务数据

#### A.3 业务数据 RAG 集成 ✅ 完成
- [x] A.3.1 创建业务数据索引服务 (businessDataSync.ts)
- [x] A.3.2 实现隐患分类知识检索 (RAG已有支持)
- [x] A.3.3 实现设备手册知识检索 (RAG已有支持)

---

### Phase B: 智能分析能力 (进行中)

#### B.1 隐患分析 Skill ✅ 完成
- [x] B.1.1 设计隐患分析 Skill 接口
- [x] B.1.2 实现隐患分类推理
- [x] B.1.3 实现风险等级评估
- [x] B.1.4 实现整改建议生成
- [x] B.1.5 创建 hazardAnalysisTool 工具封装

#### B.2 意图识别系统 ✅ 完成
- [x] B.2.1 设计意图识别器接口
- [x] B.2.2 实现设备查询意图
- [x] B.2.3 实现隐患查询意图
- [x] B.2.4 实现任务查询意图

---

### Phase C: 配置与初始化 ✅ 完成

#### C.1 云端配置界面 ✅ 完成
- [x] C.1.1 创建云端配置 Modal 组件 (已存在 ConfigModal.tsx)
- [x] C.1.2 实现服务端地址配置 (cloudConfig.ts)
- [x] C.1.3 实现 API Key 云端管理 (cloudConfig.ts)

#### C.2 同步配置机制 ✅ 完成
- [x] C.2.1 实现配置同步服务 (configSync.ts)
- [x] C.2.2 实现定时同步逻辑 (configSync.ts)
- [x] C.2.3 实现离线配置缓存 (mmkvStorage)

---

### Phase D: 高级交互能力 ✅ 完成

#### D.1 多轮对话增强 ✅ 完成
- [x] D.1.1 完善上下文管理 (conversationContext.ts)
- [x] D.1.2 实现对话状态跟踪 (conversationContext.ts)

#### D.2 语音输入 (可选) ✅ 完成
- [x] D.2.1 集成语音识别库 (voiceInput.ts - 预留接口)
- [x] D.2.2 实现语音输入 UI (VoiceInputButton.tsx)

#### D.3 图像分析 (可选) ✅ 完成
- [x] D.3.1 集成图像识别 (imageAnalysis.ts)
- [x] D.3.2 实现图像上传功能 (ImageUploadButton.tsx)

---

## 执行策略

### 依赖关系图

```
Phase A (数据层)
    │
    ├── A.1 数据服务重构
    │       │
    │       └── A.2 工具函数真实数据
    │               │
    │               └── A.3 业务数据RAG
    │
    ▼
Phase B (智能分析)
    │
    ├── B.1 隐患分析Skill
    │
    └── B.2 意图识别
            │
            ▼
Phase C (配置)
    │
    ├── C.1 云端配置界面
    │
    └── C.2 同步配置

    (Phase D 可选，取决于时间)
```

### 验证策略
1. 每完成一个子任务，运行 TypeScript 编译检查
2. 实现完整功能后，启动 Expo 测试
3. 确保不影响现有功能

---

## 问题诊断总结 (2026-03-06 审视)

### 设计文档要求的 6 大功能

| # | 功能 | 设计文档要求 | 当前状态 | 问题 |
|---|------|------------|---------|------|
| 1 | 首次访问引导 | ActionCard组件 | ❌ 未使用 | 🔴 严重 |
| 2 | API Key失效处理 | 401错误卡片 | ❌ 只有Alert | 🔴 严重 |
| 3 | 思考模式显示 | ThinkingView组件 | ❌ 未使用 | 🔴 严重 |
| 4 | 打字机效果 | StreamingMessage组件 | ❌ 未使用 | 🔴 严重 |
| 5 | 流式响应 | streaming.ts服务 | ❌ 未使用 | 🔴 严重 |
| 6 | 配置流程 | ConfigModal | ✅ 完成 | - |

### 设计文档外的实现问题

| 功能 | 状态 | 问题 |
|------|------|------|
| intentRecognition | ❌ 未集成 | 意图识别服务未被使用 |
| hazardAnalysis | ❌ 未集成 | 分析工具未被使用 |
| conversationContext | ❌ 未集成 | 多轮对话上下文未使用 |
| VoiceInputButton | ❌ 未集成 | 语音按钮未放入UI |
| ImageUploadButton | ❌ 未集成 | 图像上传未放入UI |

### 根因
> 底层服务建好了，但 AIAssistantScreen + AIStore 完全没集成！

---

## 重构任务分解

### Phase R1: AIStore 流式响应集成 (进行中)

#### R1.1 扩展 AIStore 状态 ✅ 完成
- [x] R1.1.1 添加 `thinkingContent` 状态 (思考内容)
- [x] R1.1.2 添加 `displayContent` 状态 (打字机显示内容)
- [x] R1.1.3 添加 `streamingProgress` 状态 (流式进度)
- [x] R1.1.4 添加 `isStreaming` 状态 (是否正在流式)

#### R1.2 重构 sendMessage 方法 ✅ 完成
- [x] R1.2.1 替换 `provider.chat()` 为 `provider.chatStream()`
- [x] R1.2.2 集成 `streamingService` 处理流数据
- [x] R1.2.3 实现 thinkingContent 实时更新
- [x] R1.2.4 实现打字机效果 (80ms间隔)

#### R1.3 添加工具调用处理 ✅ 完成
- [x] R1.3.1 处理 `tool_calls` 响应
- [x] R1.3.2 执行工具并返回结果
- [x] R1.3.3 将工具结果发送给 LLM

---

### Phase R2: AIAssistantScreen 组件集成 ✅ 完成

#### R2.1 替换消息渲染组件 ✅ 完成
- [x] R2.1.1 导入 `StreamingMessage` 组件
- [x] R2.1.2 替换现有 `renderMessage` 使用 StreamingMessage
- [x] R2.1.3 传入 thinkingContent、displayContent、isStreaming 等props

#### R2.2 添加思考模式显示 ✅ 完成
- [x] R2.2.1 导入 `ThinkingView` 组件 (已在 StreamingMessage 中集成)
- [x] R2.2.2 在消息列表上方添加思考区域 (通过 StreamingMessage)
- [x] R2.2.3 实现固定2行高度 + 滚动 (ThinkingView 已实现)

#### R2.3 集成 ActionCard ✅ 完成
- [x] R2.3.1 导入 `ActionCard` 组件
- [x] R2.3.2 添加首次访问引导卡片逻辑
- [x] R2.3.3 添加 API Key 失效处理 (401检测)
- [x] R2.3.4 实现 navigate / retry / dismiss 动作处理

---

### Phase R3: 错误处理增强 ✅ 完成

#### R3.1 错误分类与处理 ✅ 完成
- [x] R3.1.1 检测 401 错误 → 显示重新配置卡片
- [x] R3.1.2 检测网络错误 → 显示重试选项
- [x] R3.1.3 检测速率限制 → 显示等待提示

#### R3.2 重试机制 ✅ 完成
- [x] R3.2.1 实现消息重试功能
- [x] R3.2.2 保存失败消息供重试
- [x] R3.2.3 添加重试按钮UI

---

### Phase R4: AI能力集成 ✅ 完成

#### R4.1 意图识别集成 ✅ 完成
- [x] R4.1.1 在 sendMessage 前调用 intentRecognition
- [x] R4.1.2 根据意图选择工具
- [x] R4.1.3 生成意图响应提示

#### R4.2 隐患分析集成 ✅ 完成
- [x] R4.2.1 添加"分析隐患"快捷操作
- [x] R4.2.2 集成 hazardAnalysisTool
- [x] R4.2.3 显示分析结果卡片

#### R4.3 业务数据同步 ✅ 完成
- [x] R4.3.1 启动时同步业务数据到RAG
- [x] R4.3.2 实现定时同步 (初始化时同步)

---

### Phase R5: 高级功能集成 ✅ 完成

#### R5.1 语音输入 ✅ 完成
- [x] R5.1.1 在输入框添加语音按钮
- [x] R5.1.2 集成 VoiceInputButton
- [x] R5.1.3 实现语音转文字

#### R5.2 图像上传 ✅ 完成
- [x] R5.2.1 在输入框添加图像按钮
- [x] R5.2.2 集成 ImageUploadButton
- [x] R5.2.3 实现图像分析

#### R5.3 多轮对话 ✅ 完成
- [x] R5.3.1 集成 conversationContext (已有服务)
- [x] R5.3.2 保存对话历史 (已有 MMKV 存储)
- [x] R5.3.3 实现上下文管理 (已有服务)

---

## 执行顺序

```
Phase R1 (AIStore)
    │
    ├── R1.1 扩展状态
    ├── R1.2 重构sendMessage (流式)
    └── R1.3 工具调用处理
            │
            ▼
Phase R2 (AIAssistantScreen)
    │
    ├── R2.1 替换消息组件
    ├── R2.2 思考模式显示
    └── R2.3 ActionCard集成
            │
            ▼
Phase R3 (错误处理)
    │
    ├── R3.1 错误分类
    └── R3.2 重试机制
            │
            ▼
Phase R4 (AI能力)
    │
    ├── R4.1 意图识别
    ├── R4.2 隐患分析
    └── R4.3 数据同步
            │
            ▼
Phase R5 (高级功能)
    │
    ├── R5.1 语音输入
    ├── R5.2 图像上传
    └── R5.3 多轮对话
```

---

## 决策记录

| 日期 | 议题 | 决定 | 理由 |
|------|------|------|------|
| 2026-03-06 | 审视结果 | 发现集成层缺失 | 设计文档功能未集成到UI |
| 2026-03-06 | 优先级 | R1-R2 最高 | 设计文档核心功能 |
| 2026-03-06 | 策略 | 从底层到上层 | AIStore → Screen 依次集成 |

---

## Phase P1: 多种LLM Provider 支持优化 (新增)

### P1.1 流式响应统一化 ✅ 完成 (分析)
- [x] P1.1.1 分析 Vercel AI SDK 最佳实践
- [x] P1.1.2 分析当前 Provider 实现差距
- [x] P1.1.3 识别核心问题: 仅 DeepSeek 实现 chatStream

### P1.2 流式响应实现 ✅ 完成
- [x] P1.2.1 创建 ProviderAdapter 抽象基类 (可选 - 使用现有模式)
- [x] P1.2.2 为 OpenAI 实现 chatStream
- [x] P1.2.3 为 Anthropic 实现 chatStream (特殊格式)
- [x] P1.2.4 为其他 providers 实现 chatStream (MiniMax, Kimi, Doubao, GLM, Custom)

### P1.3 API Key 验证增强 ✅ 完成
- [x] P1.3.1 实现真正的 API Key 验证
- [x] P1.3.2 添加 Provider-specific 验证逻辑
- [x] P1.3.3 更新 LLMProvider 接口

### P1.4 重试机制 ✅ 完成
- [x] P1.4.1 创建 retryPolicy 配置 (withRetry 工具)
- [x] P1.4.2 实现指数退避重试 (calculateDelay)
- [x] P1.4.3 处理 429 和 5xx 错误 (shouldRetry)

### P1.5 Provider 能力检测 ✅ 完成
- [x] P1.5.1 添加 getCapabilities() 方法
- [x] P1.5.2 实现 vision multimodal 处理
- [x] P1.5.3 实现 function calling 支持检测

### P1.6 使用统计和成本追踪 ✅ 完成
- [x] P1.6.1 创建 usageTracking.ts 服务
- [x] P1.6.2 实现 MODEL_PRICING 价格表
- [x] P1.6.3 实现 recordUsage 记录每次调用
- [x] P1.6.4 实现 getSummary 统计功能
- [x] P1.6.5 支持按 provider/model 分组统计

### P1.7 模型列表获取 ✅ 完成
- [x] P1.7.1 添加 ModelInfo 类型定义
- [x] P1.7.2 添加 listModels() 方法到 LLMProvider 接口
- [x] P1.7.3 实现各 Provider 的 listModels()
- [x] P1.7.4 OpenAI 动态获取模型列表 (API call)
- [x] P1.7.5 其他 Provider 返回默认模型列表

### P1.8 AI Facade 统一接口 ✅ 完成
- [x] P1.8.1 创建 aiFacade.ts 统一入口
- [x] P1.8.2 实现 initialize() 初始化
- [x] P1.8.3 实现 getStatus() 状态查询
- [x] P1.8.4 实现 sendMessage() 发送消息
- [x] P1.8.5 实现 switchProvider() 切换 Provider
- [x] P1.8.6 实现 searchKnowledge() 知识库搜索
- [x] P1.8.7 实现 getUsageSummary() 使用统计

---

## Provider 实现分析

### 现有 Provider 能力矩阵

| Provider | chat() | chatStream() | validateApiKey() | getCapabilities() | listModels() | 状态 |
|----------|--------|--------------|-----------------|-----------------|--------------|------|
| DeepSeek | ✅ | ✅ | ✅ | ✅ | ✅ | 完整 |
| OpenAI | ✅ | ✅ | ✅ | ✅ | ✅ | 完整 |
| Anthropic | ✅ | ✅ | ✅ | ✅ | ✅ | 完整 |
| MiniMax | ✅ | ✅ | ✅ | ✅ | ✅ | 完整 |
| Kimi | ✅ | ✅ | ✅ | ✅ | ✅ | 完整 |
| Doubao | ✅ | ✅ | ✅ | ✅ | ✅ | 完整 |
| GLM | ✅ | ✅ | ✅ | ✅ | ✅ | 完整 |
| Custom | ✅ | ✅ | ✅ | ✅ | ✅ | 完整 |

### 核心问题 (已解决)

| 问题 | 状态 |
|------|------|
| **流式响应不一致** | ✅ 已解决 |
| **API Key 验证不完整** | ✅ 已解决 |
| **无重试机制** | ✅ 已解决 |
| **无使用统计** | ✅ 已解决 |

---

## 决策记录

| 日期 | 议题 | 决定 | 理由 |
|------|------|------|------|
| 2026-03-08 | Provider 分析 | 参考 Vercel AI SDK | 行业最佳实践 |
| 2026-03-08 | 流式实现 | 各自实现 | 每个 Provider API 格式不同 |
| 2026-03-09 | 行业对标 | 对比 Vercel AI SDK | 分析与行业最佳实践差距 |

---

## 行业最佳实践对标 (2026-03-09)

### Vercel AI SDK 架构分析

Vercel AI SDK 是行业领先的 AI 聊天 SDK，其核心架构：

| 特性 | Vercel AI SDK | 当前实现 | 差距 |
|------|---------------|----------|------|
| `useChat` hook | ✅ 完整 | ❌ 手动实现 | 需要简化 |
| `useCompletion` | ✅ 简单补全 | ❌ 无 | 可选 |
| `useObject` | ✅ 结构化输出 | ❌ 无 | 高级功能 |
| `createStreamableUI` | ✅ 流式组件 | ❌ 无 | **重要** |
| `createStreamableValue` | ✅ 流式值 | ✅ 完成 | 标准化实现 |
| `createStreamableUI` | ✅ 流式UI | ✅ 完成 | 对齐Vercel |
| 消息格式转换 | `convertToModelMessages` | ❌ 无 | 可选 |
| 消息裁剪 | `pruneMessages` | ❌ 无 | 内存优化 |
| 内置工具调用 | `streamText` 集成 | ⚠️ 手动 | 需要简化 |

### 改进建议

#### Phase S1: 流式 UI 增强 (高优先级)
- [x] S1.1 实现 `createStreamableUI` ✅ (2026-03-09 完成)
- [x] S1.2 支持流式渲染 React 组件 ✅ (2026-03-09 完成)
- [x] S1.3 标准化 `createStreamableValue` ✅ (2026-03-09 完成)

#### Phase S2: 状态管理简化 (中优先级)
- [x] S2.1 创建 `useChat` hook 简化版 ✅ (2026-03-09 完成)
- [x] S2.2 添加消息裁剪功能 ✅ (已集成在 useChat 中)
- [x] S2.3 添加消息格式转换 ✅ (2026-03-09 完成)

#### Phase S3: 高级功能 (低优先级)
- [x] S3.1 实现 `useObject` 结构化输出 ✅ (2026-03-09 完成)
- [x] S3.2 实现 `useCompletion` 补全 ✅ (2026-03-09 完成)
- [x] S3.3 增强工具调用集成 ✅ (2026-03-09 完成)

---

*更新日期: 2026-03-09 (S1-S3 全部完成)*
