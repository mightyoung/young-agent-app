// AI Store - State Management with Zustand
// 支持流式响应、思考模式、打字机效果
//
// ⚠️ DEPRECATED: 此文件已废弃，请使用 ../services/aiService 中的 useAIService
// 此文件仅用于向后兼容，将在后续版本中移除
//
// 迁移指南:
//   - import { useAIStore } from './aiStore';
//   + import { useAIService } from '../services/aiService';

import { useAIService } from '../services/aiService';

/**
 * @deprecated 请使用 useAIService
 * 此别名仅用于向后兼容
 */
export const useAIStore = useAIService;
