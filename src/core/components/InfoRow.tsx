// InfoRow Component - 信息行组件

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface InfoRowProps {
  /** 标签 */
  label: string;
  /** 值 */
  value: string | React.ReactNode;
  /** 值颜色 */
  valueColor?: string;
  /** 是否需要边框 */
  bordered?: boolean;
  /** 自定义样式 */
  style?: ViewStyle;
  /** 值是否可复制 */
  copyable?: boolean;
}

/** 信息行组件 - 用于详情页属性展示 */
export function InfoRow({
  label,
  value,
  valueColor = '#000000',
  bordered = true,
  style,
}: InfoRowProps) {
  return (
    <View style={[styles.container, bordered && styles.bordered, style]}>
      <Text style={styles.label}>{label}</Text>
      {typeof value === 'string' ? (
        <Text style={[styles.value, { color: valueColor }]} numberOfLines={2}>
          {value}
        </Text>
      ) : (
        <View style={styles.valueNode}>{value}</View>
      )}
    </View>
  );
}

// 分组信息卡片
interface InfoGroupProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function InfoGroup({ title, children, style }: InfoGroupProps) {
  return (
    <View style={[styles.group, style]}>
      {title && <Text style={styles.groupTitle}>{title}</Text>}
      <View style={styles.groupContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  bordered: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  label: {
    fontSize: 16,
    color: '#666666',
    flex: 1,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  valueNode: {
    flex: 2,
    alignItems: 'flex-end',
  },
  group: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  groupContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
});

export default InfoRow;
