// Input Component - 输入框组件

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';

export type InputSize = 'small' | 'medium' | 'large';

interface InputProps extends Omit<TextInputProps, 'style'> {
  /** 输入框值 */
  value: string;
  /** 值变化事件 */
  onChangeText?: (text: string) => void;
  /** 占位符 */
  placeholder?: string;
  /** 标签 */
  label?: string;
  /** 错误提示 */
  error?: string;
  /** 禁用状态 */
  disabled?: boolean;
  /** 输入框尺寸 */
  size?: InputSize;
  /** 是否显示清除按钮 */
  allowClear?: boolean;
  /** 左侧图标 */
  prefix?: React.ReactNode;
  /** 右侧图标 */
  suffix?: React.ReactNode;
  /** 自定义容器样式 */
  containerStyle?: ViewStyle;
  /** 是否为密码输入 */
  password?: boolean;
  /** 多行文本 */
  multiline?: boolean;
  /** 行数 */
  numberOfLines?: number;
}

/** 统一输入框组件 */
export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  disabled = false,
  size = 'medium',
  allowClear = false,
  prefix,
  suffix,
  containerStyle,
  password = false,
  multiline = false,
  numberOfLines = 1,
  ...rest
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!password);

  const handleClear = () => {
    onChangeText?.('');
  };

  const borderColor = error
    ? '#F5222D'
    : isFocused
    ? '#000000'
    : '#E5E5E5';

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          styles[size],
          { borderColor },
          disabled && styles.disabled,
        ]}
      >
        {prefix && <View style={styles.prefix}>{prefix}</View>}

        <TextInput
          style={[
            styles.input,
            styles[`${size}Input`],
            multiline && styles.multiline,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999999"
          editable={!disabled}
          secureTextEntry={password && !showPassword}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />

        {/* 密码显示切换 */}
        {password && (
          <TouchableOpacity
            style={styles.suffix}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeText}>{showPassword ? '👁' : '👁‍🗨'}</Text>
          </TouchableOpacity>
        )}

        {/* 清除按钮 */}
        {allowClear && value && !disabled && (
          <TouchableOpacity style={styles.suffix} onPress={handleClear}>
            <Text style={styles.clearText}>×</Text>
          </TouchableOpacity>
        )}

        {suffix && !password && !allowClear && (
          <View style={styles.suffix}>{suffix}</View>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  // Sizes
  small: {
    minHeight: 36,
  },
  medium: {
    minHeight: 44,
  },
  large: {
    minHeight: 52,
  },

  input: {
    flex: 1,
    color: '#000000',
    paddingHorizontal: 16,
  },

  smallInput: {
    fontSize: 14,
  },
  mediumInput: {
    fontSize: 16,
  },
  largeInput: {
    fontSize: 18,
  },

  multiline: {
    textAlignVertical: 'top',
    paddingTop: 12,
    minHeight: 100,
  },

  prefix: {
    paddingLeft: 16,
  },
  suffix: {
    paddingRight: 12,
  },

  // Icons
  eyeText: {
    fontSize: 18,
  },
  clearText: {
    fontSize: 20,
    color: '#999999',
    fontWeight: 'bold',
  },

  // States
  disabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },

  error: {
    fontSize: 12,
    color: '#F5222D',
    marginTop: 4,
    marginLeft: 4,
  },
});

export default Input;
