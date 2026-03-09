// ListItem Component - 列表项组件

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ListItemVariant = 'default' | 'primary' | 'danger';

interface ListItemProps {
  /** 标题 */
  title: string;
  /** 副标题 */
  subtitle?: string;
  /** 描述/详情 */
  description?: string;
  /** 左侧图标 */
  leftIcon?: React.ReactNode;
  /** 左侧图片 */
  leftAvatar?: string;
  /** 右侧内容 */
  rightContent?: React.ReactNode;
  /** 右侧文本 */
  rightText?: string;
  /** 右侧箭头 */
  showArrow?: boolean;
  /** 点击事件 */
  onPress?: () => void;
  /** 变体 */
  variant?: ListItemVariant;
  /** 自定义样式 */
  style?: ViewStyle;
  /** 是否显示下边框 */
  bordered?: boolean;
}

/** 统一列表项组件 */
export function ListItem({
  title,
  subtitle,
  description,
  leftIcon,
  leftAvatar,
  rightContent,
  rightText,
  showArrow = false,
  onPress,
  variant = 'default',
  style,
  bordered = true,
}: ListItemProps) {
  const content = (
    <View style={[styles.container, bordered && styles.bordered, style]}>
      {/* 左侧 */}
      <View style={styles.left}>
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        {leftAvatar && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{leftAvatar.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* 中间内容 */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {variant === 'danger' && (
            <View style={styles.dangerDot} />
          )}
        </View>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
        {description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}
      </View>

      {/* 右侧 */}
      <View style={styles.right}>
        {rightContent}
        {rightText && (
          <Text style={styles.rightText} numberOfLines={1}>
            {rightText}
          </Text>
        )}
        {showArrow && (
          <Ionicons name="chevron-forward" size={20} color="#999999" />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

// 便捷组件：带状态标签的列表项
export function ListItemWithStatus({
  title,
  subtitle,
  status,
  statusColor,
  onPress,
  ...props
}: ListItemProps & { status?: string; statusColor?: string }) {
  return (
    <ListItem
      title={title}
      subtitle={subtitle}
      rightContent={
        status ? (
          <View style={[styles.statusBadge, { backgroundColor: statusColor || '#999' }]}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        ) : undefined
      }
      onPress={onPress}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  bordered: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  left: {
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  dangerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F5222D',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  rightText: {
    fontSize: 14,
    color: '#999999',
    marginRight: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ListItem;
