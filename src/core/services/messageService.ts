// Message Service - 消息服务
// 包含消息管理和Android推送集成

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Linking } from 'react-native';
import { dbUtils, TableNames } from '../storage/sqlite';
import { apiServices } from '../network';

// ============================================
// 类型定义
// ============================================

/** 消息类型 */
export enum MessageType {
  /** 系统公告 */
  SYSTEM = 1,
  /** 巡检任务 */
  TASK = 2,
  /** 隐患提醒 */
  HAZARD = 3,
  /** 账号安全 */
  SECURITY = 4,
  /** 设备告警 */
  DEVICE_ALERT = 5,
  /** 审批通知 */
  APPROVAL = 6,
}

/** 消息状态 */
export enum MessageStatus {
  /** 未读 */
  UNREAD = 0,
  /** 已读 */
  READ = 1,
}

/** 消息实体 */
export interface Message {
  id: string;
  type: MessageType;
  typeName: string;
  title: string;
  content: string;
  userId: string;
  userName?: string;
  readStatus: boolean;
  readAt?: number;
  relatedId?: string;
  relatedType?: string;
  relatedTitle?: string;
  createdAt: number;
  pushId?: string;
}

/** 推送载荷 */
export interface PushPayload {
  title: string;
  body: string;
  data?: {
    messageId: string;
    type: string;
    relatedId?: string;
    relatedType?: string;
  };
  sound?: 'default' | 'none';
  priority?: 'default' | 'high';
  channelId?: string;
}

/** 跳转配置 */
export interface NavigationConfig {
  screen: string;
  params?: Record<string, any>;
}

// ============================================
// 消息服务
// ============================================

class MessageService {
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private permissionStatus: Notifications.AndroidPermissionStatus | null = null;

  /** 初始化消息服务 */
  async initialize(): Promise<void> {
    // 配置推送通知行为
    this.configureNotifications();

    // 请求推送权限
    await this.requestPermissions();

    // 注册推送令牌
    await this.registerPushToken();

    // 监听推送消息
    this.setupNotificationListeners();

    console.log('[MessageService] 初始化完成');
  }

  /** 配置通知行为 */
  private configureNotifications(): void {
    // 设置通知响应类型
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // 创建Android通知渠道
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: '默认通知',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF0000',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // 隐患提醒渠道
      Notifications.setNotificationChannelAsync('hazard', {
        name: '隐患提醒',
        importance: Notifications.AndroidImportance.HIGH,
        description: '隐患相关通知',
        sound: 'default',
      });

      // 任务提醒渠道
      Notifications.setNotificationChannelAsync('task', {
        name: '任务提醒',
        importance: Notifications.AndroidImportance.DEFAULT,
        description: '巡检任务通知',
        sound: 'default',
      });

      // 系统公告渠道
      Notifications.setNotificationChannelAsync('system', {
        name: '系统公告',
        importance: Notifications.AndroidImportance.LOW,
        description: '系统公告通知',
        sound: 'default',
      });
    }
  }

  /** 请求推送权限 */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('[MessageService] 模拟设备，跳过权限请求');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      this.permissionStatus = existingStatus;

      if (existingStatus === 'granted') {
        console.log('[MessageService] 已有推送权限');
        return true;
      }

      if (existingStatus === 'denied') {
        console.log('[MessageService] 推送权限被拒绝');
        return false;
      }

      const { status } = await Notifications.requestPermissionsAsync();
      this.permissionStatus = status;

      if (status === 'granted') {
        console.log('[MessageService] 推送权限已授予');
        return true;
      }

      console.log('[MessageService] 推送权限未授予');
      return false;
    } catch (error) {
      console.error('[MessageService] 请求权限失败', error);
      return false;
    }
  }

  /** 注册推送令牌 */
  async registerPushToken(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('[MessageService] 模拟设备，跳过令牌注册');
      return null;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync();
      console.log('[MessageService] 推送令牌:', token.data);

      // TODO: 将令牌发送到服务端
      // await apiServices.auth.registerPushToken(token.data);

      return token.data;
    } catch (error) {
      console.error('[MessageService] 注册推送令牌失败', error);
      return null;
    }
  }

  /** 设置通知监听器 */
  private setupNotificationListeners(): void {
    // 收到推送通知
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('[MessageService] 收到通知', notification.request.content.title);
        // 可以在这里处理通知显示
      }
    );

    // 用户点击通知
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('[MessageService] 用户点击通知', response.notification.request.content.title);
        this.handleNotificationTap(response.notification.request.content.data);
      }
    );
  }

  /** 处理通知点击 */
  private async handleNotificationTap(data: any): Promise<void> {
    if (!data) return;

    const { relatedType, relatedId, messageId } = data;

    // 标记消息为已读
    if (messageId) {
      await this.markAsRead(messageId);
    }

    // 根据类型跳转到对应页面
    const navConfig = this.getNavigationConfig(relatedType, relatedId);
    if (navConfig) {
      // TODO: 使用导航服务跳转到对应页面
      console.log('[MessageService] 跳转到', navConfig);
    }
  }

  /** 获取跳转配置 */
  private getNavigationConfig(relatedType?: string, relatedId?: string): NavigationConfig | null {
    if (!relatedType || !relatedId) return null;

    switch (relatedType) {
      case 'hazard':
        return { screen: 'HazardDetail', params: { id: relatedId } };
      case 'task':
        return { screen: 'InspectionDetail', params: { id: relatedId } };
      case 'device':
        return { screen: 'DeviceDetail', params: { id: relatedId } };
      case 'approval':
        return { screen: 'HazardReview', params: { id: relatedId } };
      default:
        return { screen: 'Messages' };
    }
  }

  // ============================================
  // 消息管理方法
  // ============================================

  /** 创建消息 (本地) */
  async createMessage(message: Omit<Message, 'id' | 'createdAt'>): Promise<string> {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const msg = {
      id,
      type: message.type,
      type_name: this.getTypeName(message.type),
      title: message.title,
      content: message.content,
      user_id: message.userId,
      user_name: message.userName,
      read_status: message.readStatus ? 1 : 0,
      read_at: message.readAt,
      related_id: message.relatedId,
      related_type: message.relatedType,
      related_title: message.relatedTitle,
      created_at: now,
    };

    await dbUtils.insert(TableNames.MESSAGE, msg);

    // 如果是当前用户，发送本地通知
    // await this.sendLocalNotification(message);

    return id;
  }

  /** 发送本地通知 */
  async sendLocalNotification(payload: PushPayload): Promise<string> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.log('[MessageService] 无推送权限');
      return '';
    }

    try {
      const channelId = this.getChannelId(payload.data?.type);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data,
          sound: payload.sound || 'default',
          priority: payload.priority || 'default',
        },
        trigger: null, // 立即发送
      });

      console.log('[MessageService] 发送通知成功', notificationId);
      return notificationId;
    } catch (error) {
      console.error('[MessageService] 发送通知失败', error);
      return '';
    }
  }

  /** 获取渠道ID */
  private getChannelId(type?: string): string {
    switch (type) {
      case 'hazard':
        return 'hazard';
      case 'task':
        return 'task';
      case 'system':
        return 'system';
      default:
        return 'default';
    }
  }

  /** 获取类型名称 */
  private getTypeName(type: MessageType): string {
    const names: Record<MessageType, string> = {
      [MessageType.SYSTEM]: '系统公告',
      [MessageType.TASK]: '巡检任务',
      [MessageType.HAZARD]: '隐患提醒',
      [MessageType.SECURITY]: '账号安全',
      [MessageType.DEVICE_ALERT]: '设备告警',
      [MessageType.APPROVAL]: '审批通知',
    };
    return names[type] || '未知';
  }

  /** 获取消息列表 */
  async getMessages(params?: {
    type?: MessageType;
    readStatus?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<{ list: Message[]; total: number }> {
    const { page = 1, pageSize = 20, ...filters } = params || {};

    const conditions: string[] = [];
    const paramsList: any[] = [];

    if (filters.type !== undefined) {
      conditions.push('type = ?');
      paramsList.push(filters.type);
    }
    if (filters.readStatus !== undefined) {
      conditions.push('read_status = ?');
      paramsList.push(filters.readStatus ? 1 : 0);
    }

    const where = conditions.length > 0 ? conditions.join(' AND ') : undefined;

    const result = await dbUtils.queryPage<any>(
      TableNames.MESSAGE,
      page,
      pageSize,
      where,
      'created_at DESC',
      paramsList
    );

    return {
      list: result.list.map(this.rowToMessage),
      total: result.total,
    };
  }

  /** 标记已读 */
  async markAsRead(messageId: string): Promise<void> {
    await dbUtils.update(
      TableNames.MESSAGE,
      { read_status: 1, read_at: Date.now() },
      'id = ?',
      [messageId]
    );

    // 同步到服务端
    try {
      await apiServices.message.markRead(messageId);
    } catch (error) {
      console.log('[MessageService] 同步已读状态失败', error);
    }
  }

  /** 标记全部已读 */
  async markAllAsRead(userId: string): Promise<void> {
    await dbUtils.update(
      TableNames.MESSAGE,
      { read_status: 1, read_at: Date.now() },
      'user_id = ? AND read_status = 0',
      [userId]
    );

    // 同步到服务端
    try {
      await apiServices.message.markAllRead();
    } catch (error) {
      console.log('[MessageService] 同步已读状态失败', error);
    }
  }

  /** 获取未读数量 */
  async getUnreadCount(userId: string): Promise<number> {
    const result = await dbUtils.queryOne<{ count: number }>(
      TableNames.MESSAGE,
      'user_id = ? AND read_status = 0',
      [userId]
    );
    return result?.count || 0;
  }

  /** 删除消息 */
  async deleteMessage(messageId: string): Promise<void> {
    await dbUtils.delete(TableNames.MESSAGE, 'id = ?', [messageId]);

    try {
      await apiServices.message.delete(messageId);
    } catch (error) {
      console.log('[MessageService] 删除远程消息失败', error);
    }
  }

  /** 从服务端同步消息 */
  async syncMessages(): Promise<void> {
    try {
      const result = await apiServices.message.list({ page: 1, pageSize: 50 });

      if (result?.list) {
        for (const msg of result.list) {
          await dbUtils.insertOrReplace(TableNames.MESSAGE, {
            id: msg.id,
            type: msg.type,
            type_name: msg.typeName,
            title: msg.title,
            content: msg.content,
            user_id: msg.userId,
            user_name: msg.userName,
            read_status: msg.readStatus ? 1 : 0,
            read_at: msg.readAt,
            related_id: msg.relatedId,
            related_type: msg.relatedType,
            related_title: msg.relatedTitle,
            created_at: new Date(msg.createdAt).getTime(),
          });
        }
        console.log('[MessageService] 同步消息完成', result.list.length);
      }
    } catch (error) {
      console.error('[MessageService] 同步消息失败', error);
    }
  }

  /** 行转消息对象 */
  private rowToMessage(row: any): Message {
    return {
      id: row.id,
      type: row.type,
      typeName: row.type_name,
      title: row.title,
      content: row.content,
      userId: row.user_id,
      userName: row.user_name,
      readStatus: row.read_status === 1,
      readAt: row.read_at,
      relatedId: row.related_id,
      relatedType: row.related_type,
      relatedTitle: row.related_title,
      createdAt: row.created_at,
    };
  }

  /** 清理资源 */
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
  }
}

// ============================================
// 导出单例
// ============================================

export const messageService = new MessageService();
export default messageService;

// 导出接口供外部使用
export type { Message, PushPayload, NavigationConfig };
