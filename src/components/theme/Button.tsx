/**
 * 主题化按钮组件
 * 支持两套主题：黑白(Grok) 和 白蓝(Telegram)
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../../constants/themeV2';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const { theme } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return theme.colors.buttonDisabled;
    switch (variant) {
      case 'primary':
        return theme.colors.button;
      case 'secondary':
        return theme.colors.backgroundSecondary;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return theme.colors.button;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.colors.textTertiary;
    switch (variant) {
      case 'primary':
        return theme.colors.buttonText;
      case 'secondary':
        return theme.colors.text;
      case 'outline':
        return theme.colors.button;
      case 'ghost':
        return theme.colors.text;
      default:
        return theme.colors.buttonText;
    }
  };

  const getBorderColor = () => {
    if (disabled) return theme.colors.border;
    switch (variant) {
      case 'outline':
        return theme.colors.button;
      default:
        return 'transparent';
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          height: 36,
          paddingHorizontal: 16,
        };
      case 'large':
        return {
          height: 56,
          paddingHorizontal: 24,
        };
      default:
        return {
          height: 48,
          paddingHorizontal: 20,
        };
    }
  };

  const getTextSize = (): number => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getSizeStyles(),
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1 : 0,
          borderRadius: theme.borderRadius.lg,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: getTextSize(),
                fontWeight: theme.typography.buttonWeight,
                marginLeft: icon ? 8 : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    textAlign: 'center',
  },
});

export default Button;
