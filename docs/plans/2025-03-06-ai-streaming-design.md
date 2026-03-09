# AI模块流式响应与配置引导设计

## 概述

本文档描述AI助手的流式响应、思考模式显示、首次配置引导和API Key校验功能的设计方案。

**设计日期**: 2025-03-06
**基于**: DeepSeek、Grok、Gemini等APP的行业最佳实践

---

## 1. 触发机制设计

### 1.1 触发场景

| 场景 | 触发条件 | 显示内容 |
|------|----------|----------|
| 首次访问 | 用户未配置过API Key | 配置引导卡片 |
| API Key失效 | 401错误响应 | 重新配置卡片 |
| 配置缺失 | SecureStorage中无有效Key | 配置引导卡片 |

### 1.2 触发流程

```
用户进入AI助手
      │
      ▼
检查API Key配置状态
      │
      ├── 已配置 → 验证有效性
      │            │
      │            ├── 有效 → 正常对话
      │            │
      │            └── 失效(401) → 显示重新配置卡片
      │
      └── 未配置 → 显示配置引导卡片
```

---

## 2. 消息卡片设计

### 2.1 卡片数据结构

```typescript
interface ActionCard {
  id: string;
  role: 'assistant';
  type: 'action_card';
  content: string;
  timestamp: number;
  actions: Array<{
    label: string;
    action: 'navigate' | 'dismiss' | 'retry';
    target?: string;
  }>;
}
```

### 2.2 引导卡片类型

**初始化引导卡片**
```typescript
{
  id: 'init-guide',
  role: 'assistant',
  type: 'action_card',
  content: '您好！我是Young-agentAI助手。为了更好地为您服务，请先配置AI模型。',
  timestamp: Date.now(),
  actions: [
    { label: '去配置', action: 'navigate', target: 'config' },
    { label: '稍后再说', action: 'dismiss' }
  ]
}
```

**API Key失效卡片**
```typescript
{
  id: 'key-expired',
  role: 'assistant',
  type: 'action_card',
  content: 'AI服务连接失败，API Key可能已失效。请重新配置后继续使用。',
  timestamp: Date.now(),
  actions: [
    { label: '重新配置', action: 'navigate', target: 'config' },
    { label: '重试连接', action: 'retry' }
  ]
}
```

### 2.3 卡片渲染组件

```tsx
<ActionCardMessage
  content={message.content}
  actions={message.actions}
  onAction={(action, target) => {
    if (action === 'navigate') {
      navigation.navigate(target);
    } else if (action === 'retry') {
      retryConnection();
    } else if (action === 'dismiss') {
      dismissCard();
    }
  }}
/>
```

---

## 3. 配置界面设计

### 3.1 配置Modal/页面

```
┌─────────────────────────────────────────────┐
│  ╳  关闭                                  │
│                                             │
│  AI 配置                                    │
│                                             │
│  选择模型                                    │
│  ┌─────────────────────────────────────┐    │
│  │ [DeepSeek] [OpenAI] [Anthropic]    │    │
│  │ [MiniMax]  [Kimi]    [更多...]     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  API Key                                    │
│  ┌─────────────────────────────────────┐    │
│  │ sk-xxxxx...                    👁   │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │         [ 测试连接 ]                   │    │
│  │    ○○○  等待中... / ✓  连接成功       │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │         [ 保存并使用 ]                 │    │
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

### 3.2 连接测试流程

```
用户输入API Key
      │
      ▼
点击"测试连接"
      │
      ├── 正在测试... → 显示加载状态
      │
      ├── 测试成功 → 显示成功状态 + 启用保存按钮
      │
      └── 测试失败 → 显示错误信息 + 保留输入内容
```

### 3.3 API Key验证实现

```typescript
async function validateApiKey(provider: ProviderType, apiKey: string): Promise<ValidationResult> {
  try {
    const testMessage = [{ role: 'user', content: 'hi' }];
    const provider = createProvider(provider, apiKey);
    await provider.chat(testMessage, { maxTokens: 5 });
    return { valid: true };
  } catch (error) {
    if (error.status === 401) {
      return { valid: false, error: 'API Key无效' };
    }
    return { valid: false, error: error.message };
  }
}
```

---

## 4. 思考模式设计

### 4.1 思考内容检测

不同Provider的思考内容字段：

| Provider | 字段名 | 位置 |
|----------|--------|------|
| DeepSeek | `reasoning_content` | `choices[0].message` |
| Anthropic | `thinking` | `content[]` block |
| 其他 | 本地模拟 | prompt引导 |

### 4.2 思考区域UI

**固定2行高度，滚动查看**

```tsx
<View style={styles.thinkingContainer}>
  {/* 头部：进度指示 */}
  <View style={styles.thinkingHeader}>
    <Ionicons name="bulb-outline" size={14} color="#999" />
    <Text style={styles.thinkingLabel}>思考中</Text>
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: progress }]} />
    </View>
  </View>

  {/* 内容：可滚动 */}
  <ScrollView
    style={styles.thinkingScroll}
    showsVerticalScrollIndicator={true}
    nestedScrollEnabled={true}
  >
    <Text style={styles.thinkingText}>
      {thinkingContent}
    </Text>
  </ScrollView>
</View>
```

### 4.3 样式 (DeepSeek风格)

```typescript
const styles = StyleSheet.create({
  thinkingContainer: {
    backgroundColor: '#F7F7F7',  // 浅灰色背景
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    maxHeight: 80,  // 固定2行高度
  },
  thinkingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  thinkingLabel: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    marginLeft: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  thinkingScroll: {
    maxHeight: 50,
  },
  thinkingText: {
    fontStyle: 'italic',  // 斜体
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});
```

---

## 5. 打字机效果设计

### 5.1 词组缓冲区模式

```typescript
interface StreamingState {
  buffer: string[];      // 待显示词组队列
  displayText: string;   // 当前已显示内容
  isComplete: boolean;  // 流式是否结束
  isThinking: boolean;  // 是否正在思考
}
```

### 5.2 实现逻辑

```typescript
// 收到chunk时
const handleChunk = (chunk: string, isThinking: boolean) => {
  // 思考内容或回复内容
  const targetBuffer = isThinking ? 'thinkingBuffer' : 'contentBuffer';

  // 按空格/punctuation分割为词组
  const words = chunk.split(/(\s+|[，。！？、；：""''（）])/);
  setStreamingState(prev => ({
    ...prev,
    [targetBuffer]: [...prev[targetBuffer], ...words]
  }));
};

// 动画帧处理 - 80ms间隔
useEffect(() => {
  const processNextWord = () => {
    const buffers = isThinking
      ? { source: streamingState.thinkingBuffer, target: 'thinkingDisplay' }
      : { source: streamingState.contentBuffer, target: 'contentDisplay' };

    if (buffers.source.length > 0 && !isPaused) {
      const word = buffers.source[0];
      setStreamingState(prev => ({
        ...prev,
        [buffers.target]: prev[buffers.target] + word,
        [buffers.source]: prev[buffers.source].slice(1)
      }));

      // 80ms后处理下一个词
      setTimeout(processNextWord, 80);
    } else if (buffers.source.length === 0 && !streamingState.isComplete) {
      // 缓冲区空但未完成，继续等待
      setTimeout(processNextWord, 50);
    }
  };

  processNextWord();
}, [streamingState, isPaused, streamingState.isComplete]);
```

### 5.3 消息渲染组件

```tsx
<View style={styles.messageContainer}>
  {/* 思考区域 - 仅在有思考内容时显示 */}
  {thinkingDisplay.length > 0 && (
    <ThinkingView
      content={thinkingDisplay}
      progress={calculateProgress()}
      isComplete={isThinkingComplete}
    />
  )}

  {/* 回复内容 - 打字机效果 */}
  <View style={[styles.messageBubble, isUser && styles.userBubble]}>
    <Text style={styles.messageText}>
      {contentDisplay}
      {isComplete || isThinking && <Text style={styles.cursor}>▌</Text>}
    </Text>
  </View>
</View>
```

---

## 6. 数据流设计

```
┌─────────────────────────────────────────────────────────────┐
│                      数据流图                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  用户输入 ──► Provider.chatStream() ──► SSE流              │
│                              │                              │
│                              ▼                              │
│                       onChunk回调                           │
│                              │                              │
│              ┌───────────────┼───────────────┐              │
│              ▼               ▼               ▼              │
│       ┌──────────┐   ┌──────────┐   ┌──────────┐        │
│       │思考内容  │   │回复内容  │   │进度更新  │        │
│       │缓冲区   │   │缓冲区   │   │          │        │
│       └────┬─────┘   └────┬─────┘   └──────────┘        │
│              │              │                              │
│              ▼              ▼                              │
│       ┌─────────────────────────────────┐                │
│       │     动画帧处理 (80ms间隔)        │                │
│       └──────────────┬──────────────────┘                │
│                      │                                     │
│           ┌──────────┴──────────┐                         │
│           ▼                     ▼                          │
│    ┌────────────┐       ┌────────────┐                   │
│    │思考显示更新 │       │内容显示更新 │                   │
│    │(Thinking)  │       │(Message)   │                   │
│    └────────────┘       └────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. 组件结构

```
src/features/ai/
├── components/
│   ├── ActionCard.tsx        # 引导卡片组件
│   ├── ThinkingView.tsx      # 思考模式显示组件
│   ├── StreamingMessage.tsx  # 流式消息组件
│   └── ConfigModal.tsx       # 配置弹窗组件
├── services/
│   ├── provider/
│   │   └── streaming.ts      # 流式响应处理
│   └── validation.ts         # API Key验证
└── screens/
    └── AIAssistantScreen.tsx  # 主聊天页面（更新）
```

---

## 8. 验收标准

| 功能 | 验收条件 |
|------|----------|
| 首次访问引导 | 未配置API Key时显示引导卡片 |
| API Key失效处理 | 401错误时显示重新配置卡片 |
| 配置流程 | 选择Provider → 输入Key → 测试 → 保存 |
| 思考模式显示 | 固定2行高度，滚动查看，DeepSeek风格 |
| 打字机效果 | 词组逐批显示，80ms间隔 |
| 流式响应 | 支持DeepSeek流式，其他Provider降级 |

---

## 9. 技术依赖

- react-native-reanimated (动画)
- expo-secure-store (安全存储)
- axios (HTTP客户端，需支持stream)
- zustand (状态管理)

---

*文档版本: 1.0*
*创建日期: 2025-03-06*
