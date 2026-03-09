// RAG Service - Knowledge Base with Multi-dimensional Indexing
// 支持预设知识、用户上传（仅元数据）、业务数据集成

import { mmkvStorage } from '../../../../core/storage/mmkv';
import type { KnowledgeDocument, KnowledgeCategory, RetrievedContext } from '../types';
import { PRESET_KNOWLEDGE, getPresetKnowledge } from './presetKnowledge';

const RAG_DOCS_KEY = 'rag_documents';
const RAG_INITIALIZED_KEY = 'rag_initialized';

// 知识库文档存储结构
interface StoredDocument {
  id: string;
  type: string;
  title: string;
  content: string | null;  // null for upload/business types
  category: string;
  tags: string[];
  relatedHazardIds: string[];
  relatedDeviceIds: string[];
  relatedTaskIds: string[];
  fileName: string | null;
  source: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * RAG Service - 知识库管理服务
 * 索引策略：标题 + 标签 + 关联台账 + 分类
 */
class RAGService {
  private documents: Map<string, StoredDocument> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * 初始化知识库（加载预设知识）
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const initialized = mmkvStorage.getBoolean(RAG_INITIALIZED_KEY);
    if (initialized) {
      this.loadFromStorage();
      this.isInitialized = true;
      return;
    }

    // 加载预设知识
    const presetDocs = getPresetKnowledge();
    const now = Date.now();

    for (const doc of presetDocs) {
      const id = `preset-${doc.category}-${now}`;
      const storedDoc: StoredDocument = {
        id,
        type: doc.type,
        title: doc.title,
        content: doc.content || null,
        category: doc.category,
        tags: doc.tags,
        relatedHazardIds: [],
        relatedDeviceIds: [],
        relatedTaskIds: [],
        fileName: null,
        source: doc.source,
        createdAt: now,
        updatedAt: now,
      };
      this.documents.set(id, storedDoc);
    }

    this.saveToStorage();
    mmkvStorage.setBoolean(RAG_INITIALIZED_KEY, true);
    this.isInitialized = true;
  }

  /**
   * 从存储加载
   */
  private loadFromStorage(): void {
    try {
      const docsJson = mmkvStorage.getString(RAG_DOCS_KEY);
      if (docsJson) {
        const docs = JSON.parse(docsJson) as StoredDocument[];
        docs.forEach((doc) => this.documents.set(doc.id, doc));
      }
    } catch (error) {
      console.error('Failed to load RAG data:', error);
    }
  }

  /**
   * 保存到存储
   */
  private saveToStorage(): void {
    try {
      const docs = Array.from(this.documents.values());
      mmkvStorage.setString(RAG_DOCS_KEY, JSON.stringify(docs));
    } catch (error) {
      console.error('Failed to save RAG data:', error);
    }
  }

  /**
   * 添加用户上传文档（仅元数据）
   */
  async addUploadDocument(
    title: string,
    fileName: string,
    options?: {
      tags?: string[];
      category?: string;
      relatedHazards?: string[];
      relatedDevices?: string[];
      relatedTasks?: string[];
    }
  ): Promise<string> {
    const id = `upload-${Date.now()}`;
    const now = Date.now();

    const doc: StoredDocument = {
      id,
      type: 'upload',
      title,
      content: null,  // 用户上传不存储内容
      category: options?.category || 'other',
      tags: options?.tags || [],
      relatedHazardIds: options?.relatedHazards || [],
      relatedDeviceIds: options?.relatedDevices || [],
      relatedTaskIds: options?.relatedTasks || [],
      fileName,
      source: 'upload',
      createdAt: now,
      updatedAt: now,
    };

    this.documents.set(id, doc);
    this.saveToStorage();

    return id;
  }

  /**
   * 添加业务数据引用
   */
  async addBusinessReference(
    type: 'hazard' | 'device' | 'task',
    entityId: string,
    title: string,
    description?: string,
    tags?: string[]
  ): Promise<string> {
    const id = `business-${type}-${entityId}`;
    const now = Date.now();

    const doc: StoredDocument = {
      id,
      type: 'business',
      title,
      content: description || null,
      category: type,
      tags: tags || [type],
      relatedHazardIds: type === 'hazard' ? [entityId] : [],
      relatedDeviceIds: type === 'device' ? [entityId] : [],
      relatedTaskIds: type === 'task' ? [entityId] : [],
      fileName: null,
      source: 'api',
      createdAt: now,
      updatedAt: now,
    };

    // 如果已存在则更新
    if (this.documents.has(id)) {
      const existing = this.documents.get(id)!;
      doc.createdAt = existing.createdAt;
    }

    this.documents.set(id, doc);
    this.saveToStorage();

    return id;
  }

  /**
   * 获取所有文档
   */
  getAllDocuments(): KnowledgeDocument[] {
    return Array.from(this.documents.values()).map(this.toKnowledgeDocument);
  }

  /**
   * 获取文档
   */
  getDocument(id: string): KnowledgeDocument | undefined {
    const doc = this.documents.get(id);
    return doc ? this.toKnowledgeDocument(doc) : undefined;
  }

  /**
   * 删除文档
   */
  deleteDocument(id: string): boolean {
    const deleted = this.documents.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  /**
   * 检索相关上下文
   * 多维度检索：标题 + 标签 + 关联台账 + 分类
   */
  async retrieve(query: string): Promise<RetrievedContext> {
    const docs = Array.from(this.documents.values());
    const queryLower = query.toLowerCase();

    // 提取查询中的关键词
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 1);

    // 尝试从查询中提取台账ID（如隐患ID、设备ID）
    const hazardIdMatch = query.match(/隐患[_-]?(\w+)/i);
    const deviceIdMatch = query.match(/设备[_-]?(\w+)/i);
    const taskIdMatch = query.match(/任务[_-]?(\w+)/i);

    const extractedHazardId = hazardIdMatch ? hazardIdMatch[1] : null;
    const extractedDeviceId = deviceIdMatch ? deviceIdMatch[1] : null;
    const extractedTaskId = taskIdMatch ? taskIdMatch[1] : null;

    // 为每个文档计算相关度得分
    const scored = docs.map((doc) => {
      let relevance = 0;

      // 1. 标题匹配（最高权重）
      const titleLower = doc.title.toLowerCase();
      for (const word of queryWords) {
        if (titleLower.includes(word)) {
          relevance += 10;
        }
      }

      // 2. 标签匹配（高权重）
      for (const tag of doc.tags) {
        const tagLower = tag.toLowerCase();
        for (const word of queryWords) {
          if (tagLower.includes(word)) {
            relevance += 5;
          }
        }
      }

      // 3. 分类匹配
      if (doc.category.toLowerCase().includes(queryLower)) {
        relevance += 3;
      }

      // 4. 关联台账匹配（最高权重）
      if (extractedHazardId) {
        const match = doc.relatedHazardIds.some(id =>
          id.toLowerCase().includes(extractedHazardId.toLowerCase())
        );
        if (match) relevance += 20;
      }

      if (extractedDeviceId) {
        const match = doc.relatedDeviceIds.some(id =>
          id.toLowerCase().includes(extractedDeviceId.toLowerCase())
        );
        if (match) relevance += 20;
      }

      if (extractedTaskId) {
        const match = doc.relatedTaskIds.some(id =>
          id.toLowerCase().includes(extractedTaskId.toLowerCase())
        );
        if (match) relevance += 20;
      }

      // 5. 内容匹配（预设知识才有内容）
      if (doc.content) {
        const contentLower = doc.content.toLowerCase();
        for (const word of queryWords) {
          const matches = (contentLower.match(new RegExp(word, 'g')) || []).length;
          relevance += matches * 0.5;
        }
      }

      return { doc, relevance };
    });

    // 排序并取Top 5
    scored.sort((a, b) => b.relevance - a.relevance);
    const topResults = scored.slice(0, 5).filter((s) => s.relevance > 0);

    if (topResults.length === 0) {
      return {
        content: '未找到相关内容',
        sources: [],
      };
    }

    // 构建上下文内容
    const content = topResults
      .map((s) => {
        const doc = s.doc;
        let text = `【${doc.title}】\n`;
        text += `分类：${this.getCategoryName(doc.category)}\n`;
        if (doc.tags.length > 0) {
          text += `标签：${doc.tags.join(', ')}\n`;
        }
        if (doc.content) {
          text += `\n${doc.content.substring(0, 500)}`;
        } else if (doc.fileName) {
          text += `\n文件名：${doc.fileName}`;
        }
        return text;
      })
      .join('\n\n---\n\n');

    const sources = topResults.map((s) => ({
      documentId: s.doc.id,
      title: s.doc.title,
      relevance: s.relevance,
    }));

    return {
      content,
      sources,
    };
  }

  /**
   * 获取分类名称
   */
  private getCategoryName(category: string): string {
    const names: Record<string, string> = {
      regulation: '法规',
      standard: '检查标准',
      hazard: '隐患分类',
      device: '设备手册',
      task: '任务',
      other: '其他',
    };
    return names[category] || category;
  }

  /**
   * 转换为知识文档
   */
  private toKnowledgeDocument(doc: StoredDocument): KnowledgeDocument {
    return {
      id: doc.id,
      type: doc.type as KnowledgeDocument['type'],
      title: doc.title,
      content: doc.content || undefined,
      category: doc.category,
      tags: doc.tags,
      relatedAccounts: {
        hazardIds: doc.relatedHazardIds.length > 0 ? doc.relatedHazardIds : undefined,
        deviceIds: doc.relatedDeviceIds.length > 0 ? doc.relatedDeviceIds : undefined,
        taskIds: doc.relatedTaskIds.length > 0 ? doc.relatedTaskIds : undefined,
      },
      source: doc.source as KnowledgeDocument['source'],
      fileName: doc.fileName || undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /**
   * 获取统计信息
   */
  getStats(): Record<string, number> {
    const docs = Array.from(this.documents.values());
    const stats: Record<string, number> = {
      total: docs.length,
      preset: 0,
      upload: 0,
      business: 0,
    };

    for (const doc of docs) {
      stats[doc.type] = (stats[doc.type] || 0) + 1;
    }

    return stats;
  }

  /**
   * 清除所有非预设知识
   */
  clearUserData(): void {
    const toDelete: string[] = [];
    this.documents.forEach((doc, id) => {
      if (doc.type !== 'preset') {
        toDelete.push(id);
      }
    });

    for (const id of toDelete) {
      this.documents.delete(id);
    }

    this.saveToStorage();
  }

  /**
   * 重新初始化（清除所有数据）
   */
  reinitialize(): void {
    this.documents.clear();
    mmkvStorage.delete(RAG_DOCS_KEY);
    mmkvStorage.delete(RAG_INITIALIZED_KEY);
    this.isInitialized = false;
    this.initialize();
  }
}

// Singleton
export const ragService = new RAGService();
export default ragService;
