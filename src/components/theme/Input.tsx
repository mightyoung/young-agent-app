/**
 * 主题化输入框组件
 * 支持两套主题：黑白(Grok) 和 白蓝(Telegram)
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../constants/themeV2';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export function Input({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  ...props
}: InputProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = () => {
    if (error) return theme.colors.error;
    if (isFocused) return theme.colors.accent;
    return theme.colors.inputBorder;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.caption,
            },
          ]}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.colors.inputBackground,
            borderColor: getBorderColor(),
            borderRadius: theme.borderRadius.lg,
          },
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={theme.colors.textTertiary}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            {
              color: theme.colors.text,
              fontSize: theme.typography.body,
            },
            inputStyle,
          ]}
          placeholderTextColor={theme.colors.inputPlaceholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightIcon && (
          <Ionicons
            name={rightIcon}
            size={20}
            color={theme.colors.textTertiary}
            style={styles.rightIcon}
            onPress={onRightIconPress}
          />
        )}
      </View>
      {error && (
        <Text
          style={[
            styles.error,
            {
              color: theme.colors.error,
              fontSize: theme.typography.caption,
            },
          ]}
        >
          {error}
        </Text>
      )}
      {helper && !error && (
        <Text
          style={[
            styles.helper,
            {
              color: theme.colors.textTertiary,
              fontSize: theme.typography.caption,
            },
          ]}
        >
          {helper}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftIcon: {
    marginLeft: 12,
  },
  rightIcon: {
    marginRight: 12,
  },
  error: {
    marginTop: 4,
  },
  helper: {
    marginTop: 4,
  },
});

export default Input;
