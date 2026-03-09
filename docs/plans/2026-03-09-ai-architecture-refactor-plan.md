# AI 模块架构重构实施计划

**基于设计文档**: docs/plans/2026-03-09-ai-architecture-refactor-design.md
**创建日期**: 2026-03-09
**状态**: 待执行

---

## 概述

本计划将 AI 模块从现有的双入口架构（aiStore + aiFacade）重构为统一的 AIService 架构。

### 现有架构
```
AIAssistantScreen
    ├── aiStore (Zustand) - 消息、UI状态
    └── aiFacade (Singleton) - 初始化、Provider切换
```

### 目标架构
```
AIAssistantScreen
    └── AIService (Zustand) - 统一管理所有状态和操作
```

---

## Phase 1: 统一入口

**目标**: 合并 aiStore + aiFacade 到统一的 AIService
**风险**: 中等
**预计时间**: 1 周

### Task 1.1: 创建 AIService 基础结构

**文件**: `src/features/ai/services/aiService.ts` (新建)

```typescript
import { create } from 'zustand';
import type { Message, ProviderType, ProviderCapabilities, ModelInfo } from './types';
import { providerFactory } from './provider/factory';
import { streamingService } from './streaming';
import { toolRegistry } from './tools';
import { usageTrackingService } from './provider/usageTracking';

interface AIState {
  // 消息状态
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;

  // Provider 状态
  currentProvider: ProviderType;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  clearHistory: () => void;
  switchProvider: (type: ProviderType) => Promise<void>;
}

export const useAIService = create<AIState>((set, get) => ({
  // 初始状态
  messages: [],
  isLoading: false,
  isStreaming: false,
  error: null,
  currentProvider: 'deepseek',

  // Actions...
}));
```

**验证**: TypeScript 编译通过

---

### Task 1.2: 实现 AIService 核心方法

需要实现以下方法，从 aiStore.ts 和 aiFacade.ts 迁移：

| 方法 | 来源 | 复杂度 |
|------|------|--------|
| sendMessage | aiStore | 高 |
| retryMessage | aiStore | 中 |
| clearHistory | aiStore | 低 |
| switchProvider | aiFacade | 中 |
| getStatus | aiFacade | 低 |
| getModels | aiFacade | 低 |

**验证**: 方法签名与现有代码兼容

---

### Task 1.3: 创建 Provider 验证 Hook

**文件**: `src/features/ai/hooks/useProviderValidator.ts` (新建)

```typescript
import { useState, useCallback } from 'react';
import { providerFactory } from '../services/provider/factory';
import type { ProviderType } from '../services/types';

export function useProviderValidator() {
  const [validating, setValidating] = useState(false);

  const validateAndSwitch = useCallback(async (type: ProviderType) => {
    setValidating(true);
    try {
      const result = await providerFactory.validateApiKey(type);
      if (result.valid) {
        await providerFactory.switchProvider(type);
        return { success: true };
      }
      return { success: false, error: result.error };
    } finally {
      setValidating(false);
    }
  }, []);

  return { validateAndSwitch, validating };
}
```

**验证**: Hook 可以正常导入和使用

---

### Task 1.4: 更新组件使用 AIService

需要更新的组件：

| 组件 | 改动 |
|------|------|
| AIAssistantScreen.tsx | 从 aiStore 切换到 useAIService |
| AIProfileScreen.tsx | 使用新的 provider 切换 API |

**验证**: UI 功能正常工作

---

## Phase 2: Provider 强化

**目标**: 创建 BaseProvider 基类，统一 Provider 实现
**风险**: 中等
**预计时间**: 1 周

### Task 2.1: 创建 BaseProvider 抽象基类

**文件**: `src/features/ai/services/provider/BaseProvider.ts` (新建)

```typescript
import type {
  Message, ChatOptions, ChatResponse,
  StreamingOptions, ProviderCapabilities, ModelInfo
} from '../types';

export abstract class BaseProvider {
  abstract chat(messages: Message[], options: ChatOptions): Promise<ChatResponse>;
  abstract chatStream(messages: Message[], options: StreamingOptions): Promise<void>;
  abstract getDefaultModel(): string;
  abstract validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }>;

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

**验证**: TypeScript 编译通过

---

### Task 2.2: 重构现有 Providers 继承 BaseProvider

需要重构的文件（8个）：

| Provider | 文件 |
|----------|------|
| OpenAI | provider/openai.ts |
| Anthropic | provider/anthropic.ts |
| DeepSeek | provider/deepseek.ts |
| MiniMax | provider/minimax.ts |
| Kimi | provider/kimi.ts |
| Doubao | provider/doubao.ts |
| GLM | provider/glm.ts |
| Custom | provider/custom.ts |

每个文件的改动：
```typescript
// 从
export class OpenAIProvider implements LLMProvider {

// 改为
export class OpenAIProvider extends BaseProvider {
```

**验证**: 所有 Provider 编译通过，功能正常

---

### Task 2.3: 验证 LLMProvider 接口完整性

检查所有 Provider 实现：

```bash
grep -r "implements LLMProvider" src/features/ai/services/provider/
```

预期结果: 无结果（应改为 extends BaseProvider）

**验证**: 接口方法完整，无类型错误

---

## Phase 3: 中间件

**目标**: 添加请求拦截器和统一错误处理
**风险**: 中等
**预计时间**: 1 周

### Task 3.1: 创建 AIError 统一错误类

**文件**: `src/features/ai/services/errors/AIError.ts` (新建)

```typescript
export enum ErrorCode {
  API_KEY_MISSING = 'API_KEY_MISSING',
  API_KEY_INVALID = 'API_KEY_INVALID',
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export class AIError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public provider?: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIError';
  }
}
```

**验证**: 错误类型可以正确导入和使用

---

### Task 3.2: 创建 MiddlewareChain

**文件**: `src/features/ai/services/middleware/chain.ts` (新建)

```typescript
import type { Message, ChatOptions, ChatResponse } from '../types';
import { AIError, ErrorCode } from '../errors/AIError';

interface ChatRequest {
  messages: Message[];
  options: ChatOptions;
}

interface RequestInterceptor {
  onRequest(request: ChatRequest): ChatRequest | Promise<ChatRequest>;
  onResponse(response: ChatResponse): ChatResponse | Promise<ChatResponse>;
  onError(error: AIError): AIError | Promise<AIError>;
}

class MiddlewareChain {
  private interceptors: RequestInterceptor[] = [];

  add(interceptor: RequestInterceptor): void {
    this.interceptors.push(interceptor);
  }

  async execute(
    provider: any,
    request: ChatRequest
  ): Promise<ChatResponse> {
    let req = request;
    for (const interceptor of this.interceptors) {
      req = await interceptor.onRequest(req);
    }

    try {
      const response = await provider.chat(req.messages, req.options);
      for (const interceptor of this.interceptors) {
        return await interceptor.onResponse(response);
      }
      return response;
    } catch (error) {
      let aiError = this.toAIError(error);
      for (const interceptor of this.interceptors) {
        aiError = await interceptor.onError(aiError) || aiError;
      }
      throw aiError;
    }
  }

  private toAIError(error: unknown): AIError {
    // 转换逻辑
  }
}
```

**验证**: 中间件链可以正常添加和执行

---

### Task 3.3: 实现日志拦截器

**文件**: `src/features/ai/services/middleware/LoggerInterceptor.ts` (新建)

```typescript
export class LoggerInterceptor implements RequestInterceptor {
  onRequest(request: ChatRequest): ChatRequest {
    console.log('[AI Request]', {
      messageCount: request.messages.length,
      model: request.options.model,
    });
    return request;
  }

  onResponse(response: ChatResponse): ChatResponse {
    console.log('[AI Response]', {
      contentLength: response.content.length,
      tokens: response.usage,
    });
    return response;
  }

  onError(error: AIError): AIError {
    console.error('[AI Error]', {
      code: error.code,
      message: error.message,
      provider: error.provider,
    });
    return error;
  }
}
```

**验证**: 日志正确输出

---

### Task 3.4: 实现重试拦截器

**文件**: `src/features/ai/services/middleware/RetryInterceptor.ts` (新建)

```typescript
export class RetryInterceptor implements RequestInterceptor {
  constructor(
    private maxRetries: number = 3,
    private initialDelay: number = 1000
  ) {}

  async onRequest(request: ChatRequest): Promise<ChatRequest> {
    return request;
  }

  onResponse(response: ChatResponse): ChatResponse {
    return response;
  }

  async onError(error: AIError): Promise<AIError> {
    if (!error.retryable || error.retryCount >= this.maxRetries) {
      return error;
    }

    // 指数退避
    const delay = this.initialDelay * Math.pow(2, error.retryCount);
    await new Promise(r => setTimeout(r, delay));

    error.retryCount++;
    throw error;
  }
}
```

**验证**: 错误时正确重试

---

## Phase 4: 完善

**目标**: 统一错误类型、清理代码
**风险**: 低
**预计时间**: 1 周

### Task 4.1: 统一所有 Provider 使用 AIError

更新所有 Provider 的错误抛出逻辑：

```typescript
// 旧代码
throw new Error('API key invalid');

// 新代码
throw new AIError(ErrorCode.API_KEY_INVALID, 'API key invalid', this.providerType, 401);
```

**验证**: 所有错误使用统一类型

---

### Task 4.2: 清理废弃代码

识别并删除：

| 代码 | 原因 |
|------|------|
| aiStore 中的重复方法 | 已迁移到 AIService |
| aiFacade 中的简化方法 | 如需保留，标记为废弃 |

**验证**: 无废弃代码警告

---

### Task 4.3: 回归测试

运行以下测试：

```bash
# TypeScript 编译
npx tsc --noEmit

# E2E 测试 (如果有)
npm run test:e2e

# 手动验证
# 1. 发送消息正常
# 2. Provider 切换正常
# 3. 错误处理正常
```

**验证**: 所有测试通过

---

## 文件变更汇总

### 新建文件

| 文件 | Phase |
|------|-------|
| src/features/ai/services/aiService.ts | 1 |
| src/features/ai/hooks/useProviderValidator.ts | 1 |
| src/features/ai/services/provider/BaseProvider.ts | 2 |
| src/features/ai/services/errors/AIError.ts | 3 |
| src/features/ai/services/middleware/chain.ts | 3 |
| src/features/ai/services/middleware/LoggerInterceptor.ts | 3 |
| src/features/ai/services/middleware/RetryInterceptor.ts | 3 |

### 修改文件

| 文件 | Phase | 改动 |
|------|-------|------|
| src/features/ai/services/index.ts | 1 | 导出 AIService |
| src/features/ai/stores/aiStore.ts | 1 | 标记废弃，委托给 AIService |
| src/features/ai/services/aiFacade.ts | 1 | 保留，委托给 AIService |
| src/features/ai/screens/AIAssistantScreen.tsx | 1 | 使用 AIService |
| src/features/ai/services/provider/*.ts | 2 | extends BaseProvider |
| src/features/ai/services/provider/factory.ts | 3 | 使用 AIError |

### 删除文件

无（所有文件保留，标记废弃）

---

## 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| 破坏现有功能 | 渐进式重构，每步验证 |
| 类型不兼容 | 保留旧接口，内部实现新逻辑 |
| 工作量大 | 分 4 个 Phase，逐步交付 |

---

## 验收标准

- [ ] AIService 统一管理所有状态
- [ ] Provider 切换自动验证 API Key
- [ ] 所有错误返回统一 AIError 类型
- [ ] 请求/响应可被拦截器处理
- [ ] TypeScript 编译无错误
- [ ] 回归测试通过

---

*计划创建: 2026-03-09*
*状态: 待执行*
