// Card Component - 卡片组件

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';

export type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps {
  /** 卡片内容 */
  children: React.ReactNode;
  /** 点击事件 */
  onPress?: () => void;
  /** 卡片样式变体 */
  variant?: CardVariant;
  /** 自定义样式 */
  style?: ViewStyle;
  /** 标题 */
  title?: string;
  /** 标题右侧操作 */
  extra?: React.ReactNode;
  /** 是否显示边框 */
  bordered?: boolean;
}

/** 统一卡片组件 */
export function Card({
  children,
  onPress,
  variant = 'default',
  style,
  title,
  extra,
  bordered = true,
}: CardProps) {
  const cardContent = (
    <View
      style={[
        styles.base,
        styles[variant],
        bordered && styles.bordered,
        style,
      ]}
    >
      {(title || extra) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {extra && <View style={styles.extra}>{extra}</View>}
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },

  // Variants
  default: {
    backgroundColor: '#F5F5F5',
  },
  elevated: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  outlined: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  // Border
  bordered: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  extra: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Content
  content: {
    padding: 20,
  },
});

export default Card;
