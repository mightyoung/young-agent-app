// Tag Component - 标签组件

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

export type TagVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
export type TagSize = 'small' | 'medium' | 'large';

interface TagProps {
  /** 标签文字 */
  label: string;
  /** 标签变体 (颜色) */
  variant?: TagVariant;
  /** 标签尺寸 */
  size?: TagSize;
  /** 是否为空心样式 */
  outline?: boolean;
  /** 是否可关闭 */
  closable?: boolean;
  /** 关闭事件 */
  onClose?: () => void;
  /** 自定义样式 */
  style?: ViewStyle;
  /** 颜色覆盖 (优先级高于variant) */
  color?: string;
}

/** 统一标签组件 - 颜色与主题独立 */
export function Tag({
  label,
  variant = 'default',
  size = 'medium',
  outline = false,
  closable = false,
  onClose,
  style,
  color,
}: TagProps) {
  // 颜色映射 (不随主题变化)
  const colorMap: Record<TagVariant, string> = {
    default: '#8C8C8C',  // 灰色 - 待提交
    success: '#52C41A',  // 绿色 - 已验收
    warning: '#FAAD14',  // 黄色 - 待验收
    error: '#F5222D',    // 红色 - 待整改/待确认
    info: '#1890FF',    // 蓝色 - 进行中
  };

  const bgColor = color || colorMap[variant];
  const textColor = outline ? bgColor : '#FFFFFF';

  return (
    <View
      style={[
        styles.base,
        styles[size],
        outline ? styles.outline : { backgroundColor: bgColor },
        outline && { borderColor: bgColor },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          styles[`${size}Text`],
          { color: textColor },
        ]}
      >
        {label}
      </Text>
      {closable && (
        <Text
          style={[styles.closeText, { color: textColor }]}
          onPress={onClose}
        >
          ×
        </Text>
      )}
    </View>
  );
}

// 便捷函数：根据隐患状态获取标签
export function getHazardStatusTag(
  status: string
): { label: string; variant: TagVariant } {
  const statusMap: Record<string, { label: string; variant: TagVariant }> = {
    draft: { label: '草稿', variant: 'default' },
    submitted: { label: '待确认', variant: 'error' },
    confirmed: { label: '已确认', variant: 'warning' },
    rectifying: { label: '整改中', variant: 'info' },
    accepted: { label: '已验收', variant: 'success' },
    rejected: { label: '已退回', variant: 'error' },
  };

  return statusMap[status] || { label: status, variant: 'default' };
}

// 便捷函数：根据巡检状态获取标签
export function getInspectionStatusTag(
  status: string
): { label: string; variant: TagVariant } {
  const statusMap: Record<string, { label: string; variant: TagVariant }> = {
    pending: { label: '待执行', variant: 'default' },
    in_progress: { label: '进行中', variant: 'info' },
    completed: { label: '已完成', variant: 'success' },
    cancelled: { label: '已取消', variant: 'default' },
  };

  return statusMap[status] || { label: status, variant: 'default' };
}

// 便捷函数：根据设备状态获取标签
export function getDeviceStatusTag(
  status: string
): { label: string; variant: TagVariant } {
  const statusMap: Record<string, { label: string; variant: TagVariant }> = {
    normal: { label: '正常', variant: 'success' },
    warning: { label: '警告', variant: 'warning' },
    error: { label: '故障', variant: 'error' },
    offline: { label: '离线', variant: 'default' },
  };

  return statusMap[status] || { label: status, variant: 'default' };
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },

  // Sizes
  small: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    minHeight: 22,
  },
  medium: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    minHeight: 28,
  },
  large: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    minHeight: 34,
  },

  // Text
  text: {
    fontWeight: '600',
  },
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 16,
  },

  // Close
  closeText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Tag;
