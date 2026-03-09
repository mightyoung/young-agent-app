/**
 * createStreamableValue - 流式值创建函数
 * 对齐 Vercel AI SDK 的 createStreamableValue
 *
 * @example
 * const stream = createStreamableValue<string>('');
 * stream.update(prev => prev + 'Hello');
 * stream.update(prev => prev + ' World');
 * stream.done();
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ===== 类型定义 =====

/**
 * 流式更新类型
 */
export type StreamUpdate<T> =
  | { done: true; value?: T }
  | { done: false; value: T };

/**
 * 流式值接口
 */
export interface StreamableValue<T> {
  (onUpdate: (update: StreamUpdate<T>) => void): void;
  readonly value: T | undefined;
  readonly loading: boolean;
}

/**
 * 流式值构建器选项
 */
export interface StreamableValueOptions<T> {
  /** 初始值 */
  initialValue?: T;
  /** 同调函数，当值更新时调用 */
  onUpdate?: (update: StreamUpdate<T>) => void;
}

/**
 * 流式值实例方法
 */
export interface StreamableValueApi<T> {
  /** 更新值 */
  update: (value: T | ((prev: T | undefined) => T)) => void;
  /** 标记完成 */
  finish: (value?: T) => void;
  /** 错误处理 */
  fail: (err: Error) => void;
  /** 获取当前值 */
  getValue: () => T | undefined;
  /** 是否加载中 */
  isLoading: boolean;
  /** 是否完成 */
  isDone: boolean;
  /** 错误信息 */
  error: Error | null;
}

// ===== 实现 =====

/**
 * 创建流式值
 *
 * @param options - 配置选项
 * @returns 流式值对象
 */
export function createStreamableValue<T>(
  options: StreamableValueOptions<T> = {}
): StreamableValueApi<T> {
  let currentValue = options.initialValue;
  let isLoading = true;
  let isDone = false;
  let errorValue: Error | null = null;
  const subscribers = new Set<(update: StreamUpdate<T>) => void>();

  // 添加订阅者
  const subscribe = (callback: (update: StreamUpdate<T>) => void) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  };

  // 通知所有订阅者
  const notify = (update: StreamUpdate<T>) => {
    subscribers.forEach((callback) => callback(update));
    options.onUpdate?.(update);
  };

  return {
    /** 更新值 */
    update: (value: T | ((prev: T | undefined) => T)) => {
      if (isDone) return;

      const newValue =
        typeof value === 'function'
          ? (value as (prev: T | undefined) => T)(currentValue)
          : value;

      currentValue = newValue;
      isLoading = false;
      notify({ done: false, value: newValue });
    },

    /** 标记完成 */
    finish: (value?: T) => {
      if (isDone) return;

      const finalValue = value !== undefined ? value : currentValue;
      currentValue = finalValue;
      isDone = true;
      isLoading = false;
      notify({ done: true, value: finalValue });
    },

    /** 错误处理 */
    fail: (err: Error) => {
      if (isDone) return;
      errorValue = err;
      isLoading = false;
      notify({ done: true, value: currentValue });
    },

    /** 获取当前值 */
    getValue: () => currentValue,

    /** 是否加载中 */
    get isLoading() {
      return isLoading;
    },

    /** 是否完成 */
    get isDone() {
      return isDone;
    },

    /** 是否出错 */
    get error() {
      return errorValue;
    },
  };
}

// ===== React Hook 版本 =====

/**
 * 使用流式值的 React Hook
 *
 * @example
 * function Component() {
 *   const [stream] = useState(() => createStreamableValue<string>(''));
 *   const value = useStreamableValue(stream);
 *   return <Text>{value}</Text>;
 * }
 *
 * @param stream - 流式值对象
 * @returns 当前值
 */
export function useStreamableValue<T>(stream: StreamableValueApi<T>): T | undefined {
  const [value, setValue] = useState<T | undefined>(stream.getValue());
  const [loading, setLoading] = useState(stream.isLoading);

  useEffect(() => {
    const unsubscribe = stream.update((update) => {
      if ('error' in update && update.error) {
        // Handle error case
        setValue(update.value);
        setLoading(false);
      } else {
        setValue(update.value);
        setLoading(!update.done);
      }
    });

    return unsubscribe;
  }, [stream]);

  return value;
}

/**
 * 使用流式值的 Hook，返回完整状态
 *
 * @example
 * function Component() {
 *   const [stream] = useState(() => createStreamableValue<string>(''));
 *   const { value, loading, done, error } = useStreamableValueState(stream);
 *   return <Text>{loading ? 'Loading...' : value}</Text>;
 * }
 */
export function useStreamableValueState<T>(
  stream: StreamableValueApi<T>
): {
  value: T | undefined;
  loading: boolean;
  done: boolean;
  error: Error | null;
} {
  const [state, setState] = useState({
    value: stream.getValue(),
    loading: stream.isLoading,
    done: stream.isDone,
    error: stream.error,
  });

  useEffect(() => {
    const unsubscribe = stream.update((update) => {
      setState({
        value: update.value,
        loading: !update.done,
        done: update.done,
        error: stream.error,
      });
    });

    return unsubscribe;
  }, [stream]);

  return state;
}

// ===== 工厂函数 =====

/**
 * 创建可读的流式值（只读版本）
 * 兼容 Vercel AI SDK 的 StreamableValue
 */
export function ReadableStreamableValue<T>(
  initialValue?: T
): StreamableValue<T> {
  const api = createStreamableValue<T>({ initialValue });

  // 返回可调用版本（支持订阅）
  const streamable: StreamableValue<T> = Object.assign(
    (onUpdate: (update: StreamUpdate<T>) => void) => {
      return api.update(onUpdate);
    },
    {
      get value() {
        return api.getValue();
      },
      get loading() {
        return api.isLoading;
      },
    }
  ) as StreamableValue<T>;

  return streamable;
}

// ===== 工具函数 =====

/**
 * 创建一个始终保持同步的流式值
 * 用于不需要异步更新的简单场景
 */
export function createSyncStreamableValue<T>(initialValue: T): StreamableValueApi<T> {
  return createStreamableValue<T>({ initialValue });
}

export default createStreamableValue;
