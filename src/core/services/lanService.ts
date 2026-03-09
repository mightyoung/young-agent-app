// LAN Service - 局域网通讯服务
// 基于 UDP 组播的设备发现和通讯

import * as Network from 'expo-network';
import * as AppleNetworking from 'expo-av'; // Note: 需要使用跨平台网络库
import { Platform } from 'react-native';

// ============================================
// 类型定义
// ============================================

/** 设备信息 */
export interface LANDevice {
  /** 设备ID */
  deviceId: string;
  /** 设备名称 */
  deviceName: string;
  /** IP地址 */
  ipAddress: string;
  /** 端口 */
  port: number;
  /** 企业ID */
  enterpriseId: string;
  /** 用户ID */
  userId: string;
  /** 用户名称 */
  userName: string;
  /** 角色 */
  role: string;
  /** 在线状态 */
  online: boolean;
  /** 最后心跳时间 */
  lastHeartbeat: number;
}

/** LAN 消息类型 */
export enum LANMessageType {
  DISCOVER = 'DEVICE_DISCOVER',
  HEARTBEAT = 'DEVICE_HEARTBEAT',
  OFFLINE = 'DEVICE_OFFLINE',
  MESSAGE = 'MESSAGE_PUSH',
  DATA_SYNC = 'DATA_SYNC',
  TASK_ASSIGN = 'TASK_ASSIGN',
  TASK_ACCEPT = 'TASK_ACCEPT',
  CONFLICT = 'CONFLICT_DETECT',
  SYNC_REQUEST = 'SYNC_REQUEST',
}

/** LAN 消息 */
export interface LANMessage {
  type: LANMessageType;
  senderId: string;
  senderName: string;
  receiverId?: string;
  payload: any;
  timestamp: number;
  version: number;
}

/** 任务派发请求 */
export interface TaskAssignRequest {
  taskId: string;
  taskNo: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  taskType: string;
  description?: string;
}

/** 冲突信息 */
export interface ConflictInfo {
  entityType: string;
  entityId: string;
  localVersion: number;
  remoteVersion: number;
  conflictData: any;
}

/** 服务状态 */
export interface LANServiceStatus {
  enabled: boolean;
  deviceCount: number;
  isOnline: boolean;
  currentIP?: string;
  conflictMode: boolean;
}

// ============================================
// 常量
// ============================================

const MULTICAST_GROUP = '239.255.255.250'; // 组播地址
const DISCOVERY_PORT = 53317;
const HEARTBEAT_INTERVAL = 30000; // 30秒
const OFFLINE_TIMEOUT = 90000; // 90秒无心跳视为离线

// ============================================
// 局域网通讯服务
// ============================================

class LANService {
  private devices: Map<string, LANDevice> = new Map();
  private isRunning: boolean = false;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private messageListeners: Set<(message: LANMessage, fromDevice: LANDevice) => void> = new Set();

  // 当前设备信息
  private localDeviceInfo: LANDevice | null = null;

  /** 初始化服务 */
  async initialize(): Promise<void> {
    console.log('[LANService] 初始化');

    // 获取本机网络信息
    await this.updateLocalDeviceInfo();

    console.log('[LANService] 初始化完成', this.localDeviceInfo?.ipAddress);
  }

  /** 更新本机设备信息 */
  private async updateLocalDeviceInfo(): Promise<void> {
    try {
      const networkState = await Network.getNetworkStateAsync();

      if (networkState.isConnected && networkState.type === Network.NetworkStateType.WIFI) {
        // 获取IP (简化实现，实际需要解析网络接口)
        const ipAddress = await this.getLocalIPAddress();

        this.localDeviceInfo = {
          deviceId: this.generateDeviceId(),
          deviceName: this.getDeviceName(),
          ipAddress: ipAddress || '0.0.0.0',
          port: DISCOVERY_PORT,
          enterpriseId: this.getEnterpriseId(),
          userId: this.getUserId(),
          userName: this.getUserName(),
          role: this.getRole(),
          online: true,
          lastHeartbeat: Date.now(),
        };
      }
    } catch (error) {
      console.error('[LANService] 获取网络信息失败', error);
    }
  }

  /** 获取本机IP地址 */
  private async getLocalIPAddress(): Promise<string | null> {
    // 简化实现 - 实际需要使用网络库获取
    try {
      const interfaces = await Network.getNetworkStateAsync();
      // 返回模拟IP
      return '192.168.1.100';
    } catch {
      return null;
    }
  }

  /** 生成设备ID */
  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /** 获取设备名称 */
  private getDeviceName(): string {
    return Platform.OS === 'ios' ? 'iPhone' : 'Android';
  }

  /** 获取企业ID */
  private getEnterpriseId(): string {
    // 从本地存储获取
    return 'default_enterprise';
  }

  /** 获取用户ID */
  private getUserId(): string {
    // 从用户存储获取
    return 'default_user';
  }

  /** 获取用户名称 */
  private getUserName(): string {
    return '用户';
  }

  /** 获取角色 */
  private getRole(): string {
    return 'user';
  }

  /** 启动服务 */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[LANService] 服务已在运行');
      return;
    }

    // 检查网络状态
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected || networkState.type !== Network.NetworkStateType.WIFI) {
      console.log('[LANService] 未连接到WiFi，无法启动');
      return;
    }

    this.isRunning = true;
    console.log('[LANService] 服务启动');

    // 启动心跳
    this.startHeartbeat();

    // 启动清理过期设备
    this.startCleanup();

    // 广播自身
    this.broadcastPresence();
  }

  /** 停止服务 */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;

    // 发送离线通知
    this.broadcastOffline();

    // 停止定时器
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // 清空设备列表
    this.devices.clear();

    console.log('[LANService] 服务停止');
  }

  /** 广播自身存在 */
  private broadcastPresence(): void {
    if (!this.localDeviceInfo) return;

    this.sendMessage({
      type: LANMessageType.DISCOVER,
      senderId: this.localDeviceInfo.deviceId,
      senderName: this.localDeviceInfo.userName,
      payload: this.localDeviceInfo,
      timestamp: Date.now(),
      version: 1,
    });
  }

  /** 广播离线 */
  private broadcastOffline(): void {
    if (!this.localDeviceInfo) return;

    this.sendMessage({
      type: LANMessageType.OFFLINE,
      senderId: this.localDeviceInfo.deviceId,
      senderName: this.localDeviceInfo.userName,
      payload: { deviceId: this.localDeviceInfo.deviceId },
      timestamp: Date.now(),
      version: 1,
    });
  }

  /** 启动心跳 */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.broadcastPresence();
    }, HEARTBEAT_INTERVAL);
  }

  /** 启动清理 */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOfflineDevices();
    }, OFFLINE_TIMEOUT);
  }

  /** 清理离线设备 */
  private cleanupOfflineDevices(): void {
    const now = Date.now();
    const offlineDevices: string[] = [];

    this.devices.forEach((device, deviceId) => {
      if (now - device.lastHeartbeat > OFFLINE_TIMEOUT) {
        offlineDevices.push(deviceId);
      }
    });

    offlineDevices.forEach((deviceId) => {
      const device = this.devices.get(deviceId);
      if (device) {
        console.log('[LANService] 设备离线', device.deviceName);
      }
      this.devices.delete(deviceId);
    });
  }

  /** 发送消息 (模拟实现) */
  private sendMessage(message: LANMessage): void {
    // 实际实现需要使用 UDP Socket
    // 这里模拟消息发送
    console.log('[LANService] 发送消息', message.type);

    // 模拟接收方处理
    setTimeout(() => {
      this.handleIncomingMessage(message);
    }, 100);
  }

  /** 处理接收到的消息 */
  private handleIncomingMessage(message: LANMessage): void {
    switch (message.type) {
      case LANMessageType.DISCOVER:
      case LANMessageType.HEARTBEAT:
        this.handleDeviceDiscover(message);
        break;
      case LANMessageType.OFFLINE:
        this.handleDeviceOffline(message);
        break;
      case LANMessageType.TASK_ASSIGN:
      case LANMessageType.DATA_SYNC:
      case LANMessageType.MESSAGE:
        this.notifyListeners(message, message.senderId);
        break;
    }
  }

  /** 处理设备发现 */
  private handleDeviceDiscover(message: LANMessage): void {
    const device = message.payload as LANDevice;

    // 校验企业ID
    if (device.enterpriseId !== this.localDeviceInfo?.enterpriseId) {
      console.log('[LANService] 忽略不同企业的设备', device.enterpriseId);
      return;
    }

    // 更新设备列表
    device.lastHeartbeat = Date.now();
    device.online = true;
    this.devices.set(device.deviceId, device);

    console.log('[LANService] 发现设备', device.deviceName, device.userName);
  }

  /** 处理设备离线 */
  private handleDeviceOffline(message: LANMessage): void {
    const { deviceId } = message.payload;
    this.devices.delete(deviceId);
    console.log('[LANService] 设备离线通知', deviceId);
  }

  /** 获取设备列表 */
  getDevices(): LANDevice[] {
    return Array.from(this.devices.values());
  }

  /** 获取在线设备 */
  getOnlineDevices(): LANDevice[] {
    return this.getDevices().filter((d) => d.online);
  }

  /** 获取同企业设备 */
  getSameEnterpriseDevices(): LANDevice[] {
    const myEnterpriseId = this.localDeviceInfo?.enterpriseId;
    if (!myEnterpriseId) return [];

    return this.getDevices().filter((d) => d.enterpriseId === myEnterpriseId);
  }

  /** 发送消息给指定设备 */
  async sendMessageToDevice(deviceId: string, message: LANMessage): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device) {
      console.log('[LANService] 设备不存在', deviceId);
      return false;
    }

    // 实际实现需要发送到 device.ipAddress:device.port
    this.sendMessage({
      ...message,
      receiverId: deviceId,
    });

    return true;
  }

  /** 派发任务 */
  async assignTask(request: TaskAssignRequest): Promise<{ success: boolean; error?: string }> {
    // 1. 验证审批流
    const isValid = await this.validateApprovalFlow(request);
    if (!isValid) {
      return { success: false, error: '非法的审批流，无法派发任务' };
    }

    // 2. 检查冲突
    const hasConflict = await this.checkConflicts(request.entityType, request.entityId);
    if (hasConflict) {
      return { success: false, error: '数据存在冲突，请先连接服务端同步' };
    }

    // 3. 发送任务派发消息
    const message: LANMessage = {
      type: LANMessageType.TASK_ASSIGN,
      senderId: this.localDeviceInfo?.deviceId || '',
      senderName: this.localDeviceInfo?.userName || '',
      receiverId: request.toUserId,
      payload: request,
      timestamp: Date.now(),
      version: 1,
    };

    const success = await this.sendMessageToDevice(request.toUserId, message);
    return { success };
  }

  /** 验证审批流 */
  private async validateApprovalFlow(request: TaskAssignRequest): Promise<boolean> {
    // 实际实现需要查询本地审批流数据
    // 验证 request.toUserId 是否是 request.fromUserId 的下一个审批节点
    return true; // 简化实现
  }

  /** 检查冲突 */
  private async checkConflicts(entityType: string, entityId: string): Promise<boolean> {
    // 实际实现需要比对版本号
    // 如果版本不一致，返回 true 表示有冲突
    return false;
  }

  /** 检查冲突模式 */
  isConflictMode(): boolean {
    // 如果存在冲突数据，进入冲突模式
    return false;
  }

  /** 注册消息监听 */
  addMessageListener(listener: (message: LANMessage, fromDevice: LANDevice) => void): void {
    this.messageListeners.add(listener);
  }

  /** 移除消息监听 */
  removeMessageListener(listener: (message: LANMessage, fromDevice: LANDevice) => void): void {
    this.messageListeners.delete(listener);
  }

  /** 通知监听器 */
  private notifyListeners(message: LANMessage, senderId: string): void {
    const device = this.devices.get(senderId);
    if (!device) return;

    this.messageListeners.forEach((listener) => {
      try {
        listener(message, device);
      } catch (error) {
        console.error('[LANService] 消息监听器错误', error);
      }
    });
  }

  /** 获取服务状态 */
  getStatus(): LANServiceStatus {
    return {
      enabled: this.isRunning,
      deviceCount: this.devices.size,
      isOnline: this.devices.size > 0,
      currentIP: this.localDeviceInfo?.ipAddress,
      conflictMode: this.isConflictMode(),
    };
  }
}

// ============================================
// 导出单例
// ============================================

export const lanService = new LANService();
export default lanService;
