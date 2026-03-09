/**
 * Enhanced Tool Executor - 增强工具执行器
 * 提供流式支持、错误处理、状态跟踪
 */

import type { Tool, ToolCall, ToolResult } from '../types';

// ============================================
// 类型定义
// ============================================

/**
 * 工具执行状态
 */
export type ToolExecutionStatus = 'idle' | 'executing' | 'completed' | 'error';

/**
 * 工具执行项
 */
export interface ToolExecution {
  /** 工具调用 ID */
  id: string;
  /** 工具名称 */
  name: string;
  /** 执行参数 */
  arguments: Record<string, unknown>;
  /** 执行状态 */
  status: ToolExecutionStatus;
  /** 执行结果 */
  result?: string;
  /** 错误信息 */
  error?: string;
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime?: number;
}

/**
 * 工具执行选项
 */
export interface ToolExecutorOptions {
  /** 超时时间 (ms) */
  timeout?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 是否流式返回结果 */
  streaming?: boolean;
  /** 流式回调 */
  onStream?: (chunk: string) => void;
}

/**
 * 工具执行器接口
 */
export interface ToolExecutor {
  /** 执行工具 */
  execute(
    toolCall: ToolCall,
    options?: ToolExecutorOptions
  ): Promise<ToolResult>;

  /** 批量执行工具 */
  executeMany(
    toolCalls: ToolCall[],
    options?: ToolExecutorOptions
  ): Promise<ToolResult[]>;

  /** 获取执行历史 */
  getHistory(): ToolExecution[];

  /** 获取当前执行状态 */
  getStatus(toolCallId: string): ToolExecution | undefined;

  /** 清除历史 */
  clearHistory(): void;
}

// ============================================
// 实现
// ============================================

/**
 * 增强工具执行器
 */
class EnhancedToolExecutor implements ToolExecutor {
  private tools: Map<string, Tool> = new Map();
  private history: ToolExecution[] = [];
  private executing: Map<string, ToolExecution> = new Map();
  private defaultOptions: ToolExecutorOptions = {
    timeout: 30000,
    maxRetries: 2,
    streaming: false,
  };

  /**
   * 注册工具
   */
  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * 批量注册工具
   */
  registerMany(tools: Tool[]): void {
    tools.forEach((tool) => this.register(tool));
  }

  /**
   * 移除工具
   */
  unregister(name: string): void {
    this.tools.delete(name);
  }

  /**
   * 执行单个工具
   */
  async execute(
    toolCall: ToolCall,
    options: ToolExecutorOptions = {}
  ): Promise<ToolResult> {
    const opts = { ...this.defaultOptions, ...options };
    const execution: ToolExecution = {
      id: toolCall.id,
      name: toolCall.name,
      arguments: toolCall.arguments,
      status: 'executing',
      startTime: Date.now(),
    };

    // 记录执行
    this.executing.set(toolCall.id, execution);
    this.history.push(execution);

    // 查找工具
    const tool = this.tools.get(toolCall.name);
    if (!tool) {
      const errorResult = this.createErrorResult(
        toolCall,
        `Tool not found: ${toolCall.name}`
      );
      this.updateExecution(execution, 'error', undefined, errorResult.result);
      return errorResult;
    }

    // 执行工具 (带重试)
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= (opts.maxRetries ?? 2); attempt++) {
      try {
        const result = await this.executeWithTimeout(
          tool,
          toolCall.arguments,
          opts
        );

        this.updateExecution(execution, 'completed', result);
        return this.createSuccessResult(toolCall, result);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // 如果是最后一次尝试
        if (attempt === opts.maxRetries) {
          break;
        }

        // 等待后重试
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    // 执行失败
    const errorMsg = lastError?.message ?? 'Unknown error';
    this.updateExecution(execution, 'error', undefined, errorMsg);
    return this.createErrorResult(toolCall, errorMsg);
  }

  /**
   * 批量执行工具
   */
  async executeMany(
    toolCalls: ToolCall[],
    options: ToolExecutorOptions = {}
  ): Promise<ToolResult[]> {
    // 并行执行所有工具
    const results = await Promise.all(
      toolCalls.map((toolCall) => this.execute(toolCall, options))
    );
    return results;
  }

  /**
   * 获取执行历史
   */
  getHistory(): ToolExecution[] {
    return [...this.history];
  }

  /**
   * 获取执行状态
   */
  getStatus(toolCallId: string): ToolExecution | undefined {
    return this.executing.get(toolCallId);
  }

  /**
   * 清除历史
   */
  clearHistory(): void {
    this.history = [];
    this.executing.clear();
  }

  /**
   * 获取所有工具
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * 获取 LLM 格式的工具定义
   */
  getToolsForLLM(): {
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  }[] {
    return this.getAllTools().map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  // ============================================
  // 私有方法
  // ============================================

  /**
   * 带超时的执行
   */
  private async executeWithTimeout(
    tool: Tool,
    args: Record<string, unknown>,
    options: ToolExecutorOptions
  ): Promise<string> {
    const { timeout = 30000 } = options;

    return Promise.race([
      tool.execute(args),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Tool execution timeout: ${timeout}ms`)), timeout)
      ),
    ]);
  }

  /**
   * 更新执行状态
   */
  private updateExecution(
    execution: ToolExecution,
    status: ToolExecutionStatus,
    result?: string,
    error?: string
  ): void {
    execution.status = status;
    execution.result = result;
    execution.error = error;
    execution.endTime = Date.now();

    this.executing.set(execution.id, execution);
  }

  /**
   * 创建成功结果
   */
  private createSuccessResult(
    toolCall: ToolCall,
    result: string
  ): ToolResult {
    return {
      toolCallId: toolCall.id,
      name: toolCall.name,
      result,
      isError: false,
    };
  }

  /**
   * 创建错误结果
   */
  private createErrorResult(
    toolCall: ToolCall,
    error: string
  ): ToolResult {
    return {
      toolCallId: toolCall.id,
      name: toolCall.name,
      result: error,
      isError: true,
    };
  }

  /**
   * 延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const toolExecutor = new EnhancedToolExecutor();

export default toolExecutor;
