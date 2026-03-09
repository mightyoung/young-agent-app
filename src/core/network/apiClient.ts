// API Client Configuration
// 基于 axios 的统一网络请求层

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { config } from '../constants/config';
import { mmkvStorage } from '../storage/mmkv';

// ============================================
// 类型定义
// ============================================

/** API 响应结构 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp?: number;
}

/** 分页响应结构 */
export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** 请求配置扩展 */
export interface ApiRequestConfig extends AxiosRequestConfig {
  /** 是否显示加载状态 */
  showLoading?: boolean;
  /** 是否显示错误提示 */
  showError?: boolean;
  /** 请求超时时间 */
  timeout?: number;
  /** 存储键配置 */
  storageKeys?: {
    token?: string;
  };
}

/** 错误处理配置 */
export interface ErrorHandlerConfig {
  /** 是否显示错误提示 */
  showError?: boolean;
  /** 自定义错误处理函数 */
  onError?: (error: ApiError) => void;
}

/** API 错误类 */
export class ApiError extends Error {
  public code: number;
  public status: number;
  public originalError: any;

  constructor(message: string, code: number = -1, status: number = 0, originalError?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.originalError = originalError;
  }
}

// ============================================
// API 客户端类
// ============================================

class ApiClient {
  private client: AxiosInstance;
  private loadingCount: number = 0;

  constructor() {
    this.client = this.createClient();
    this.setupInterceptors();
  }

  /** 创建 axios 实例 */
  private createClient(): AxiosInstance {
    const instance = axios.create({
      baseURL: config.apiBaseUrl || '',
      timeout: config.apiTimeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return instance;
  }

  /** 设置拦截器 */
  private setupInterceptors(): void {
    // 请求拦截器
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // 添加认证 Token
        const requestConfig = config as unknown as ApiRequestConfig;
        const token = mmkvStorage.getString(requestConfig.storageKeys?.token || 'token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 添加请求ID (用于日志追踪)
        config.headers['X-Request-ID'] = this.generateRequestId();

        // 显示加载状态
        if (requestConfig.showLoading !== false) {
          this.incrementLoading();
        }

        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.decrementLoading();
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        this.decrementLoading();
        console.log(`[API Response] ${response.config.url} - ${response.status}`);

        // 处理业务层错误
        const res = response.data as ApiResponse;
        if (res.code !== 0 && res.code !== 200) {
          // 根据状态码判断错误类型
          switch (res.code) {
            case 401:
              // Token 过期，清除登录状态
              this.handleUnauthorized();
              break;
            case 403:
              console.warn('[API] 无权限访问');
              break;
            case 404:
              console.warn('[API] 资源不存在');
              break;
            case 500:
              console.error('[API] 服务器错误');
              break;
          }

          throw new ApiError(res.message || '请求失败', res.code, response.status);
        }

        return response;
      },
      (error) => {
        this.decrementLoading();
        console.error('[API Error]', error.message);

        // 处理网络错误
        if (error.code === 'ECONNABORTED') {
          throw new ApiError('请求超时，请稍后重试', -1, 408, error);
        }

        if (!error.response) {
          // 网络错误
          throw new ApiError('网络连接失败，请检查网络', -1, 0, error);
        }

        const response = error.response;
        const status = response.status;

        // HTTP 状态码处理
        switch (status) {
          case 401:
            this.handleUnauthorized();
            throw new ApiError('登录已过期，请重新登录', -1, 401, error);
          case 403:
            throw new ApiError('无权限访问', -1, 403, error);
          case 404:
            throw new ApiError('请求的资源不存在', -1, 404, error);
          case 500:
            throw new ApiError('服务器内部错误', -1, 500, error);
          case 502:
            throw new ApiError('服务网关错误', -1, 502, error);
          case 503:
            throw new ApiError('服务暂不可用', -1, 503, error);
          default:
            throw new ApiError(error.message || '请求失败', -1, status, error);
        }
      }
    );
  }

  /** 生成请求ID */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /** 处理未授权 */
  private handleUnauthorized(): void {
    // 清除 Token
    mmkvStorage.delete('token');
    mmkvStorage.delete('user');

    // 可以在这里触发重新登录的逻辑
    // 例如通过事件总线通知应用跳转到登录页
    console.warn('[API] 用户未授权，需要重新登录');
  }

  /** 增加加载计数 */
  private incrementLoading(): void {
    this.loadingCount++;
    // 可以通过事件总线通知 UI 显示加载状态
  }

  /** 减少加载计数 */
  private decrementLoading(): void {
    this.loadingCount = Math.max(0, this.loadingCount - 1);
  }

  // ============================================
  // 公共方法
  // ============================================

  /** GET 请求 */
  async get<T = any>(
    url: string,
    params?: Record<string, any>,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, {
      ...config,
      params,
    });
    return response.data.data;
  }

  /** POST 请求 */
  async post<T = any>(
    url: string,
    data?: any,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  /** PUT 请求 */
  async put<T = any>(
    url: string,
    data?: any,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  /** DELETE 请求 */
  async delete<T = any>(
    url: string,
    params?: Record<string, any>,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, {
      ...config,
      params,
    });
    return response.data.data;
  }

  /** PATCH 请求 */
  async patch<T = any>(
    url: string,
    data?: any,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  /** 文件上传 */
  async upload<T = any>(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data.data;
  }

  /** 文件下载 */
  async download(
    url: string,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const response = await this.client.get(url, {
      responseType: 'blob',
      onDownloadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  }

  /** 设置 Base URL */
  setBaseURL(baseURL: string): void {
    this.client.defaults.baseURL = baseURL;
  }

  /** 设置认证 Token */
  setToken(token: string): void {
    mmkvStorage.setString('token', token);
  }

  /** 清除认证 Token */
  clearToken(): void {
    mmkvStorage.delete('token');
  }

  /** 获取当前加载状态 */
  getLoadingCount(): number {
    return this.loadingCount;
  }
}

// ============================================
// 导出单例
// ============================================

export const apiClient = new ApiClient();
export default apiClient;
