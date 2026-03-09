# 双模式运行架构设计

> **引用说明**：
> - 多租户架构参考：[Multi-Tenant SaaS Architecture](https://docs.microsoft.com/en-us/azure/azure-sql/database/saas-tenancy-app-design-patterns)
> - 连接池管理参考：[PgBouncer](https://www.pgbouncer.org/), [Prisma Connection Pool](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
> - WebSocket管理参考：[Socket.io](https://socket.io/), [ws Library](https://github.com/websockets/ws)
> - 三级RAG参考：[LangChain Multi-Tenant RAG](https://github.com/langchain-ai/langchainjs), [Qdrant](https://github.com/qdrant/qdrant)
> - 向量数据库参考：[Qdrant](https://github.com/qdrant/qdrant), [Weaviate](https://github.com/weaviate/weaviate), [Chroma](https://github.com/chroma-core/chroma)
> - 会话管理参考：[Socket.io Rooms](https://socket.io/docs/v4/rooms/)

---

## 1. 两种运行模式概述

```
┌─────────────────────────────────────────────────────────────────┐
│                     双模式运行架构                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  模式一：本地模式                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  React Native App                                        │   │
│  │  ├── 本地SQLite存储                                      │   │
│  │  ├── 简化版向量搜索                                      │   │
│  │  └── 云端LLM API (用户配置API Key)                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  模式二：云端模式                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  React Native App                                        │   │
│  │  ├── 本地缓存                                            │   │
│  │  └── 连接云端服务 ←──→ 云端三级RAG                     │   │
│  │                                                            │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │  云端服务端                                        │    │   │
│  │  │  ├── 连接池管理                                    │    │   │
│  │  │  ├── 多终端会话管理                                 │    │   │
│  │  │  ├── 三级RAG存储                                   │    │   │
│  │  │  └── AI服务编排                                    │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 模式一：本地模式（本地 + 云端API Key）

### 2.1 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    本地模式架构                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    React Native App                   │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │              本地数据层                      │   │   │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  │   │   │
│  │  │  │ SQLite  │  │  MMKV   │  │ 文件系统│  │   │   │
│  │  │  │ (结构化)│  │ (配置)  │  │ (图片) │  │   │   │
│  │  │  └─────────┘  └─────────┘  └─────────┘  │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                        │                             │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │              AI服务层                        │   │   │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐   │   │   │
│  │  │  │意图路由 │  │本地查询 │  │Skill执行│   │   │   │
│  │  │  └────┬────┘  └────┬────┘  └────┬────┘   │   │   │
│  │  │       │              │              │         │   │   │
│  │  │       └──────────────┼──────────────┘         │   │   │
│  │  │                      │                        │   │   │
│  │  │              ┌──────┴──────┐               │   │   │
│  │  │              │  多Provider   │               │   │   │
│  │  │              │  LLM客户端   │               │   │   │
│  │  │              └──────┬──────┘               │   │   │
│  │  └──────────────────────┼────────────────────────┘   │   │
│  └────────────────────────┼─────────────────────────────┘   │
│                           │                                   │
│                           ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    云端LLM服务                         │  │
│  │        OpenAI / Anthropic / DeepSeek / Kimi...       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 功能特性

| 功能 | 实现方式 |
|-----|---------|
| 数据存储 | 本地SQLite |
| 向量搜索 | 简化版JavaScript实现 |
| AI对话 | 用户配置API Key，直接调用云端 |
| 知识库 | 本地预设 + 用户扩展 |
| Skill执行 | 本地执行 |
| 同步 | 预留接口，待云端模式接入 |

---

## 3. 模式二：云端模式（本地 + 云端服务）

### 3.1 云端服务架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     云端服务架构                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    入口层 (API Gateway)                 │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐       │   │
│  │  │  限流     │ │  鉴权     │ │  路由     │       │   │
│  │  │  RateLimit│ │  Auth     │ │  Router   │       │   │
│  │  └────────────┘ └────────────┘ └────────────┘       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌───────────────────────────┼───────────────────────────┐   │
│  │                    连接池管理层                          │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │              连接池 (Connection Pool)          │  │   │
│  │  │                                                │  │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │   │
│  │  │  │  App-1   │  │  App-2   │  │  App-N   │ │  │   │
│  │  │  │ 会话1    │  │  会话2    │  │  会话N    │ │  │   │
│  │  │  └──────────┘  └──────────┘  └──────────┘ │  │   │
│  │  │                                                │  │   │
│  │  │  ┌────────────────────────────────────────┐  │  │   │
│  │  │  │         会话管理器 (Session Manager)     │  │  │   │
│  │  │  │  • 用户-会话映射                       │  │   │
│  │  │  │  • 多端同步                            │  │   │
│  │  │  │  • 上下文管理                          │  │   │
│  │  │  └────────────────────────────────────────┘  │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └───────────────────────────┬───────────────────────────┘   │
│                              │                                  │
│  ┌───────────────────────────┼───────────────────────────┐   │
│  │                    业务服务层                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │   │
│  │  │  用户服务   │  │  设备服务   │  │  巡检服务   │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │   │
│  │  │  隐患服务   │  │  消息服务   │  │  AI服务    │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │   │
│  └───────────────────────────┬───────────────────────────┘   │
│                              │                                  │
│  ┌───────────────────────────┼───────────────────────────┐   │
│  │                    数据存储层                          │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │           三级RAG存储架构                       │  │   │
│  │  │                                                │  │   │
│  │  │  ┌────────────┐  ┌────────────┐             │  │   │
│  │  │  │ 用户级RAG  │  │ 部门级RAG  │             │  │   │
│  │  │  │ User-RAG   │  │ Dept-RAG   │             │  │   │
│  │  │  └────────────┘  └────────────┘             │  │   │
│  │  │                                                │  │   │
│  │  │              ┌────────────┐                   │  │   │
│  │  │              │ 企业级RAG  │                   │  │   │
│  │  │              │Ent-RAG    │                   │  │   │
│  │  │              └────────────┘                   │  │   │
│  │  │                                                │  │   │
│  │  │  ┌────────────────────────────────────────┐  │  │   │
│  │  │  │         向量数据库 (Qdrant/Weaviate)   │  │   │
│  │  │  └────────────────────────────────────────┘  │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 连接池管理

```typescript
// 连接池管理器
class ConnectionPoolManager {
  private pools: Map<string, ConnectionPool>;
  private maxConnections: number = 100;

  // 获取连接
  async acquire(userId: string): Promise<Connection> {
    const pool = this.getPoolForUser(userId);
    return pool.acquire();
  }

  // 释放连接
  async release(userId: string, connection: Connection): Promise<void> {
    const pool = this.getPoolForUser(userId);
    pool.release(connection);
  }

  // 心跳检测
  async healthCheck(): Promise<void> {
    for (const pool of this.pools.values()) {
      await pool.healthCheck();
    }
  }

  // 自动重连
  async reconnect(connection: Connection): Promise<Connection> {
    // 重试逻辑
  }
}

// WebSocket连接管理
class WebSocketManager {
  private connections: Map<string, WebSocketConnection>;
  private heartbeatInterval: number = 30000;

  // 建立连接
  connect(userId: string, token: string): WebSocketConnection {
    const ws = new WebSocket(`wss://api.example.com/ws?token=${token}`);

    ws.on('message', (data) => this.handleMessage(userId, data));
    ws.on('close', () => this.handleClose(userId));
    ws.on('error', (error) => this.handleError(userId, error));

    this.connections.set(userId, ws);
    return ws;
  }

  // 消息广播
  broadcast(userId: string, message: any): void {
    const connection = this.connections.get(userId);
    if (connection && connection.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify(message));
    }
  }
}
```

### 3.3 多终端会话管理

```typescript
// 会话管理器
class SessionManager {
  private sessions: Map<string, UserSession>;
  private contextCache: RedisCache;

  // 创建会话
  createSession(userId: string, deviceId: string): UserSession {
    const session: UserSession = {
      sessionId: uuid(),
      userId,
      deviceId,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      messages: [],
      context: {},
    };

    this.sessions.set(session.sessionId, session);
    return session;
  }

  // 获取用户所有会话
  getUserSessions(userId: string): UserSession[] {
    return Array.from(this.sessions.values())
      .filter(s => s.userId === userId);
  }

  // 添加消息
  addMessage(sessionId: string, message: ChatMessage): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages.push(message);
      session.lastActiveAt = new Date();
      // 同步到其他终端
      this.syncToDevices(session);
    }
  }

  // 多端同步
  private async syncToDevices(session: UserSession): Promise<void> {
    const userSessions = this.getUserSessions(session.userId);
    for (const s of userSessions) {
      if (s.sessionId !== session.sessionId) {
        // 通过WebSocket推送
        this.webSocketManager.send(s.sessionId, {
          type: 'new_message',
          data: session.messages[session.messages.length - 1],
        });
      }
    }
  }
}
```

---

## 4. 三级RAG存储架构

### 4.1 架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                    三级RAG存储架构                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Level 1: 用户级 RAG (User-Level)                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  存储内容:                                                │   │
│  │  • 个人隐患查询历史                                       │   │
│  │  • 个人检查记录                                           │   │
│  │  • 个人AI对话记录                                        │   │
│  │  • 个人收藏的知识                                         │   │
│  │                                                          │   │
│  │  隔离方式: user_id                                       │   │
│  │  存储位置: users/{user_id}/knowledge/                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  Level 2: 部门级 RAG (Department-Level)                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  存储内容:                                                │   │
│  │  • 部门设备台账                                          │   │
│  │  • 部门隐患统计                                          │   │
│  │  • 部门巡检任务                                          │   │
│  │  • 部门知识库                                            │   │
│  │                                                          │   │
│  │  隔离方式: dept_id                                       │   │
│  │  存储位置: departments/{dept_id}/knowledge/             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  Level 3: 企业级 RAG (Enterprise-Level)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  存储内容:                                                │   │
│  │  • 企业安全标准                                          │   │
│  │  • 全局知识库                                            │   │
│  │  • 跨部门报表                                            │   │
│  │  • 企业公告                                               │   │
│  │                                                          │   │
│  │  隔离方式: enterprise_id                                  │   │
│  │  存储位置: enterprises/{enterprise_id}/knowledge/        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 逻辑隔离实现

```typescript
// 三级RAG检索服务
class ThreeLevelRAGService {
  private vectorStore: VectorStore;
  private userContext: UserContext;

  // 检索入口
  async retrieve(query: string): Promise<RAGResult> {
    const results = {
      user: await this.searchUserLevel(query),
      department: await this.searchDepartmentLevel(query),
      enterprise: await this.searchEnterpriseLevel(query),
    };

    // 按权限优先级合并
    return this.mergeByPriority(results);
  }

  // 用户级搜索
  private async searchUserLevel(query: string): Promise<KnowledgeResult[]> {
    return this.vectorStore.search({
      query,
      filter: { user_id: this.userContext.userId },
      level: 'user',
    });
  }

  // 部门级搜索
  private async searchDepartmentLevel(query: string): Promise<KnowledgeResult[]> {
    return this.vectorStore.search({
      query,
      filter: { dept_id: this.userContext.deptId },
      level: 'department',
    });
  }

  // 企业级搜索
  private async searchEnterpriseLevel(query: string): Promise<KnowledgeResult[]> {
    return this.vectorStore.search({
      query,
      filter: { enterprise_id: this.userContext.enterpriseId },
      level: 'enterprise',
    });
  }

  // 按权限合并结果
  private mergeByPriority(results: LevelResults): RAGResult {
    const { user, department, enterprise } = results;
    const permission = this.userContext.permissionLevel;

    // 权限优先级: user > department > enterprise
    const combined: KnowledgeItem[] = [];

    if (permission.includes('user')) {
      combined.push(...user);
    }
    if (permission.includes('department')) {
      combined.push(...department);
    }
    if (permission.includes('enterprise')) {
      combined.push(...enterprise);
    }

    // 按相关性排序
    combined.sort((a, b) => b.score - a.score);

    return {
      items: combined.slice(0, 10),
      sources: {
        user: user.length,
        department: department.length,
        enterprise: enterprise.length,
      },
    };
  }
}
```

### 4.3 数据模型设计

```sql
-- 三级RAG数据表设计

-- 用户级知识表
CREATE TABLE user_knowledge (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 部门级知识表
CREATE TABLE department_knowledge (
    id UUID PRIMARY KEY,
    dept_id UUID NOT NULL,
    enterprise_id UUID NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 企业级知识表
CREATE TABLE enterprise_knowledge (
    id UUID PRIMARY KEY,
    enterprise_id UUID NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_user_knowledge_user ON user_knowledge(user_id);
CREATE INDEX idx_dept_knowledge_dept ON department_knowledge(dept_id);
CREATE INDEX idx_ent_knowledge_ent ON enterprise_knowledge(enterprise_id);

-- 向量索引 (使用pgvector或qdrant)
CREATE INDEX idx_user_knowledge_emb ON user_knowledge USING ivfflat(embedding vector_cosine_ops);
```

### 4.4 隔离策略对比

| 隔离级别 | 实现方式 | 查询性能 | 存储成本 | 安全性 |
|---------|---------|---------|---------|--------|
| 用户级 | 逻辑隔离 (WHERE user_id=?) | 高 | 低 | 中 |
| 部门级 | 逻辑隔离 (WHERE dept_id=?) | 高 | 低 | 中 |
| 企业级 | 逻辑隔离 (WHERE ent_id=?) | 高 | 低 | 中 |
| 物理隔离 | 独立Schema/数据库 | 中 | 高 | 高 |

**推荐**：逻辑隔离（成本低、性能高）

---

## 5. 云端AI服务编排

### 5.1 服务架构

```typescript
// AI服务编排器
class AIServiceOrchestrator {
  private llmClient: LLMClient;
  private ragService: ThreeLevelRAGService;
  private skillManager: SkillManager;

  // 处理用户请求
  async processRequest(request: UserRequest): Promise<AIResponse> {
    // 1. 意图识别
    const intent = await this.recognizeIntent(request.message);

    // 2. 判断是否需要调用Skill
    if (this.shouldUseSkill(intent)) {
      const skillResult = await this.skillManager.execute(
        intent.skillName,
        request.params
      );
      return this.buildResponse(skillResult);
    }

    // 3. RAG检索
    const ragContext = await this.ragService.retrieve(request.message);

    // 4. 构建提示词
    const prompt = this.buildPrompt(request.message, ragContext);

    // 5. 调用LLM
    const llmResponse = await this.llmClient.chat([
      { role: 'system', content: this.getSystemPrompt() },
      ...request.history,
      { role: 'user', content: prompt },
    ]);

    // 6. 保存会话
    await this.saveConversation(request, llmResponse);

    return this.buildResponse(llmResponse);
  }
}
```

---

## 6. 两种模式对比

| 特性 | 模式一：本地模式 | 模式二：云端模式 |
|-----|----------------|-----------------|
| 数据存储 | 本地SQLite | 云端数据库 |
| AI调用 | 用户API Key直连 | 云端服务 |
| RAG | 简化版本地向量 | 三级RAG |
| 多端同步 | 不支持 | 支持 |
| 消息推送 | 不支持 | 支持 |
| 运维成本 | 低 | 中 |
| 数据安全 | 用户设备 | 企业服务器 |
| 适用场景 | 个人/小型 | 企业/中型/大型 |

---

## 7. 模式切换

```typescript
// 运行模式配置
interface AppConfig {
  mode: 'local' | 'cloud';
  cloud?: {
    serverUrl: string;
    apiKey: string;
    syncInterval: number;
  };
  local?: {
    provider: string;
    apiKey: string;
  };
}

// 模式切换逻辑
class ModeSwitcher {
  async switchMode(newMode: 'local' | 'cloud'): Promise<void> {
    if (newMode === 'cloud') {
      // 切换到云端模式
      await this.initCloudConnection();
      await this.migrateLocalData();
      await this.startSyncService();
    } else {
      // 切换到本地模式
      await this.stopSyncService();
      await this.clearCloudSession();
    }

    await this.config.set('mode', newMode);
  }
}
```

---

*文档版本：v1.0*
*最后更新：2026-03-04*
