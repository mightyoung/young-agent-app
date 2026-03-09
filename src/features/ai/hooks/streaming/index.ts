/**
 * Streaming Hooks - 流式UI功能模块
 * 对齐 Vercel AI SDK 的流式API
 *
 * @module streaming
 */

// Re-export all streaming functions
export {
  createStreamableValue,
  useStreamableValue,
  useStreamableValueState,
  createSyncStreamableValue,
  type StreamableValue,
  type StreamUpdate,
  type StreamableValueOptions,
  type StreamableValueApi,
} from './createStreamableValue';

export {
  createStreamableUI,
  useStreamableUI,
  useStreamableUIState,
  createEmptyStreamableUI,
  createStreamableUIFromValue,
  type CreateStreamableUIOptions,
  type StreamableUI,
} from './createStreamableUI';

export {
  createParser,
  quickParse,
  quickParseNode,
  businessComponents,
  type ComponentNode,
  type NodeType,
  type NodeProps,
  type ParseResult,
  type ParserOptions,
} from './ReactNodeParser';
