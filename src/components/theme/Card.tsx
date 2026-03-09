/**
 * 主题化卡片组件
 * 支持两套主题：黑白(Grok) 和 白蓝(Telegram)
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../../constants/themeV2';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export function Card({
  children,
  style,
  variant = 'default',
  padding = 'medium',
}: CardProps) {
  const { theme } = useTheme();

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return theme.spacing.sm;
      case 'large':
        return theme.spacing.lg;
      default:
        return theme.spacing.md;
    }
  };

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: theme.colors.card,
          borderWidth: 1,
          borderColor: theme.colors.cardBorder,
        };
      case 'elevated':
        return {
          backgroundColor: theme.colors.card,
          ...theme.shadow.md,
        };
      default:
        return {
          backgroundColor: theme.colors.card,
        };
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: theme.borderRadius.xl,
          padding: getPadding(),
        },
        getVariantStyles(),
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});

export default Card;
