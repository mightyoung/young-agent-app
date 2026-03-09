# useChat Hook 设计文档

## 概述

本文档描述了 `useChat` hook 的设计方案，目标是创建一个简化版的 AI 聊天 Hook，参考 Vercel AI SDK 的设计模式，同时复用现有 `aiService` (Zustand store) 的能力。

**设计参考**: Vercel AI SDK (`@ai-sdk/react`) - 行业领先的 AI 聊天 SDK

**项目参考**: might-young-app 现有 `aiService.ts` 和 `streamingService.ts`

---

## 1. 背景与目标

### 1.1 问题陈述

当前项目存在以下问题：
- `aiService` (Zustand) 功能完整但 API 较复杂
- 缺少标准化状态（如 `status: 'streaming' | 'ready' | 'error'`）
- 缺少常用方法（如 `regenerate`, `setMessages`, `resume`）
- 新开发者需要学习大量 API 才能使用

### 1.2 目标

创建一个简化版 `useChat` hook：
1. **简化集成** - 最少代码接入 AI 功能
2. **状态标准化** - 与 Vercel AI SDK 兼容的状态格式
3. **功能增强** - 添加常用方法
4. **渐进式** - 复用现有代码，平滑演进

---

## 2. API 设计

### 2.1 核心类型定义

```typescript
// 参考 Vercel AI SDK 的状态类型
export type ChatStatus = 'submitted' | 'streaming' | 'ready' | 'error';

// 简化的消息格式
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
  createdAt?: Date;
}
```

### 2.2 Hook 参数

```typescript
export interface UseChatOptions {
  // 初始消息（可选）
  initialMessages?: ChatMessage[];

  // 回调函数
  onFinish?: (message: ChatMessage, messages: ChatMessage[]) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: ChatStatus) => void;

  // 工具调用
  onToolCall?: (toolCall: ToolCall) => void | Promise<void>;

  // 输入配置
  maxInputLength?: number;
  maxMessages?: number; // 消息裁剪阈值
}
```

### 2.3 Hook 返回值

```typescript
export interface UseChatReturn {
  // 状态
  messages: ChatMessage[];
  input: string;
  status: ChatStatus;
  error: Error | null;

  // 方法
  append: (message: ChatMessage) => Promise<void>;
  setInput: (input: string) => void;
  sendMessage: (content: string) => Promise<void>;
  stop: () => void;
  setMessages: (messages: ChatMessage[]) => void;
  reload: () => Promise<void>;
  clear: () => void;
}
```

---

## 3. 架构设计

### 3.1 设计模式

采用 **Facade Pattern (外观模式)**：

```
┌─────────────────────────────────────────────────────┐
│                   useChat Hook                       │
│  (Facade - 简化 API)                                │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│               aiService (Zustand)                   │
│  (已有功能)                                         │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│    streamingService / providerFactory               │
│    (底层服务)                                       │
└─────────────────────────────────────────────────────┘
```

### 3.2 状态映射

| useChat 状态 | aiService 状态 | 说明 |
|-------------|----------------|------|
| `status: 'submitted'` | `isLoading: true` | 消息已发送 |
| `status: 'streaming'` | `isStreaming: true` | 流式响应中 |
| `status: 'ready'` | `!isLoading && !isStreaming` | 完成 |
| `status: 'error'` | `error !== null` | 错误 |

### 3.3 消息格式转换

```typescript
// 从 aiService Message 转换为 ChatMessage
function toChatMessage(msg: Message): ChatMessage {
  return {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createdAt: new Date(msg.timestamp),
  };
}

// 从 ChatMessage 转换回 Message
function toMessage(chatMsg: ChatMessage): Message {
  return {
    id: chatMsg.id,
    role: chatMsg.role,
    content: chatMsg.content,
    timestamp: chatMsg.createdAt?.getTime() || Date.now(),
  };
}
```

---

## 4. 核心方法实现

### 4.1 sendMessage / append

```typescript
const sendMessage = useCallback(async (content: string) => {
  // 1. 创建用户消息
  const userMessage: ChatMessage = {
    id: generateId(),
    role: 'user',
    content,
    createdAt: new Date(),
  };

  // 2. 追加到消息列表
  setMessages(prev => [...prev, userMessage]);
  setStatus('submitted');

  try {
    // 3. 调用 aiService
    setStatus('streaming');

    // 4. 监听流式响应
    await aiService.sendMessage(content);

    // 5. 完成
    setStatus('ready');
  } catch (error) {
    setStatus('error');
    setError(error as Error);
  }
}, [aiService]);
```

### 4.2 reload (重新生成)

```typescript
const reload = useCallback(async () => {
  // 获取最后一条assistant消息
  const lastAssistantMsg = messages
    .filter(m => m.role === 'assistant')
    .pop();

  if (!lastAssistantMsg) return;

  // 移除最后一条消息
  setMessages(prev => prev.slice(0, -1));

  // 重新发送
  await sendMessage(lastAssistantMsg.content);
}, [messages, sendMessage]);
```

### 4.3 setMessages (直接设置消息)

```typescript
const setMessages = useCallback((newMessages: ChatMessage[]) => {
  // 直接更新消息列表（不触发API调用）
  setInternalMessages(newMessages);
}, []);
```

---

## 5. 错误处理

### 5.1 错误分类

| 错误类型 | 状态 | 用户提示 |
|---------|------|---------|
| API_KEY_EXPIRED | error | "API 密钥已过期，请重新配置" |
| NETWORK_ERROR | error | "网络错误，请检查连接" |
| RATE_LIMIT | error | "请求过于频繁，请稍后重试" |
| 其他 | error | "发生错误，请重试" |

### 5.2 重试机制

- 自动重试：网络错误、5xx 错误（最多 3 次）
- 手动重试：`reload()` 方法
- 错误恢复：`resumeStream()` 方法（可选）

---

## 6. 性能优化

### 6.1 消息裁剪

当消息数量超过 `maxMessages` 时，自动裁剪旧消息：

```typescript
const pruneMessages = (messages: ChatMessage[], max: number) => {
  if (messages.length <= max) return messages;

  // 保留系统消息和最近的消息
  const systemMessages = messages.filter(m => m.role === 'system');
  const recentMessages = messages
    .filter(m => m.role !== 'system')
    .slice(-max);

  return [...systemMessages, ...recentMessages];
};
```

### 6.2 防抖输入

输入框使用防抖处理，减少不必要的状态更新。

---

## 7. 文件结构

```
src/features/ai/hooks/
├── index.ts                      # 导出
├── useChat.ts                   # 主 Hook (新建)
├── useChat.types.ts             # 类型定义 (新建)
└── useProviderValidator.ts      # 现有
```

---

## 8. 使用示例

### 8.1 基础用法

```typescript
import { useChat } from './hooks';

function ChatScreen() {
  const { messages, input, setInput, sendMessage, status } = useChat();

  return (
    <View>
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {status === 'streaming' && <LoadingIndicator />}

      <TextInput
        value={input}
        onChangeText={setInput}
        onSubmit={() => sendMessage(input)}
      />
    </View>
  );
}
```

### 8.2 完整用法

```typescript
const {
  messages,
  input,
  status,
  error,
  append,        // 追加消息
  setInput,      // 设置输入
  sendMessage,   // 发送消息
  stop,         // 停止流式
  setMessages,   // 设置消息
  reload,       // 重新生成
  clear,        // 清除
} = useChat({
  initialMessages: [
    { id: '1', role: 'system', content: '你是一个有帮助的助手' }
  ],
  onFinish: (message) => {
    console.log('完成:', message.content);
  },
  onError: (error) => {
    console.error('错误:', error);
  },
  maxMessages: 50,
});
```

---

## 9. 迁移路径

### 9.1 从现有代码迁移

```typescript
// 当前 (复杂)
const {
  messages,
  isLoading,
  isStreaming,
  sendMessage,
  stopStreaming,
} = useAIService();

// 迁移后 (简化)
const {
  messages,
  status, // isLoading → 'submitted', isStreaming → 'streaming'
  sendMessage,
  stop,
} = useChat();
```

### 9.2 共存策略

- 保持 `aiService` 不变
- `useChat` 作为高级封装
- 逐步迁移现有代码

---

## 10. 验收标准

| 功能 | 标准 |
|------|------|
| 消息发送 | 用户输入后消息正确发送到 AI |
| 流式响应 | 流式内容实时显示在 UI |
| 停止功能 | 点击停止后流式立即中断 |
| 重新生成 | reload 方法可以重新生成最后响应 |
| 错误处理 | 错误状态正确显示，错误可恢复 |
| 状态准确 | status 准确反映当前状态 |
| 性能 | 消息量大时无明显卡顿 |

---

## 11. 参考资料

- [Vercel AI SDK - useChat](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat)
- [React Hooks 最佳实践](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Zustand 状态管理](https://github.com/pmndrs/zustand)

---

*文档版本: 1.0*
*创建日期: 2026-03-09*

---

# 实现计划

## 任务分解

### Phase 1: 基础类型和工具函数

| 任务 | 文件 | 描述 |
|------|------|------|
| T1.1 | `useChat.types.ts` | 创建类型定义 (ChatMessage, ChatStatus, UseChatOptions, UseChatReturn) |
| T1.2 | `useChat.utils.ts` | 创建消息格式转换函数 (toChatMessage, toMessage, generateId) |
| T1.3 | `useChat.constants.ts` | 创建常量定义 (默认 maxMessages, status 映射) |

### Phase 2: 核心 Hook 实现

| 任务 | 文件 | 描述 |
|------|------|------|
| T2.1 | `useChat.ts` (基础) | 实现基础状态 (messages, input, status, error) |
| T2.2 | `useChat.ts` (sendMessage) | 实现 sendMessage/append 方法 |
| T2.3 | `useChat.ts` (streaming) | 集成流式响应监听 |
| T2.4 | `useChat.ts` (stop) | 实现 stop 方法停止流式 |
| T2.5 | `useChat.ts` (reload) | 实现 reload 方法重新生成 |
| T2.6 | `useChat.ts` (setMessages) | 实现 setMessages 直接设置消息 |
| T2.7 | `useChat.ts` (clear) | 实现 clear 清除消息 |

### Phase 3: 高级功能

| 任务 | 文件 | 描述 |
|------|------|------|
| T3.1 | `useChat.ts` (消息裁剪) | 实现 maxMessages 裁剪逻辑 |
| T3.2 | `useChat.ts` (回调) | 实现 onFinish, onError, onStatusChange 回调 |
| T3.3 | `useChat.ts` (工具调用) | 实现 onToolCall 工具调用处理 |

### Phase 4: 集成和测试

| 任务 | 文件 | 描述 |
|------|------|------|
| T4.1 | `hooks/index.ts` | 导出 useChat hook |
| T4.2 | `AIAssistantScreen.tsx` | 创建使用 useChat 的示例组件 |
| T4.3 | 测试 | 运行 lint 和 TypeScript 检查 |

## 执行顺序

```
Phase 1 (基础)
  ├── T1.1 类型定义
  ├── T1.2 工具函数
  └── T1.3 常量
        │
        ▼
Phase 2 (核心)
  ├── T2.1 基础状态
  ├── T2.2 sendMessage
  ├── T2.3 流式监听
  ├── T2.4 stop
  ├── T2.5 reload
  ├── T2.6 setMessages
  └── T2.7 clear
        │
        ▼
Phase 3 (高级)
  ├── T3.1 消息裁剪
  ├── T3.2 回调
  └── T3.3 工具调用
        │
        ▼
Phase 4 (集成)
  ├── T4.1 导出
  ├── T4.2 示例
  └── T4.3 测试
```

## 依赖关系

- T2.1 依赖 T1.1, T1.2, T1.3
- T2.2 依赖 T2.1
- T2.3 依赖 T2.2, T1.2
- T2.4 依赖 T2.3
- T2.5 依赖 T2.2
- T3.1 依赖 T2.1
- T3.2 依赖 T2.3
- T4.1 依赖 Phase 1-3 全部
- T4.2 依赖 T4.1
- T4.3 依赖 T4.2

## 预计工作量

| Phase | 任务数 | 预计时间 |
|-------|--------|---------|
| Phase 1 | 3 | 30 分钟 |
| Phase 2 | 7 | 2 小时 |
| Phase 3 | 3 | 1 小时 |
| Phase 4 | 3 | 30 分钟 |
| **总计** | **16** | **4 小时** |
