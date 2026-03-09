// Network Module - API Client and Services
// 网络层统一导出

export { apiClient, ApiError } from './apiClient';
export type { ApiResponse, PaginatedResponse, ApiRequestConfig, ErrorHandlerConfig } from './apiClient';

export { ApiEndpoints, AI_TOOL_DESCRIPTIONS } from './endpoints';
export type {
  LoginRequest,
  LoginResponse,
  PageParams,
  UserInfo,
  DeviceInfo,
  HazardInfo,
  InspectionTask,
  InspectionRecord,
  InspectionItemResult,
  MessageInfo,
} from './endpoints';

export { apiServices } from './apiServices';
export {
  authService,
  userService,
  departmentService,
  deviceService,
  inspectionService,
  hazardService,
  messageService,
  fileService,
  reportService,
} from './apiServices';
