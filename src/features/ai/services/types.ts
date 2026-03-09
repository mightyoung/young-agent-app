// AI Service Types

// Message types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

// Tool types
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  name: string;
  result: string;
  isError?: boolean;
}

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
  execute: (args: Record<string, unknown>) => Promise<string>;
}

// LLM Provider types
export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: Tool[];
}

export interface ChatResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMProvider {
  chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;
  chatStream?(messages: Message[], options: StreamingOptions): Promise<void>;
  getDefaultModel(): string;
  validateApiKey?(apiKey: string): Promise<{ valid: boolean; error?: string }>;
  getCapabilities?(): ProviderCapabilities;
  listModels?(): Promise<ModelInfo[]>;
}

// Memory types
export interface MemoryEntry {
  id: string;
  content: string;
  timestamp: number;
  type: 'fact' | 'preference' | 'context';
}

// RAG types

// 知识库文档类型
export type KnowledgeType = 'preset' | 'upload' | 'business';

// 文档来源
export type DocumentSource = 'preset' | 'upload' | 'api';

// 关联台账
export interface RelatedAccounts {
  hazardIds?: string[];   // 关联隐患ID
  deviceIds?: string[];   // 关联设备ID
  taskIds?: string[];     // 关联任务ID
}

// 知识库文档
export interface KnowledgeDocument {
  id: string;
  type: KnowledgeType;
  title: string;                      // 标题（索引）
  content?: string;                   // 内容（仅预设知识）
  category: string;                   // 分类
  tags: string[];                     // 标签（索引）
  relatedAccounts?: RelatedAccounts;   // 关联台账（索引）
  source: DocumentSource;
  fileName?: string;                  // 文件名（用户上传）
  createdAt: number;
  updatedAt: number;
}

// 预设知识分类
export const KNOWLEDGE_CATEGORIES = {
  regulation: '法规',
  standard: '检查标准',
  hazard: '隐患分类',
  device: '设备手册',
} as const;

export type KnowledgeCategory = keyof typeof KNOWLEDGE_CATEGORIES;

// 文档
export interface Document {
  id: string;
  title: string;
  content: string;
  source: 'upload' | 'preset' | 'api';
  metadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface TreeNode {
  id: string;
  title: string;
  content: string;
  level: number;
  children: TreeNode[];
  pageRange?: { start: number; end: number };
}

export interface RetrievedContext {
  content: string;
  sources: {
    documentId: string;
    title: string;
    relevance: number;
  }[];
}

// Quick Action types
export interface QuickAction {
  id: string;
  text: string;
  icon: string;
  action: string;
}

// Provider types
export type ProviderType = 'deepseek' | 'openai' | 'anthropic' | 'minimax' | 'kimi' | 'doubao' | 'glm' | 'custom';

// Provider capabilities
export interface ProviderCapabilities {
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
  maxContextLength: number;
  defaultModel: string;
}

// Available model info
export interface ModelInfo {
  id: string;
  name: string;
  contextLength: number;
  supportsVision?: boolean;
  supportsFunctionCalling?: boolean;
}

export interface ProviderConfig {
  type: ProviderType;
  name: string;
  baseURL: string;
  model: string;
  apiKey?: string;
  supportsStreaming?: boolean;
  supportsVision?: boolean;
  maxContextLength?: number;
}

export interface StreamingOptions extends ChatOptions {
  onChunk?: (content: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

// R3: 错误类型
export type ErrorType = 'API_KEY_EXPIRED' | 'NETWORK_ERROR' | 'RATE_LIMIT' | 'UNKNOWN';

// R3: 失败消息（用于重试）
export interface FailedMessage {
  id: string;
  content: string;
  timestamp: number;
  errorType: ErrorType;
  errorMessage: string;
}
