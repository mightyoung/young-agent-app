# S1 流式UI功能实现设计

## 概述

实现 Vercel AI SDK 风格的流式 UI 功能，支持混合模式（文本流式 + 动态组件渲染），完全对齐 `@ai-sdk/react` API。

## 设计目标

- **S1.1**: 实现 `createStreamableUI` 类似功能
- **S1.2**: 支持流式渲染 React 组件
- **S1.3**: 标准化 `createStreamableValue`

## 架构设计

```
src/features/ai/hooks/streaming/
├── createStreamableValue.ts   # 流式值 (S1.3)
├── createStreamableUI.ts      # 流式UI组件 (S1.1)
├── useStreamableValue.ts      # 消费流式值
├── ReactNodeParser.ts         # React 节点解析器 (S1.2)
└── index.ts                  # 统一导出
```

## 核心类型

```typescript
// 流式值类型
type ValueOrPromise<T> = T | Promise<T>;

// 流式更新回调
type StreamUpdate<T> =
  | { done: true; value?: T }
  | { done: false; value: T };

// 流式值接口
interface StreamableValue<T> {
  (onUpdate: (update: StreamUpdate<T>) => void): void;
  readonly value: T | undefined;
  readonly loading: boolean;
}
```

## 实现细节

### S1.3: createStreamableValue

```typescript
function createStreamableValue<T>(initialValue?: T): StreamableValue<T>;
```

- 维护内部状态：value, loading
- 提供 update() 方法触发流式更新
- 支持 Promise 异步值

### S1.1: createStreamableUI

```typescript
function createStreamableUI(options: {
  initialUI?: React.ReactNode;
}): {
  stream: StreamableValue<React.ReactNode>;
  update: (ui: React.ReactNode) => void;
  append: (ui: React.ReactNode) => void;
  done: () => void;
};
```

- 基于 createStreamableValue 构建
- 支持 update（替换）、append（追加）、done（完成）
- 返回 React.ReactNode 流式值

### S1.2: React 节点解析器

- 解析 AI 返回的 JSON 描述
- 转换为实际 React 组件
- 支持内联组件和远程组件

## 使用示例

```typescript
// 创建流式值
const textStream = createStreamableValue<string>('');

// 创建流式UI
const uiStream = createStreamableUI({
  initialUI: null,
});

// AI 流式更新
ai.on('chunk', (chunk) => {
  textStream.update(prev => prev + chunk);
  uiStream.append(<Text>{chunk}</Text>);
});

// 消费
function Component() {
  const value = useStreamableValue(textStream);
  return <>{value}</>;
}
```

## 对齐 Vercel AI SDK

| Vercel API | 本地实现 | 状态 |
|------------|---------|------|
| createStreamableValue | createStreamableValue | S1.3 |
| createStreamableUI | createStreamableUI | S1.1 |
| useStreamableValue | useStreamableValue | S1.2 |
| StreamableObject | StreamableObject | 后续 |

## 技术考量

1. **React Native 适配**
   - 无 Server Components，使用替代方案
   - 使用 React.Context 进行状态传递

2. **类型安全**
   - 完整 TypeScript 泛型支持
   - 与现有 useChat 类型兼容

3. **性能优化**
   - 避免不必要的重渲染
   - 使用 React.memo 优化

## 决策记录

| 日期 | 决策 | 理由 |
|------|------|------|
| 2026-03-09 | 混合模式 | 同时支持文本+组件 |
| 2026-03-09 | API 对齐 | 便于复用和团队学习 |
| 2026-03-09 | 方案1完全对齐 | 风险可控，收益最大 |
