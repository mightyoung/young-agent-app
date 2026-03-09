// AI Services Main Export

// Types
export * from './types';

// Secure Storage
export { secureStorage } from './secureStorage';

// Initialization
export { initializeAIService, isAIServiceReady, resetAPIKey } from './init';

// AI Service (Unified Entry - merges aiStore + aiFacade)
export { useAIService, aiService, saveMessagesToStorage } from './aiService';
export type { AIService, AIServiceState, AIServiceActions } from './aiService';

// AI Facade (simplified API)
export { aiFacade } from './aiFacade';
export type { SendMessageOptions, AIStatus } from './aiFacade';

// Provider
export * from './provider';

// Tools
export * from './tools';

// RAG
export * from './rag';

// Business Data Sync
export * from './businessDataSync';

// Tool Data Service
export * from './toolDataService';

// Intent Recognition
export * from './intentRecognition';

// Hazard Analysis
export * from './hazardAnalysis';

// Streaming
export { streamingService } from './streaming';

// Validation
export * from './validation';

// Cloud Config (预留接口)
export { cloudConfigService } from './cloudConfig';
export type { CloudConfig } from './cloudConfig';

// Config Sync
export * from './configSync';

// Conversation Context
export * from './conversationContext';

// Voice Input
export * from './voiceInput';

// Image Analysis
export * from './imageAnalysis';

// Errors (Phase 3)
export * from './errors';

// Middleware (Phase 3)
export * from './middleware';
