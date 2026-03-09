// User types
// ============================================
// Navigation types - exported from here to avoid expo-router treating types.ts as a route
// ============================================
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  deptId: string;
  enterpriseId: string;
  enterpriseName?: string;
  deptName?: string;
  avatar?: string;
}

export type UserRole = 'user' | 'inspector' | 'leader' | 'admin';

// Auth Stack
export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  BindEnterprise: { userId: string };
};

// Main Tab
export type MainTabParamList = {
  Home: undefined;
  AI: NavigatorScreenParams<AITabParamList>;
};

// AI Tab (nested)
export type AITabParamList = {
  AIAssistant: undefined;
  AIDataCenter: undefined;
  AIProfile: undefined;
};

// Root Stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;

  // Camera flow
  Camera: undefined;
  CameraEntry: { photo?: string } | undefined;
  ScanCheck: { deviceId: string };
  HazardReport: undefined;
  HazardResult: { hazardId: string };
  SafetyCheck: { taskId?: string };
  InspectionResult: { recordId: string };

  // Inspection flow
  InspectionHistory: undefined;
  InspectionDetail: { id: string };

  // Hazard flow
  HazardList: undefined;
  HazardDetail: { id: string };
  HazardConfirm: { id: string };
  HazardRectify: { id: string };
  HazardAccept: { id: string };

  // Device flow
  DeviceList: undefined;
  DeviceDetail: { id: string };
  DeviceChecklist: { deviceId: string };

  // Messages
  Messages: undefined;
  HazardReview: undefined;
  TaskAssign: undefined;

  // Settings
  Settings: undefined;
  AISettings: undefined;
  BackendSettings: undefined;

  // AI Features
  Statistics: undefined;
  KnowledgeBase: undefined;
  KnowledgeDetail: { article: { id: string; title: string; content: string } };
};

// Screen props types
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type AITabScreenProps<T extends keyof AITabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<AITabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

// Helper to declare global types
declare global {
   
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

// Device types
export interface Device {
  id: string;
  name: string;
  qrCode: string;
  typeId: string;
  typeName?: string;
  locationId: string;
  locationName?: string;
  deptId: string;
  checklistTemplateId?: string;
  status: DeviceStatus;
  createdAt: number;
  updatedAt: number;
}

export type DeviceStatus = 'normal' | 'warning' | 'error' | 'offline';

export interface DeviceType {
  id: string;
  name: string;
  code: string;
}

export interface DeviceLocation {
  id: string;
  name: string;
  code: string;
  parentId?: string;
}

// Checklist types
export interface ChecklistItem {
  id: string;
  name: string;
  description?: string;
  required: boolean;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  deviceId: string;
  items: ChecklistItem[];
}

// Inspection types
export interface InspectionRecord {
  id: string;
  deviceId: string;
  deviceName?: string;
  userId: string;
  userName?: string;
  taskId?: string;
  type: InspectionType;
  status: InspectionStatus;
  result?: InspectionResult;
  items: InspectionItemResult[];
  photos: string[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type InspectionType = 'scan' | 'safety' | 'task';
export type InspectionStatus = 'draft' | 'pending' | 'completed' | 'cancelled';
export type InspectionResult = 'pass' | 'fail' | 'partial';

export interface InspectionItemResult {
  itemId: string;
  itemName: string;
  result: 'pass' | 'fail' | 'na';
  notes?: string;
  photo?: string;
}

export interface InspectionTask {
  id: string;
  name: string;
  description?: string;
  deviceIds: string[];
  checklistTemplateId: string;
  assigneeIds: string[];
  dueDate?: number;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: number;
}

// Hazard types
export interface HazardRecord {
  id: string;
  businessId: string;      // 业务唯一ID：时间戳+用户ID+台账类型+主键ID
  businessNo: string;      // 业务编号（人类可读）：前缀+时间戳+随机数
  source: 'photo' | 'inspection';  // 来源：随手拍/巡检发现
  photos: string[];
  type: HazardType;
  typeName?: string;
  locationId?: string;
  locationName?: string;
  description: string;
  voiceNote?: string;
  voiceDuration?: number;  // 语音时长（秒）
  status: HazardStatus;
  userId: string;
  userName?: string;
  assigneeId?: string;
  createdAt: number;
  updatedAt: number;
  // Lifecycle fields
  confirmedAt?: number;
  confirmedBy?: string;
  rectifiedAt?: number;
  rectifiedBy?: string;
  rectifiedDescription?: string;
  acceptedAt?: number;
  acceptedBy?: string;
  rejectReason?: string;
}

export type HazardType = 'fire' | 'electric' | 'construction' | 'other';

export type HazardStatus =
  | 'draft'
  | 'submitted'
  | 'confirmed'
  | 'rectifying'
  | 'accepted'
  | 'rejected';

// Message types
export interface Message {
  id: string;
  type: MessageType;
  title: string;
  content: string;
  userId: string;
  readStatus: boolean;
  relatedId?: string;
  createdAt: number;
}

export type MessageCategory = 'system' | 'task' | 'hazard_review' | 'announcement';

// AI types
export interface AIProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'deepseek' | 'minimax' | 'kimi' | 'doubao' | 'glm' | 'custom';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  enabled: boolean;
}

export interface AIConversation {
  id: string;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Enterprise types
export interface Enterprise {
  id: string;
  name: string;
  logo?: string;
}

export interface Department {
  id: string;
  name: string;
  enterpriseId: string;
  parentId?: string;
}

// Sync types
export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'inspection' | 'hazard' | 'device';
  entityId: string;
  payload: any;
  createdAt: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
}

// Settings types
export interface AppSettings {
  aiProvider: string;
  apiMode: 'local' | 'cloud';
  cloudUrl?: string;
  offlineEnabled: boolean;
  syncOnWifiOnly: boolean;
  homeScreenMode: 'classic' | 'modern';
}
