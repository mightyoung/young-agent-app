// ActionCard - 引导卡片组件
// 用于首次配置引导和API Key失效提示

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../core/constants/colors';

export interface ActionCardAction {
  label: string;
  action: 'navigate' | 'dismiss' | 'retry';
  target?: string;
}

export interface ActionCardProps {
  content: string;
  actions: ActionCardAction[];
  onAction: (action: ActionCardAction) => void;
  variant?: 'init' | 'expired';
}

export function ActionCard({ content, actions, onAction, variant = 'init' }: ActionCardProps) {
  const isExpired = variant === 'expired';

  return (
    <View style={[styles.container, isExpired && styles.expiredContainer]}>
      {/* 图标 */}
      <View style={[styles.iconContainer, isExpired && styles.expiredIconContainer]}>
        <Ionicons
          name={isExpired ? 'warning' : 'settings-outline'}
          size={24}
          color={isExpired ? colors.warning : colors.primary}
        />
      </View>

      {/* 内容 */}
      <Text style={styles.content}>{content}</Text>

      {/* 操作按钮 */}
      <View style={styles.actions}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.actionButton,
              index === 0 && styles.primaryAction,
              index === 0 && isExpired && styles.expiredPrimaryAction,
            ]}
            onPress={() => onAction(action)}
          >
            <Text
              style={[
                styles.actionText,
                index === 0 && styles.primaryActionText,
              ]}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  expiredContainer: {
    borderLeftColor: colors.warning,
    backgroundColor: '#FFFBE6',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  expiredIconContainer: {
    backgroundColor: `${colors.warning}15`,
  },
  content: {
    fontSize: 14,
    color: '#262626',
    lineHeight: 20,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  primaryAction: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  expiredPrimaryAction: {
    backgroundColor: colors.warning,
    borderColor: colors.warning,
  },
  actionText: {
    fontSize: 14,
    color: '#262626',
    fontWeight: '500',
  },
  primaryActionText: {
    color: '#FFFFFF',
  },
});

export default ActionCard;
