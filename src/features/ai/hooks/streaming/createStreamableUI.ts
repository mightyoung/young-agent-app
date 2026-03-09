/**
 * createStreamableUI - 流式UI组件创建函数
 * 对齐 Vercel AI SDK 的 createStreamableUI
 *
 * @example
 * const ui = createStreamableUI({ initialUI: null });
 * ui.append(<Text>Hello</Text>);
 * ui.append(<Text> World</Text>);
 * ui.done();
 */

import React from 'react';
import { createStreamableValue, type StreamUpdate } from './createStreamableValue';

// ===== 类型定义 =====

/**
 * 流式UI配置选项
 */
export interface CreateStreamableUIOptions {
  /** 初始UI */
  initialUI?: React.ReactNode;
  /** 同调回调 */
  onUpdate?: (update: StreamUpdate<React.ReactNode>) => void;
}

/**
 * 流式UI API
 */
export interface StreamableUI {
  /** 流式值（兼容 StreamableValue） */
  stream: ReturnType<typeof createStreamableValue<React.ReactNode>>;
  /** 更新UI（替换） */
  update: (ui: React.ReactNode) => void;
  /** 追加UI */
  append: (ui: React.ReactNode) => void;
  /** 预先添加 */
  prepend: (ui: React.ReactNode) => void;
  /** 完成 */
  finish: (ui?: React.ReactNode) => void;
  /** 错误 */
  fail: (err: Error) => void;
  /** 获取当前UI */
  getUI: () => React.ReactNode;
  /** 是否完成 */
  readonly done: boolean;
  /** 是否加载中 */
  readonly loading: boolean;
}

// ===== 实现 =====

/**
 * 创建流式UI
 *
 * @param options - 配置选项
 * @returns 流式UI对象
 */
export function createStreamableUI(options: CreateStreamableUIOptions = {}): StreamableUI {
  const { initialUI = null, onUpdate } = options;

  // 使用 createStreamableValue 存储 UI
  const stream = createStreamableValue<React.ReactNode>({
    initialValue: initialUI,
    onUpdate,
  });

  // 当前累积的 UI 节点数组
  let uiNodes: React.ReactNode[] = Array.isArray(initialUI) ? initialUI : [initialUI];

  // 更新 uiNodes 数组
  const syncNodesFromValue = () => {
    const currentValue = stream.getValue();
    if (currentValue === undefined) {
      uiNodes = [];
    } else if (Array.isArray(currentValue)) {
      uiNodes = [...currentValue];
    } else {
      uiNodes = [currentValue];
    }
  };

  return {
    /** 流式值 */
    stream,

    /** 更新UI（完全替换） */
    update: (ui: React.ReactNode) => {
      uiNodes = [ui];
      stream.update(ui);
    },

    /** 追加UI到末尾 */
    append: (ui: React.ReactNode) => {
      syncNodesFromValue();
      uiNodes.push(ui);
      stream.update([...uiNodes]);
    },

    /** 预先添加UI到开头 */
    prepend: (ui: React.ReactNode) => {
      syncNodesFromValue();
      uiNodes.unshift(ui);
      stream.update([...uiNodes]);
    },

    /** 完成流式 */
    finish: (ui?: React.ReactNode) => {
      if (ui !== undefined) {
        syncNodesFromValue();
        uiNodes.push(ui);
        stream.finish([...uiNodes]);
      } else {
        stream.finish();
      }
    },

    /** 错误处理 */
    fail: (err: Error) => {
      stream.fail(err);
    },

    /** 获取当前UI */
    getUI: () => {
      return stream.getValue() ?? null;
    },

    /** 是否完成 */
    get done() {
      return stream.isDone;
    },

    /** 是否加载中 */
    get loading() {
      return stream.isLoading;
    },
  };
}

// ===== React Hook =====

/**
 * 使用流式UI的 Hook
 *
 * @example
 * function Chat() {
 *   const [uiStream] = useState(() => createStreamableUI());
 *
 *   useEffect(() => {
 *     uiStream.append(<Text>Hello</Text>);
 *   }, []);
 *
 *   return useStreamableUI(uiStream);
 * }
 */
export function useStreamableUI(uiStream: StreamableUI): React.ReactNode {
  const { useStreamableValue } = require('./createStreamableValue');
  return useStreamableValue(uiStream.stream);
}

/**
 * 使用流式UI的 Hook，返回完整状态
 */
export function useStreamableUIState(uiStream: StreamableUI): {
  ui: React.ReactNode;
  loading: boolean;
  done: boolean;
} {
  const { useStreamableValueState } = require('./createStreamableValue');
  const state = useStreamableValueState(uiStream.stream);
  return {
    ui: state.value ?? null,
    loading: state.loading,
    done: state.done,
  };
}

// ===== 便捷工厂 =====

/**
 * 创建空流式UI
 */
export function createEmptyStreamableUI(): StreamableUI {
  return createStreamableUI({ initialUI: null });
}

/**
 * 从现有UI创建流式UI
 */
export function createStreamableUIFromValue(initialUI: React.ReactNode): StreamableUI {
  return createStreamableUI({ initialUI });
}

export default createStreamableUI;
