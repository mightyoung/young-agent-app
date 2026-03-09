# AI 模块架构重构设计方案

**设计日期**: 2026-03-09
**版本**: v1.0
**状态**: 评审中

---

## 1. 背景与目标

### 1.1 当前问题

| # | 问题 | 严重性 |
|---|------|--------|
| 1 | 双入口状态管理 (aiStore + aiFacade) | 🔴 严重 |
| 2 | Provider 接口不完整 (chatStream/validateApiKey 可选) | 🔴 严重 |
| 3 | API Key 存储逻辑分散 | 🟡 中等 |
| 4 | Token 估算不准确 (length/4) | 🟡 中等 |
| 5 | 无统一错误类型 | 🟡 中等 |
| 6 | Provider 切换不验证 Key | 🟡 中等 |

### 1.2 重构目标

1. **统一入口**: 只保留一个 AI Service 入口
2. **类型安全**: LLMProvider 接口强制实现所有方法
3. **可观测**: 添加请求拦截器和统一错误处理
4. **可扩展**: 易于添加新 Provider 和中间件

---

## 2. 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    AIAssistantScreen                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    AIService (统一入口)                       │
│  - 状态管理 (Zustand)                                     │
│  - 消息历史                                                │
│  - Provider 切换                                           │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│   ProviderLayer         │     │   MiddlewareLayer       │
│   - ProviderRegistry    │     │   - RequestInterceptor  │
│   - ProviderValidator  │     │   - ResponseInterceptor │
│   - LLMProvider        │     │   - ErrorHandler       │
└─────────────────────────┘     └─────────────────────────┘
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│   8 Providers           │     │   Tools & RAG           │
│   - OpenAI             │     │   - ToolRegistry        │
│   - Anthropic          │     │   - RAGService          │
│   - DeepSeek           │     │   - UsageTracking       │
│   - ...                │     │                         │
└─────────────────────────┘     └─────────────────────────┘
```

### 2.2 核心组件

#### 2.2.1 AIService (统一入口)

```typescript
// 建议的 AIService 接口
interface AIService {
  // 状态
  messages: Message[];
  isLoading: boolean;
  error: AIError | null;
  currentProvider: ProviderType;

  // Actions
  sendMessage(content: string): Promise<void>;
  retryMessage(messageId: string): Promise<void>;
  switchProvider(type: ProviderType): Promise<void>;
  clearHistory(): void;

  // 查询
  getUsageStats(): UsageStats;
  getProviderStatus(): ProviderStatus[];
}
```

#### 2.2.2 ProviderLayer

```typescript
// 强化的 LLMProvider 接口
interface LLMProvider {
  // 必需方法
  chat(messages: Message[], options: ChatOptions): Promise<ChatResponse>;
  chatStream(messages: Message[], options: StreamingOptions): Promise<void>;
  getDefaultModel(): string;
  validateApiKey(apiKey: string): Promise<ValidationResult>;

  // 新增必需方法
  getCapabilities(): ProviderCapabilities;
  listModels(): Promise<ModelInfo[]>;

  // 可选方法 (通过中间件实现)
  // getMetrics(): ProviderMetrics;
}

// Provider 注册表
class ProviderRegistry {
  register(type: ProviderType, provider: LLMProvider): void;
  get(type: ProviderType): LLMProvider;
  getCurrent(): LLMProvider;
  list(): Array<{ type: ProviderType; name: string }>;
}
```

#### 2.2.3 MiddlewareLayer

```typescript
// 请求拦截器
interface RequestInterceptor {
  onRequest(request: ChatRequest): ChatRequest | Promise<ChatRequest>;
  onResponse(response: ChatResponse): ChatResponse | Promise<ChatResponse>;
  onError(error: AIError): AIError | Promise<AIError>;
}

// 统一错误类型
interface AIError {
  code: ErrorCode;
  message: string;
  provider?: ProviderType;
  statusCode?: number;
  retryable: boolean;
  timestamp: number;
}

enum ErrorCode {
  API_KEY_MISSING = 'API_KEY_MISSING',
  API_KEY_INVALID = 'API_KEY_INVALID',
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  UNKNOWN = 'UNKNOWN',
}
```

---

## 3. 详细设计

### 3.1 统一入口设计

**当前问题**:
- `aiStore.ts` - 管理消息、UI 状态
- `aiFacade.ts` - 管理初始化、Provider 切换
- 两套状态不同步

**解决方案**:
合并到单一 AIService，使用 Zustand 统一管理：

```typescript
// src/features/ai/services/aiService.ts

interface AIState {
  // 消息状态
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  error: AIError | null;

  // Provider 状态
  currentProvider: ProviderType;
  providerConfigs: Map<ProviderType, ProviderConfig>;

  // 使用统计
  usageStats: UsageStats;
}

interface AIActions {
  // 消息操作
  sendMessage(content: string): Promise<void>;
  retryMessage(messageId: string): Promise<void>;
  clearHistory(): void;

  // Provider 操作
  switchProvider(type: ProviderType): Promise<void>;
  configureProvider(type: ProviderType, config: ProviderConfig): Promise<void>;

  // 工具操作
  executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult>;
}

export const useAIService = create<AIState & AIActions>((set, get) => ({
  // 初始状态
  messages: [],
  isLoading: false,
  isStreaming: false,
  error: null,
  currentProvider: 'deepseek',
  providerConfigs: new Map(),
  usageStats: { totalRequests: 0, totalTokens: 0, totalCost: 0 },

  // Actions 实现...
}));
```

### 3.2 Provider 强化设计

**当前问题**:
- `chatStream`/`validateApiKey` 是可选的
- 运行时可能调用不存在的方法

**解决方案**:
创建基类，统一实现：

```typescript
// src/features/ai/services/provider/BaseProvider.ts

abstract class BaseProvider implements LLMProvider {
  abstract chat(messages: Message[], options: ChatOptions): Promise<ChatResponse>;
  abstract chatStream(messages: Message[], options: StreamingOptions): Promise<void>;
  abstract getDefaultModel(): string;
  abstract validateApiKey(apiKey: string): Promise<ValidationResult>;

  // 默认实现
  getCapabilities(): ProviderCapabilities {
    return {
      supportsStreaming: true,
      supportsVision: false,
      supportsFunctionCalling: true,
      maxContextLength: 128000,
      defaultModel: this.getDefaultModel(),
    };
  }

  async listModels(): Promise<ModelInfo[]> {
    return [{ id: this.getDefaultModel(), name: this.getDefaultModel() }];
  }
}
```

### 3.3 中间件设计

**当前问题**:
- 无请求日志
- 错误处理分散

**解决方案**:
添加拦截器层：

```typescript
// src/features/ai/services/middleware/chain.ts

class MiddlewareChain {
  private interceptors: RequestInterceptor[] = [];

  add(interceptor: RequestInterceptor): void {
    this.interceptors.push(interceptor);
  }

  async execute(request: ChatRequest): Promise<ChatResponse> {
    let req = request;

    // 请求前拦截
    for (const interceptor of this.interceptors) {
      req = await interceptor.onRequest(req);
    }

    let response: ChatResponse;
    try {
      response = await this.provider.chat(req.messages, req.options);
    } catch (error) {
      // 错误拦截
      let aiError = this.toAIError(error);
      for (const interceptor of this.interceptors) {
        aiError = await interceptor.onError(aiError) || aiError;
      }
      throw aiError;
    }

    // 响应后拦截
    for (const interceptor of this.interceptors) {
      response = await interceptor.onResponse(response);
    }

    return response;
  }

  private toAIError(error: unknown): AIError {
    // 统一的错误转换逻辑
  }
}
```

### 3.4 错误处理设计

```typescript
// src/features/ai/services/errors/AIError.ts

export class AIError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public provider?: ProviderType,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIError';
  }

  static fromAxios(error: AxiosError, provider: ProviderType): AIError {
    const status = error.response?.status;

    if (status === 401) {
      return new AIError(
        ErrorCode.API_KEY_INVALID,
        'API key is invalid',
        provider,
        401,
        false
      );
    }

    if (status === 429) {
      return new AIError(
        ErrorCode.RATE_LIMIT,
        'Rate limit exceeded',
        provider,
        429,
        true
      );
    }

    if (error.code === 'ECONNABORTED') {
      return new AIError(
        ErrorCode.TIMEOUT,
        'Request timeout',
        provider,
        undefined,
        true
      );
    }

    return new AIError(
      ErrorCode.UNKNOWN,
      error.message,
      provider,
      status,
      false
    );
  }
}
```

---

## 4. 迁移计划

### Phase 1: 统一入口 (Week 1)

| 任务 | 描述 | 风险 |
|------|------|------|
| 1.1 | 创建 AIService (Zustand) | 低 |
| 1.2 | 迁移 aiStore 状态到 AIService | 中 |
| 1.3 | 迁移 aiFacade 方法到 AIService | 中 |
| 1.4 | 更新 AIAssistantScreen 使用 AIService | 低 |

### Phase 2: Provider 强化 (Week 2)

| 任务 | 描述 | 风险 |
|------|------|------|
| 2.1 | 创建 BaseProvider 基类 | 低 |
| 2.2 | 重构 8 个 Provider 继承 BaseProvider | 中 |
| 2.3 | 验证 LLMProvider 接口完整性 | 低 |

### Phase 3: 中间件 (Week 3)

| 任务 | 描述 | 风险 |
|------|------|------|
| 3.1 | 创建 MiddlewareChain | 低 |
| 3.2 | 实现日志拦截器 | 低 |
| 3.3 | 实现错误处理拦截器 | 中 |
| 3.4 | 实现重试拦截器 | 中 |

### Phase 4: 完善 (Week 4)

| 任务 | 描述 | 风险 |
|------|------|------|
| 4.1 | 统一 AIError 类型 | 低 |
| 4.2 | 改进 Token 估算 (可选: 使用 tiktoken) | 中 |
| 4.3 | 清理废弃代码 | 低 |

---

## 5. 验收标准

### 功能验收

- [ ] AIService 统一管理所有状态
- [ ] Provider 切换自动验证 API Key
- [ ] 所有错误返回统一 AIError 类型
- [ ] 请求/响应可被拦截器处理

### 性能验收

- [ ] 现有功能不受影响
- [ ] TypeScript 编译无错误
- [ ] 运行时无类型错误

### 可维护性验收

- [ ] 代码结构清晰，易于理解
- [ ] 新增 Provider 只需继承 BaseProvider
- [ ] 中间件可插拔

---

## 6. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 破坏现有功能 | 高 | 渐进式重构，每步验证 |
| 工作量大 | 中 | 分 4 个 Phase，逐步交付 |
| 类型不兼容 | 中 | 保留旧接口，内部实现新逻辑 |

---

## 7. 待确认问题 (已确认)

| 问题 | 决定 | 理由 |
|------|------|------|
| 简化 API 保留 | ✅ 保留 | 便于外部调用 |
| 精确 Token 估算 | ❌ 不需要 | 当前方案足够 |
| 回归测试 | ✅ 需要 | 确保功能不受影响 |

---

## 8. 设计更新说明

根据评审反馈：
- 保留 aiFacade 作为简化 API 入口
- 继续使用现有 Token 估算方式
- 实施完成后进行完整回归测试

---

*设计人: Claude*
*评审状态: ✅ 已批准*
*批准日期: 2026-03-09*
