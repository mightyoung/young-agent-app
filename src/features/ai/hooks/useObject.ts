/**
 * useObject Hook - 结构化输出 Hook
 * 对齐 Vercel AI SDK 的 useObject
 *
 * 用于从 AI 获取结构化数据 (JSON)，支持 schema 验证
 *
 * @example
 * const { object, submit, isLoading } = useObject({
 *   schema: z.object({
 *     name: z.string(),
 *     age: z.number(),
 *   })
 * });
 *
 * await submit('请告诉我你的名字和年龄');
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { z, ZodSchema, ZodError } from 'zod';
import { aiService } from '../services/aiService';

// ============================================
// 类型定义
// ============================================

/**
 * useObject 选项
 */
export interface UseObjectOptions<T extends ZodSchema> {
  /** Schema 定义 */
  schema: T;
  /** 初始值 */
  initialValue?: z.infer<T>;
  /** 完成回调 */
  onFinish?: (object: z.infer<T>) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

/**
 * useObject 返回值
 */
export interface UseObjectReturn<T> {
  /** 当前对象 (可能是部分结果) */
  object: T | undefined;
  /** 是否加载中 */
  isLoading: boolean;
  /** 是否完成 */
  isDone: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 提交请求 */
  submit: (prompt: string) => Promise<void>;
  /** 停止请求 */
  stop: () => void;
  /** 重置状态 */
  reset: () => void;
}

// ============================================
// 实现
// ============================================

/**
 * useObject Hook
 *
 * @param options - 配置选项
 * @returns Hook 返回值
 */
export function useObject<T extends ZodSchema>(
  options: UseObjectOptions<T>
): UseObjectReturn<z.infer<T>> {
  const { schema, initialValue, onFinish, onError } = options;

  // 状态
  const [object, setObject] = useState<z.infer<T> | undefined>(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs
  const abortRef = useRef(false);
  const partialResultRef = useRef<string>('');

  /**
   * 解析 AI 响应为对象
   */
  const parseResponse = useCallback(
    (content: string): z.infer<T> | null => {
      try {
        // 尝试提取 JSON
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
          content.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          const parsed = JSON.parse(jsonStr);
          return schema.parse(parsed);
        }

        // 尝试直接解析
        const parsed = JSON.parse(content);
        return schema.parse(parsed);
      } catch (e) {
        if (e instanceof ZodError) {
          throw new Error(`Schema validation failed: ${e.errors.map((e) => e.message).join(', ')}`);
        }
        throw new Error(`Failed to parse JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    },
    [schema]
  );

  /**
   * 提交请求
   */
  const submit = useCallback(
    async (prompt: string) => {
      // 重置状态
      abortRef.current = false;
      setObject(initialValue);
      setIsLoading(true);
      setIsDone(false);
      setError(null);
      partialResultRef.current = '';

      // 构建提示词，要求 AI 返回 JSON
      const jsonPrompt = `${prompt}\n\n请以 JSON 格式返回结果，不要包含其他内容。`;

      try {
        // 调用 AI 服务
        await aiService.sendMessage(jsonPrompt);

        // 订阅流式更新
        const checkInterval = setInterval(() => {
          if (abortRef.current) {
            clearInterval(checkInterval);
            return;
          }

          const aiServiceAny = aiService as any;
          const content = aiServiceAny.displayContent || '';

          if (content) {
            partialResultRef.current = content;

            // 尝试解析为对象
            try {
              const parsed = parseResponse(content);
              if (parsed) {
                setObject(parsed);
              }
            } catch {
              // 解析失败，继续等待
            }
          }

          // 检查是否完成
          if (!aiServiceAny.isStreaming && aiServiceAny.isLoading === false) {
            clearInterval(checkInterval);

            const finalContent = aiServiceAny.displayContent || partialResultRef.current;
            if (finalContent) {
              try {
                const parsed = parseResponse(finalContent);
                setObject(parsed);
                setIsDone(true);
                onFinish?.(parsed);
              } catch (e) {
                const err = e instanceof Error ? e : new Error('Failed to parse');
                setError(err);
                onError?.(err);
              }
            }

            setIsLoading(false);
          }
        }, 100);
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Unknown error');
        setError(err);
        setIsLoading(false);
        onError?.(err);
      }
    },
    [initialValue, onFinish, onError, parseResponse]
  );

  /**
   * 停止请求
   */
  const stop = useCallback(() => {
    abortRef.current = true;
    aiService.stopStreaming();
    setIsLoading(false);
  }, []);

  /**
   * 重置
   */
  const reset = useCallback(() => {
    setObject(initialValue);
    setIsLoading(false);
    setIsDone(false);
    setError(null);
    partialResultRef.current = '';
  }, [initialValue]);

  return {
    object,
    isLoading,
    isDone,
    error,
    submit,
    stop,
    reset,
  };
}

export default useObject;
