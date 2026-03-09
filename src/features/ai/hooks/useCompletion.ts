/**
 * useCompletion Hook - 文本补全 Hook
 * 对齐 Vercel AI SDK 的 useCompletion
 *
 * 用于简单的文本补全场景，不需要维护对话历史
 *
 * @example
 * const { completion, input, setInput, submit, isLoading } = useCompletion({
 *   onFinish: (prompt, completion) => console.log(prompt, completion)
 * });
 *
 * await submit('写一首关于春天的诗');
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { aiService } from '../services/aiService';

// ============================================
// 类型定义
// ============================================

/**
 * useCompletion 选项
 */
export interface UseCompletionOptions {
  /** 初始输入 */
  initialInput?: string;
  /** 完成回调 */
  onFinish?: (prompt: string, completion: string) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
  /** 回调 */
  onCallback?: (chunk: string) => void;
  /** 最大生成 token 数 */
  maxTokens?: number;
  /** 温度 */
  temperature?: number;
}

/**
 * useCompletion 返回值
 */
export interface UseCompletionReturn {
  /** 当前补全文本 */
  completion: string;
  /** 输入框内容 */
  input: string;
  /** 是否加载中 */
  isLoading: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 设置输入 */
  setInput: (input: string) => void;
  /** 提交补全 */
  submit: (override?: string) => Promise<void>;
  /** 停止生成 */
  stop: () => void;
  /** 重新生成 */
  reload: () => Promise<void>;
  /** 清除 */
  clear: () => void;
}

// ============================================
// 实现
// ============================================

/**
 * useCompletion Hook
 *
 * @param options - 配置选项
 * @returns Hook 返回值
 */
export function useCompletion(
  options: UseCompletionOptions = {}
): UseCompletionReturn {
  const {
    initialInput = '',
    onFinish,
    onError,
    onCallback,
    maxTokens = 2000,
    temperature = 0.7,
  } = options;

  // 状态
  const [input, setInput] = useState(initialInput);
  const [completion, setCompletion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs
  const abortRef = useRef(false);
  const lastPromptRef = useRef<string>('');

  /**
   * 提交补全请求
   */
  const submit = useCallback(
    async (override?: string) => {
      const prompt = override ?? input;
      if (!prompt.trim()) return;

      // 保存最后一次提示词
      lastPromptRef.current = prompt;

      // 重置状态
      abortRef.current = false;
      setCompletion('');
      setIsLoading(true);
      setError(null);

      try {
        // 调用 AI 服务
        await aiService.sendMessage(prompt);

        // 订阅流式更新
        const checkInterval = setInterval(() => {
          if (abortRef.current) {
            clearInterval(checkInterval);
            return;
          }

          const aiServiceAny = aiService as any;
          const content = aiServiceAny.displayContent || '';

          if (content) {
            setCompletion(content);
            onCallback?.(content);
          }

          // 检查是否完成
          if (!aiServiceAny.isStreaming && aiServiceAny.isLoading === false) {
            clearInterval(checkInterval);
            setIsLoading(false);

            const finalContent = aiServiceAny.displayContent || content;
            if (finalContent) {
              setCompletion(finalContent);
              onFinish?.(prompt, finalContent);
            }
          }
        }, 100);
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Unknown error');
        setError(err);
        setIsLoading(false);
        onError?.(err);
      }
    },
    [input, onFinish, onError, onCallback]
  );

  /**
   * 停止生成
   */
  const stop = useCallback(() => {
    abortRef.current = true;
    aiService.stopStreaming();
    setIsLoading(false);
  }, []);

  /**
   * 重新生成
   */
  const reload = useCallback(async () => {
    if (lastPromptRef.current) {
      await submit(lastPromptRef.current);
    }
  }, [submit]);

  /**
   * 清除
   */
  const clear = useCallback(() => {
    setInput(initialInput);
    setCompletion('');
    setError(null);
  }, [initialInput]);

  return {
    completion,
    input,
    isLoading,
    error,
    setInput,
    submit,
    stop,
    reload,
    clear,
  };
}

export default useCompletion;
