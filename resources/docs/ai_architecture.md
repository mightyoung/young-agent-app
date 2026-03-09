# AI模块架构设计

> **引用说明**：
> - 本地向量搜索参考：[sqlite-vec](https://github.com/asg017/sqlite-vec)
> - React Native LLM调用参考：[OpenAI SDK React Native](https://github.com/openai/openai-node)
> - Anthropic SDK参考：[Anthropic Official](https://www.anthropic.com)
> - Skill概念参考：[Anthropic Claude Code Skills](https://docs.anthropic.com/en/docs/claude-code/skills)

---

## 1. AI模块整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI模块架构                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     │
│  │  用户输入   │────▶│  AI服务层   │────▶│  结果处理   │     │
│  │ (文本/语音) │     │  (处理中心)  │     │  (展示/跳转) │     │
│  └─────────────┘     └──────┬──────┘     └─────────────┘     │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐           │
│         ▼                    ▼                    ▼           │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │  意图识别   │     │  本地查询   │     │  云端API    │   │
│  │  (路由)     │     │  (知识库)   │     │  (LLM调用)  │   │
│  └─────────────┘     └──────┬──────┘     └──────┬──────┘   │
│                             │                     │           │
│                             ▼                     ▼           │
│                    ┌─────────────┐     ┌─────────────┐     │
│                    │  向量搜索    │     │  多Provider │     │
│                    │ (可选增强)   │     │ 支持配置    │     │
│                    └─────────────┘     └─────────────┘     │
│                                                                 │
│                    ┌─────────────────────────────────────┐     │
│                    │  Skill系统 (业务流程固化)            │     │
│                    └─────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 多Provider配置

### 2.1 支持的Provider

| Provider | 名称 | Base URL | 模型 |
|---------|------|----------|------|
| openai | OpenAI | https://api.openai.com/v1 | gpt-4 |
| anthropic | Anthropic | https://api.anthropic.com/v1 | claude-3-5-sonnet |
| deepseek | 深度求索 | https://api.deepseek.com/v1 | deepseek-chat |
| minimax | MiniMax | https://api.minimax.chat/v1 | abab6.5s-chat |
| kimi | 月之暗面 | https://api.moonshot.cn/v1 | moonshot-v1-8k |
| doubao | 豆包 | https://ark.cn-beijing.volces.com/api/v3 | doubao-pro-32k |
| glm | 智谱清言 | https://open.bigmodel.cn/api/paas/v4 | glm-4 |
| custom | 自定义 | 用户输入 | 用户输入 |

### 2.2 Provider选择界面

用户首次访问AI助手时，需要进行初始化配置：
1. 选择Provider
2. 输入API Key
3. 验证连接
4. 保存配置

---

## 3. 云端API集成

### 3.1 React Native中调用LLM

**推荐方案：使用fetch自定义封装**

```typescript
// 自定义LLM客户端 - 推荐方案
class LLMClient {
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...this.getProviderHeaders(),
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: messages,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // 流式响应
  async *chatStream(messages: ChatMessage[]): AsyncGenerator<string> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...this.getProviderHeaders(),
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: messages,
        temperature: 0.7,
        stream: true,
      }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;

          const parsed = JSON.parse(data);
          if (parsed.choices[0].delta.content) {
            yield parsed.choices[0].delta.content;
          }
        }
      }
    }
  }

  // Provider特定的headers
  private getProviderHeaders(): Record<string, string> {
    switch (this.config.id) {
      case 'anthropic':
        return { 'anthropic-version': '2023-06-01' };
      default:
        return {};
    }
  }
}
```

### 3.2 API配置管理

```typescript
// API配置管理
class APIKeyManager {
  private storage: MMKV;

  // 设置API Key (加密存储)
  async setApiKey(provider: string, apiKey: string): Promise<void> {
    const encrypted = this.encrypt(apiKey);
    await this.storage.setAsync(`ai_provider_${provider}_key`, encrypted);
  }

  // 获取API Key (解密)
  async getApiKey(provider: string): Promise<string | null> {
    const encrypted = await this.storage.getStringAsync(`ai_provider_${provider}_key`);
    if (!encrypted) return null;
    return this.decrypt(encrypted);
  }

  // 验证API Key
  async verifyApiKey(provider: string, apiKey: string): Promise<boolean> {
    const client = new LLMClient({ ...PROVIDERS.find(p => p.id === provider)!, apiKey });

    try {
      await client.chat([{ role: 'user', content: 'test' }]);
      return true;
    } catch {
      return false;
    }
  }

  // 加密/解密
  private encrypt(text: string): string {
    return EncryptionUtils.encrypt(text, this.getMasterKey());
  }

  private decrypt(encrypted: string): string {
    return EncryptionUtils.decrypt(encrypted, this.getMasterKey());
  }
}
```

---

## 4. 本地轻量级RAG (模式一)

> **引用说明**：
> - 轻量级向量搜索参考：[Simple vector search JS](https://github.com/facebookresearch/faiss/wiki/Getting-started)
> - 本地embedding模型参考：[transformers.js](https://github.com/xenova/transformers.js) - 可以运行在移动端的轻量模型
> - 移动端RAG参考：[LangChain.js Mobile](https://github.com/langchain-ai/langchainjs)

### 4.1 本地RAG架构

```
┌─────────────────────────────────────────────┐
│           本地轻量级RAG架构                    │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐    ┌──────────────┐    │
│  │  用户查询   │───▶│  Embedding  │    │
│  │              │    │  生成器     │    │
│  └──────────────┘    └──────┬───────┘    │
│                              │             │
│                              ▼             │
│                     ┌─────────────────┐   │
│                     │   向量存储      │   │
│                     │  (简化版JS实现) │   │
│                     └──────┬────────┘   │
│                            │             │
│                            ▼             │
│                     ┌─────────────────┐   │
│                     │  相似度搜索    │   │
│                     │  (Top-K)       │   │
│                     └──────┬────────┘   │
│                            │             │
│                            ▼             │
│                     ┌─────────────────┐   │
│                     │   上下文构建    │   │
│                     └──────┬────────┘   │
│                            │             │
│                            ▼             │
│                     ┌─────────────────┐   │
│                     │  本地LLM调用   │   │
│                     │  (用户API Key) │   │
│                     └─────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

### 4.2 Embedding生成策略

```typescript
// Embedding服务 - 支持多种生成方式
class EmbeddingService {
  // 方式一：调用云端API (需要配置embedding API key)
  async generateEmbeddingViaAPI(text: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.embeddingApiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text,
      }),
    });
    const data = await response.json();
    return data.data[0].embedding;
  }

  // 方式二：使用本地轻量模型 (推荐移动端)
  async generateEmbeddingLocal(text: string): Promise<number[]> {
    // 使用transformers.js的轻量模型
    const model = await this.localModel.load('Xenova/all-MiniLM-L6-v2');
    const embeddings = await model.embed(text);
    return Array.from(embeddings);
  }

  // 方式三：使用预计算哈希 (完全离线，无向量)
  async generateHashBased(text: string): Promise<number[]> {
    // 使用文本哈希生成固定向量
    const hash = this.simpleHash(text);
    return this.hashToVector(hash);
  }
}
```

### 4.3 本地向量存储

```typescript
// 轻量级向量存储 - 不依赖WASM
class LocalVectorStore {
  private vectors: Map<string, number[]> = new Map();
  private texts: Map<string, string> = new Map();
  private metadata: Map<string, object> = new Map();

  // 添加向量
  add(id: string, text: string, vector: number[], metadata: object = {}) {
    this.vectors.set(id, vector);
    this.texts.set(id, text);
    this.metadata.set(id, metadata);
  }

  // 搜索
  search(queryVector: number[], topK: number = 5): SearchResult[] {
    const results: SearchResult[] = [];

    for (const [id, vector] of this.vectors) {
      const similarity = this.cosineSimilarity(queryVector, vector);
      results.push({
        id,
        text: this.texts.get(id)!,
        score: similarity,
        metadata: this.metadata.get(id),
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  // 持久化到SQLite
  async persist(db: SQLiteDatabase): Promise<void> {
    await db.execute('CREATE TABLE IF NOT EXISTS vectors (id TEXT PRIMARY KEY, text TEXT, vector TEXT, metadata TEXT)');
    for (const [id, vector] of this.vectors) {
      await db.execute(
        'INSERT OR REPLACE INTO vectors (id, text, vector, metadata) VALUES (?, ?, ?, ?)',
        [id, this.texts.get(id), JSON.stringify(vector), JSON.stringify(this.metadata.get(id))]
      );
    }
  }

  // 从SQLite加载
  async load(db: SQLiteDatabase): Promise<void> {
    const rows = await db.execute('SELECT id, text, vector, metadata FROM vectors');
    for (const row of rows) {
      this.vectors.set(row.id, JSON.parse(row.vector));
      this.texts.set(row.id, row.text);
      this.metadata.set(row.id, JSON.parse(row.metadata));
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}
```

### 4.4 本地RAG配置

```typescript
// 本地RAG配置
interface LocalRAGConfig {
  // Embedding生成方式
  embeddingMode: 'api' | 'local' | 'hash';

  // 云端Embedding API配置 (当embeddingMode为'api'时使用)
  embeddingApi?: {
    provider: 'openai' | 'azure' | 'custom';
    apiKey: string;
    model: string;
  };

  // 本地模型配置 (当embeddingMode为'local'时使用)
  localModel?: {
    modelName: string;  // 如 'Xenova/all-MiniLM-L6-v2'
    quantized: boolean; // 是否量化，减小体积
  };

  // 向量维度
  vectorDimension: number;

  // 相似度阈值
  similarityThreshold: number;
}

// 本地模式配置示例
const localRAGConfig: LocalRAGConfig = {
  embeddingMode: 'api', // 推荐：使用云端API生成embedding
  embeddingApi: {
    provider: 'openai',
    apiKey: '', // 用户配置
    model: 'text-embedding-ada-002',
  },
  vectorDimension: 1536,
  similarityThreshold: 0.7,
};
```

### 4.5 本地RAG检索流程

```typescript
// 本地RAG检索服务
class LocalRAGService {
  private embeddingService: EmbeddingService;
  private vectorStore: LocalVectorStore;
  private config: LocalRAGConfig;

  // 初始化
  async initialize(): Promise<void> {
    // 加载预设知识库
    await this.loadKnowledgeBase();
  }

  // 检索
  async retrieve(query: string, topK: number = 5): Promise<KnowledgeItem[]> {
    // 1. 生成查询向量
    const queryEmbedding = await this.embeddingService.generate(query);

    // 2. 向量搜索
    const results = this.vectorStore.search(queryEmbedding, topK);

    // 3. 过滤低相似度
    return results
      .filter(r => r.score >= this.config.similarityThreshold)
      .map(r => ({
        content: r.text,
        score: r.score,
        metadata: r.metadata,
      }));
  }

  // 构建RAG提示词
  buildPrompt(query: string, context: KnowledgeItem[]): string {
    const contextText = context
      .map((r, i) => `[${i + 1}] ${r.content}`)
      .join('\n\n');

    return `基于以下参考资料回答问题：

参考内容:
${contextText}

问题: ${query}

请根据参考资料回答，如果参考资料无法回答问题，请如实说明。`;
  }
}
```

### 4.1 方案对比

| 方案 | 评价 | 说明 |
|-----|------|------|
| **sqlite-vec** | ★★★★★ | 轻量级SQLite向量扩展，需要WASM编译 |
| **JavaScript实现** | ★★★ | 简单余弦相似度计算，适合轻量场景 |
| **简化版向量搜索** | ★★★★ | 不依赖WASM，实用优先 |

### 4.2 简化版向量搜索 (推荐)

```typescript
// 简化版向量搜索 - 不依赖WASM
class SimpleVectorSearch {
  private vectors: Map<string, number[]>;
  private texts: Map<string, string>;
  private metadata: Map<string, object>;

  add(id: string, text: string, vector: number[], metadata: object = {}) {
    this.vectors.set(id, vector);
    this.texts.set(id, text);
    this.metadata.set(id, metadata);
  }

  search(queryVector: number[], topK: number = 5): SearchResult[] {
    const results: SearchResult[] = [];

    for (const [id, vector] of this.vectors) {
      const similarity = this.cosineSimilarity(queryVector, vector);
      results.push({
        id,
        text: this.texts.get(id)!,
        score: similarity,
        metadata: this.metadata.get(id),
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}
```

---

## 5. Skill系统设计

### 5.1 Skill定义

```typescript
// Skill基础接口
interface AISkill {
  name: string;
  description: string;
  parameters: SkillParam[];
  execute(params: SkillParams): Promise<SkillResult>;
}

// 预定义Skill
const HAZARD_ANALYSIS_SKILL: AISkill = {
  name: 'analyze_hazard',
  description: '分析安全隐患图片，识别隐患类型和风险等级',
  parameters: [
    { name: 'imageUri', type: 'string', required: true },
    { name: 'location', type: 'string', required: false },
  ],
  execute: async (params) => {
    const analysis = await imageRecognitionService.analyze(params.imageUri);
    const suggestions = await knowledgeBaseService.search(analysis.tags, 3);
    return {
      hazardType: analysis.type,
      riskLevel: analysis.risk,
      suggestions: suggestions.map(s => s.content),
    };
  },
};

const QUERY_DEVICE_SKILL: AISkill = {
  name: 'query_device',
  description: '查询设备台账信息',
  parameters: [
    { name: 'keyword', type: 'string', required: false },
    { name: 'deptId', type: 'string', required: false },
  ],
  execute: async (params) => {
    const devices = await deviceRepository.query(params);
    return { total: devices.length, devices };
  },
};
```

### 5.2 Skill管理器

```typescript
class SkillManager {
  private skills: Map<string, AISkill>;

  register(skill: AISkill) {
    this.skills.set(skill.name, skill);
  }

  async execute(skillName: string, params: any): Promise<SkillResult> {
    const skill = this.skills.get(skillName);
    if (!skill) throw new Error(`Skill not found: ${skillName}`);
    return skill.execute(params);
  }

  listSkills(): AISkill[] {
    return Array.from(this.skills.values());
  }
}
```

---

## 6. 云端后台配置

### 6.1 后台服务配置

在个人中心 → 设置中配置：
- 服务端地址
- API Key
- 同步间隔

### 6.2 同步服务功能

- 本地数据上传
- 远程数据下载
- 冲突检测与处理
- 消息推送接收

---

*文档版本：v1.1*
*最后更新：2026-03-04*
