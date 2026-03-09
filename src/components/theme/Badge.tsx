/**
 * 主题化标签组件
 * 支持两套主题：黑白(Grok) 和 白蓝(Telegram)
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../../constants/themeV2';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

export function Badge({
  label,
  variant = 'default',
  size = 'medium',
  style,
}: BadgeProps) {
  const { theme } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: theme.colors.success + '20',
          textColor: theme.colors.success,
        };
      case 'warning':
        return {
          backgroundColor: theme.colors.warning + '20',
          textColor: theme.colors.warning,
        };
      case 'error':
        return {
          backgroundColor: theme.colors.error + '20',
          textColor: theme.colors.error,
        };
      case 'info':
        return {
          backgroundColor: theme.colors.info + '20',
          textColor: theme.colors.info,
        };
      default:
        return {
          backgroundColor: theme.colors.backgroundTertiary,
          textColor: theme.colors.textSecondary,
        };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.backgroundColor,
          borderRadius: theme.borderRadius.sm,
          paddingHorizontal: size === 'small' ? 8 : 12,
          paddingVertical: size === 'small' ? 2 : 4,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: colors.textColor,
            fontSize: size === 'small' ? 10 : 12,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});

export default Badge;
